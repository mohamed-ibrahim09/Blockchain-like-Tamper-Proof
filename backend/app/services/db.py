"""SQLite database service using Python's built-in sqlite3 module.

This module provides database connectivity for user management, audit trails,
and serves as the primary storage backend with JSONL fallback support.
"""

import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from app.core.config import settings

# Thread-local storage for connection pooling
_local = threading.local()


def get_db_path() -> Path:
    """Get the path to the SQLite database file."""
    return settings.resolved_storage_dir / "securelog.db"


@contextmanager
def get_db_connection():
    """Get a database connection with row factory configured.
    
    Yields:
        sqlite3.Connection: Database connection with row factory set to sqlite3.Row
    """
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    """Initialize the database with all required tables."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Audit trail table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_trail (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                username TEXT NOT NULL,
                action TEXT NOT NULL,
                resource TEXT,
                resource_id TEXT,
                ip_address TEXT,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # API keys table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS api_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                key_hash TEXT UNIQUE NOT NULL,
                name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_used_at TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Key metadata table for rotation tracking
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS key_metadata (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key_type TEXT NOT NULL,
                key_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )
        """)
        
        # Create index on audit_trail for faster queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_trail(user_id)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_trail(action)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_trail(created_at)
        """)
        
        conn.commit()


# User-related functions

def create_user(username: str, password_hash: str, first_name: str) -> dict[str, Any]:
    """Create a new user.
    
    Args:
        username: Unique username
        password_hash: Hashed password
        first_name: User's first name
        
    Returns:
        Dict with user details including id
        
    Raises:
        sqlite3.IntegrityError: If username already exists
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO users (username, password_hash, first_name)
            VALUES (?, ?, ?)
            """,
            (username, password_hash, first_name)
        )
        user_id = cursor.lastrowid
        
        cursor.execute(
            "SELECT id, username, first_name, created_at FROM users WHERE id = ?",
            (user_id,)
        )
        row = cursor.fetchone()
        
        return {
            "id": row["id"],
            "username": row["username"],
            "first_name": row["first_name"],
            "created_at": row["created_at"],
        }


def get_user_by_username(username: str) -> Optional[dict[str, Any]]:
    """Get user by username.
    
    Args:
        username: Username to lookup
        
    Returns:
        User dict if found, None otherwise
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, username, password_hash, first_name, created_at
            FROM users WHERE username = ?
            """,
            (username,)
        )
        row = cursor.fetchone()
        
        if row is None:
            return None
            
        return {
            "id": row["id"],
            "username": row["username"],
            "password_hash": row["password_hash"],
            "first_name": row["first_name"],
            "created_at": row["created_at"],
        }


def get_user_by_id(user_id: int) -> Optional[dict[str, Any]]:
    """Get user by ID.
    
    Args:
        user_id: User ID to lookup
        
    Returns:
        User dict if found, None otherwise
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, username, first_name, created_at
            FROM users WHERE id = ?
            """,
            (user_id,)
        )
        row = cursor.fetchone()
        
        if row is None:
            return None
            
        return {
            "id": row["id"],
            "username": row["username"],
            "first_name": row["first_name"],
            "created_at": row["created_at"],
        }


# Audit trail functions

def log_audit_event(
    user_id: Optional[int],
    username: str,
    action: str,
    resource: Optional[str] = None,
    resource_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[str] = None,
) -> dict[str, Any]:
    """Log an audit event.
    
    Args:
        user_id: User ID (None for anonymous/system actions)
        username: Username string
        action: Action type (e.g., "CREATE_LOG", "USER_LOGIN")
        resource: Resource type (e.g., "log", "chain")
        resource_id: Resource identifier
        ip_address: Client IP address
        details: Additional details as JSON string
        
    Returns:
        Audit event dict
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO audit_trail 
            (user_id, username, action, resource, resource_id, ip_address, details)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, username, action, resource, resource_id, ip_address, details)
        )
        event_id = cursor.lastrowid
        
        cursor.execute(
            """
            SELECT id, user_id, username, action, resource, resource_id, 
                   ip_address, details, created_at
            FROM audit_trail WHERE id = ?
            """,
            (event_id,)
        )
        row = cursor.fetchone()
        
        return {
            "id": row["id"],
            "user_id": row["user_id"],
            "username": row["username"],
            "action": row["action"],
            "resource": row["resource"],
            "resource_id": row["resource_id"],
            "ip_address": row["ip_address"],
            "details": row["details"],
            "created_at": row["created_at"],
        }


def get_audit_events(
    limit: int = 50,
    offset: int = 0,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
) -> tuple[list[dict[str, Any]], int]:
    """Get audit events with filtering.
    
    Args:
        limit: Maximum number of events to return
        offset: Offset for pagination
        user_id: Filter by user ID
        action: Filter by action type
        
    Returns:
        Tuple of (events list, total count)
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Build WHERE clause
        where_clauses = []
        params = []
        
        if user_id is not None:
            where_clauses.append("user_id = ?")
            params.append(user_id)
        if action:
            where_clauses.append("action = ?")
            params.append(action)
            
        where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        # Get total count
        count_sql = f"SELECT COUNT(*) FROM audit_trail {where_sql}"
        cursor.execute(count_sql, params)
        total = cursor.fetchone()[0]
        
        # Get events
        query_sql = f"""
            SELECT id, user_id, username, action, resource, resource_id,
                   ip_address, details, created_at
            FROM audit_trail
            {where_sql}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        cursor.execute(query_sql, params + [limit, offset])
        
        events = []
        for row in cursor.fetchall():
            events.append({
                "id": row["id"],
                "user_id": row["user_id"],
                "username": row["username"],
                "action": row["action"],
                "resource": row["resource"],
                "resource_id": row["resource_id"],
                "ip_address": row["ip_address"],
                "details": row["details"],
                "created_at": row["created_at"],
            })
            
        return events, total


# API key functions

def create_api_key(user_id: int, key_hash: str, name: Optional[str] = None) -> dict[str, Any]:
    """Store a new API key hash.
    
    Args:
        user_id: User ID
        key_hash: Hashed API key
        name: Optional name for the key
        
    Returns:
        API key record
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO api_keys (user_id, key_hash, name)
            VALUES (?, ?, ?)
            """,
            (user_id, key_hash, name)
        )
        key_id = cursor.lastrowid
        
        cursor.execute(
            """
            SELECT id, user_id, name, created_at, is_active
            FROM api_keys WHERE id = ?
            """,
            (key_id,)
        )
        row = cursor.fetchone()
        
        return {
            "id": row["id"],
            "user_id": row["user_id"],
            "name": row["name"],
            "created_at": row["created_at"],
            "is_active": bool(row["is_active"]),
        }


def get_api_key_by_hash(key_hash: str) -> Optional[dict[str, Any]]:
    """Get API key by hash.
    
    Args:
        key_hash: Hashed API key
        
    Returns:
        API key record with user info if found and active
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT ak.id, ak.user_id, ak.name, ak.created_at, ak.is_active,
                   u.username, u.first_name
            FROM api_keys ak
            JOIN users u ON ak.user_id = u.id
            WHERE ak.key_hash = ? AND ak.is_active = 1
            """,
            (key_hash,)
        )
        row = cursor.fetchone()
        
        if row is None:
            return None
            
        return {
            "id": row["id"],
            "user_id": row["user_id"],
            "name": row["name"],
            "created_at": row["created_at"],
            "is_active": bool(row["is_active"]),
            "username": row["username"],
            "first_name": row["first_name"],
        }


def update_api_key_last_used(key_id: int) -> None:
    """Update the last_used timestamp for an API key."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE api_keys 
            SET last_used_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (key_id,)
        )


# Key metadata functions

def store_key_metadata(key_type: str, key_path: str, expires_at: Optional[datetime] = None) -> dict[str, Any]:
    """Store signing key metadata.
    
    Args:
        key_type: Type of key (e.g., "ecdsa_signing")
        key_path: Path to the key file
        expires_at: Optional expiration timestamp
        
    Returns:
        Key metadata record
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        expires_str = expires_at.isoformat() if expires_at else None
        
        cursor.execute(
            """
            INSERT INTO key_metadata (key_type, key_path, expires_at)
            VALUES (?, ?, ?)
            """,
            (key_type, key_path, expires_str)
        )
        key_id = cursor.lastrowid
        
        cursor.execute(
            """
            SELECT id, key_type, key_path, created_at, expires_at, is_active
            FROM key_metadata WHERE id = ?
            """,
            (key_id,)
        )
        row = cursor.fetchone()
        
        return {
            "id": row["id"],
            "key_type": row["key_type"],
            "key_path": row["key_path"],
            "created_at": row["created_at"],
            "expires_at": row["expires_at"],
            "is_active": bool(row["is_active"]),
        }


def get_active_key_metadata(key_type: str) -> Optional[dict[str, Any]]:
    """Get the currently active key metadata for a key type.
    
    Args:
        key_type: Type of key to lookup
        
    Returns:
        Key metadata if found, None otherwise
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, key_type, key_path, created_at, expires_at, is_active
            FROM key_metadata
            WHERE key_type = ? AND is_active = 1
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (key_type,)
        )
        row = cursor.fetchone()
        
        if row is None:
            return None
            
        return {
            "id": row["id"],
            "key_type": row["key_type"],
            "key_path": row["key_path"],
            "created_at": row["created_at"],
            "expires_at": row["expires_at"],
            "is_active": bool(row["is_active"]),
        }


def deactivate_key(key_id: int) -> None:
    """Deactivate a key by ID."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE key_metadata SET is_active = 0 WHERE id = ?",
            (key_id,)
        )


# Database stats

def get_db_stats() -> dict[str, Any]:
    """Get database statistics.
    
    Returns:
        Dict with table row counts and file size
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        stats = {
            "tables": {},
            "db_file_size_bytes": 0,
            "db_path": str(get_db_path()),
        }
        
        tables = ["users", "audit_trail", "api_keys", "key_metadata"]
        for table in tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                stats["tables"][table] = cursor.fetchone()[0]
            except sqlite3.OperationalError:
                stats["tables"][table] = 0
                
        try:
            stats["db_file_size_bytes"] = get_db_path().stat().st_size
        except OSError:
            pass
            
        return stats
