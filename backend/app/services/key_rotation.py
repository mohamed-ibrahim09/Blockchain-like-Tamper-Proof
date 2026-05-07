"""Key rotation service for cryptographic keys.

Manages automatic and manual key rotation, key expiration checking,
and key archival for the signing keys used in ECDSA signatures.
"""

from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

from app.core.config import settings
from app.services.crypto_signatures import (
    get_current_key_info,
    get_keys_dir,
    generate_signing_key_pair,
    list_archived_keys,
    rotate_signing_key,
)
from app.services.db import store_key_metadata, get_active_key_metadata, deactivate_key


def _now() -> datetime:
    return datetime.now(timezone.utc)


def should_rotate_key() -> tuple[bool, Optional[str]]:
    """Check if the current signing key should be rotated.
    
    Returns:
        Tuple of (should_rotate, reason)
    """
    # Check key metadata in database
    key_meta = get_active_key_metadata("ecdsa_signing")
    
    if key_meta is None:
        # No key metadata found, check file system
        key_info = get_current_key_info()
        if not key_info["exists"]:
            return True, "No signing key exists"
        
        # Check file age
        key_path = get_keys_dir() / "signing_key_current_private.pem"
        if key_path.exists():
            stat = key_path.stat()
            created_at = datetime.fromtimestamp(stat.st_mtime, timezone.utc)
            
            ttl = timedelta(days=settings.key_ttl_days)
            expires_at = created_at + ttl
            
            if _now() > expires_at:
                return True, f"Key expired (created at {created_at.isoformat()})"
        
        return False, None
    
    # Check database metadata
    created_at = datetime.fromisoformat(key_meta["created_at"])
    
    if key_meta.get("expires_at"):
        expires_at = datetime.fromisoformat(key_meta["expires_at"])
        if _now() > expires_at:
            return True, f"Key expired (expires at {key_meta['expires_at']})"
    
    # Check TTL
    ttl = timedelta(days=settings.key_ttl_days)
    expires_at = created_at + ttl
    
    if _now() > expires_at:
        return True, f"Key exceeded TTL of {settings.key_ttl_days} days"
    
    return False, None


def auto_rotate_if_needed() -> Optional[dict[str, Any]]:
    """Automatically rotate key if it has expired or exceeded TTL.
    
    Returns:
        Rotation result if rotation occurred, None otherwise
    """
    should_rotate, reason = should_rotate_key()
    
    if not should_rotate:
        return None
    
    # Perform rotation
    result = perform_key_rotation(manual=False, reason=reason)
    return result


def perform_key_rotation(manual: bool = True, reason: Optional[str] = None) -> dict[str, Any]:
    """Perform a key rotation.
    
    Args:
        manual: Whether this was a manual rotation (vs automatic)
        reason: Reason for rotation
        
    Returns:
        Rotation result with new key info
    """
    # Get current key info before rotation
    old_key_info = get_current_key_info()
    
    # Archive old key in database if exists
    if old_key_info["exists"]:
        old_key_meta = get_active_key_metadata("ecdsa_signing")
        if old_key_meta:
            deactivate_key(old_key_meta["id"])
    
    # Perform file-based rotation
    rotation_result = rotate_signing_key()
    
    # Store new key metadata
    key_path = str(get_keys_dir() / "signing_key_current_private.pem")
    expires_at = _now() + timedelta(days=settings.key_ttl_days)
    
    new_key_meta = store_key_metadata(
        key_type="ecdsa_signing",
        key_path=key_path,
        expires_at=expires_at,
    )
    
    return {
        "success": True,
        "manual": manual,
        "reason": reason,
        "rotated_at": _now().isoformat(),
        "old_key": old_key_info,
        "new_key": {
            "key_id": rotation_result.get("new_key_id"),
            "algorithm": rotation_result.get("algorithm"),
            "fingerprint": rotation_result.get("fingerprint"),
            "created_at": rotation_result.get("created_at"),
            "expires_at": expires_at.isoformat(),
            "metadata_id": new_key_meta["id"],
        },
    }


def get_key_status() -> dict[str, Any]:
    """Get comprehensive key status information.
    
    Returns:
        Status dictionary with current key and rotation info
    """
    current_key = get_current_key_info()
    archived_keys = list_archived_keys()
    
    # Check if rotation is needed
    should_rotate, reason = should_rotate_key()
    
    # Get TTL info
    ttl_days = settings.key_ttl_days
    
    rotation_info = {
        "should_rotate": should_rotate,
        "reason": reason,
        "ttl_days": ttl_days,
    }
    
    if current_key["exists"] and current_key.get("created_at"):
        try:
            created_at = datetime.fromisoformat(current_key["created_at"])
            expires_at = created_at + timedelta(days=ttl_days)
            
            rotation_info["current_key_created_at"] = current_key["created_at"]
            rotation_info["current_key_expires_at"] = expires_at.isoformat()
            rotation_info["days_until_expiry"] = max(0, (expires_at - _now()).days)
        except (ValueError, TypeError):
            pass
    
    return {
        "current_key": current_key,
        "archived_keys": archived_keys,
        "archived_count": len(archived_keys),
        "rotation_info": rotation_info,
    }


def force_key_rotation(admin_username: str, reason: str) -> dict[str, Any]:
    """Force a key rotation (admin operation).
    
    Args:
        admin_username: Username of admin performing rotation
        reason: Reason for forced rotation
        
    Returns:
        Rotation result
    """
    full_reason = f"Admin rotation by {admin_username}: {reason}"
    return perform_key_rotation(manual=True, reason=full_reason)


def check_key_health() -> dict[str, Any]:
    """Check the health status of the signing key.
    
    Returns:
        Health check result
    """
    key_info = get_current_key_info()
    
    status = {
        "healthy": False,
        "checks": {},
        "issues": [],
    }
    
    # Check 1: Key exists
    if not key_info["exists"]:
        status["checks"]["key_exists"] = False
        status["issues"].append("No signing key exists")
    else:
        status["checks"]["key_exists"] = True
    
    # Check 2: Not expired
    should_rotate, reason = should_rotate_key()
    if should_rotate:
        status["checks"]["not_expired"] = False
        status["issues"].append(f"Key needs rotation: {reason}")
    else:
        status["checks"]["not_expired"] = True
    
    # Check 3: Valid algorithm
    if key_info.get("algorithm") == "ECDSA-P256":
        status["checks"]["valid_algorithm"] = True
    else:
        status["checks"]["valid_algorithm"] = False
        status["issues"].append("Key uses unexpected algorithm")
    
    # Overall health
    status["healthy"] = all(status["checks"].values())
    
    return status
