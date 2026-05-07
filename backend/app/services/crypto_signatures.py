"""ECDSA cryptographic signatures for tamper-proof logging.

Provides digital signature generation and verification using ECDSA (P-256 curve).
Each log block is signed to provide cryptographic proof of integrity.
"""

import base64
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional, Tuple

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.ec import (
    EllipticCurvePrivateKey,
    EllipticCurvePublicKey,
)

from app.core.config import settings

# Use P-256 (secp256r1) for ECDSA - widely supported and secure
CURVE = ec.SECP256R1()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def get_keys_dir() -> Path:
    """Get the directory for storing signing keys."""
    keys_dir = settings.resolved_storage_dir / "keys"
    keys_dir.mkdir(parents=True, exist_ok=True)
    return keys_dir


def generate_signing_key_pair(key_name: str = "signing_key") -> Tuple[EllipticCurvePrivateKey, str]:
    """Generate a new ECDSA key pair for signing.
    
    Args:
        key_name: Name for the key pair (used in filename)
        
    Returns:
        Tuple of (private_key, key_id)
    """
    private_key = ec.generate_private_key(CURVE, default_backend())
    
    # Create unique key ID based on timestamp
    key_id = f"{key_name}_{_now().strftime('%Y%m%d_%H%M%S')}"
    
    # Save private key
    keys_dir = get_keys_dir()
    private_path = keys_dir / f"{key_id}_private.pem"
    
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    private_path.write_bytes(private_pem)
    
    # Save public key
    public_key = private_key.public_key()
    public_path = keys_dir / f"{key_id}_public.pem"
    
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    public_path.write_bytes(public_pem)
    
    # Also save as the "current" key for easy reference
    current_private = keys_dir / f"{key_name}_current_private.pem"
    current_public = keys_dir / f"{key_name}_current_public.pem"
    current_private.write_bytes(private_pem)
    current_public.write_bytes(public_pem)
    
    return private_key, key_id


def load_private_key(key_path: Optional[Path] = None) -> Optional[EllipticCurvePrivateKey]:
    """Load a private key from file.
    
    Args:
        key_path: Path to private key file. If None, loads current signing key.
        
    Returns:
        Private key object or None if key doesn't exist.
    """
    if key_path is None:
        key_path = get_keys_dir() / "signing_key_current_private.pem"
    
    if not key_path.exists():
        return None
    
    try:
        pem_data = key_path.read_bytes()
        private_key = serialization.load_pem_private_key(
            pem_data,
            password=None,
            backend=default_backend()
        )
        return private_key
    except Exception:
        return None


def load_public_key(key_path: Optional[Path] = None) -> Optional[EllipticCurvePublicKey]:
    """Load a public key from file.
    
    Args:
        key_path: Path to public key file. If None, loads current public key.
        
    Returns:
        Public key object or None if key doesn't exist.
    """
    if key_path is None:
        key_path = get_keys_dir() / "signing_key_current_public.pem"
    
    if not key_path.exists():
        return None
    
    try:
        pem_data = key_path.read_bytes()
        public_key = serialization.load_pem_public_key(
            pem_data,
            backend=default_backend()
        )
        return public_key
    except Exception:
        return None


def ensure_signing_key_exists() -> EllipticCurvePrivateKey:
    """Ensure a signing key exists, generating one if needed.
    
    Returns:
        Private key object
    """
    private_key = load_private_key()
    if private_key is None:
        private_key, _ = generate_signing_key_pair()
    return private_key


def serialize_for_signing(data: dict[str, Any]) -> str:
    """Serialize data for signing in a canonical, deterministic way.
    
    Args:
        data: Dictionary of data to serialize
        
    Returns:
        Canonical JSON string for signing
    """
    # Create a deterministic representation
    # Sort keys and use compact encoding
    canonical = {
        "id": data.get("id"),
        "encrypted_message": data.get("encrypted_message"),
        "algorithm": data.get("algorithm"),
        "previous_hash": data.get("previous_hash"),
        "current_hash": data.get("current_hash"),
        "created_at": data.get("created_at"),
    }
    
    # Remove None values
    canonical = {k: v for k, v in canonical.items() if v is not None}
    
    return json.dumps(canonical, sort_keys=True, separators=(',', ':'))


def sign_block(data: dict[str, Any], private_key: Optional[EllipticCurvePrivateKey] = None) -> dict[str, str]:
    """Sign a log block using ECDSA.
    
    Args:
        data: The log block data to sign
        private_key: Optional private key (uses current if not provided)
        
    Returns:
        Dictionary with signature details
    """
    if private_key is None:
        private_key = ensure_signing_key_exists()
    
    # Serialize data canonically
    message = serialize_for_signing(data)
    message_bytes = message.encode('utf-8')
    
    # Hash the message first (ECDSA requires hashing)
    message_hash = hashlib.sha256(message_bytes).digest()
    
    # Sign the hash
    signature = private_key.sign(
        message_hash,
        ec.ECDSA(hashes.SHA256())
    )
    
    # Get public key for reference
    public_key = private_key.public_key()
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    # Encode signature as base64 for storage
    signature_b64 = base64.b64encode(signature).decode('utf-8')
    
    return {
        "signature": signature_b64,
        "algorithm": "ECDSA-P256-SHA256",
        "public_key": public_bytes.decode('utf-8'),
    }


def verify_block_signature(
    data: dict[str, Any],
    signature_b64: str,
    public_key_pem: str,
) -> bool:
    """Verify a block signature.
    
    Args:
        data: The log block data that was signed
        signature_b64: Base64-encoded signature
        public_key_pem: PEM-encoded public key
        
    Returns:
        True if signature is valid, False otherwise
    """
    try:
        # Load public key
        public_key = serialization.load_pem_public_key(
            public_key_pem.encode('utf-8'),
            backend=default_backend()
        )
        
        if not isinstance(public_key, EllipticCurvePublicKey):
            return False
        
        # Serialize data the same way it was signed
        message = serialize_for_signing(data)
        message_bytes = message.encode('utf-8')
        message_hash = hashlib.sha256(message_bytes).digest()
        
        # Decode signature
        signature = base64.b64decode(signature_b64)
        
        # Verify
        public_key.verify(
            signature,
            message_hash,
            ec.ECDSA(hashes.SHA256())
        )
        return True
    except InvalidSignature:
        return False
    except Exception:
        return False


def get_current_key_info() -> dict[str, Any]:
    """Get information about the current signing key.
    
    Returns:
        Dictionary with key information
    """
    public_key = load_public_key()
    if public_key is None:
        return {
            "exists": False,
            "algorithm": "ECDSA-P256",
        }
    
    # Get key fingerprint
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    fingerprint = hashlib.sha256(public_bytes).hexdigest()[:16]
    
    # Find key file modification time
    key_path = get_keys_dir() / "signing_key_current_private.pem"
    created_at = None
    if key_path.exists():
        stat = key_path.stat()
        created_at = datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat()
    
    return {
        "exists": True,
        "algorithm": "ECDSA-P256",
        "fingerprint": fingerprint,
        "created_at": created_at,
        "public_key_pem": public_bytes.decode('utf-8'),
    }


def rotate_signing_key() -> dict[str, Any]:
    """Generate a new signing key and archive the old one.
    
    Returns:
        Dictionary with new key information
    """
    keys_dir = get_keys_dir()
    
    # Archive current key if it exists
    current_private = keys_dir / "signing_key_current_private.pem"
    current_public = keys_dir / "signing_key_current_public.pem"
    
    if current_private.exists() and current_public.exists():
        archive_timestamp = _now().strftime('%Y%m%d_%H%M%S')
        
        # Archive private key
        archived_private = keys_dir / f"signing_key_archived_{archive_timestamp}_private.pem"
        current_private.rename(archived_private)
        
        # Archive public key
        archived_public = keys_dir / f"signing_key_archived_{archive_timestamp}_public.pem"
        current_public.rename(archived_public)
    
    # Generate new key
    _, key_id = generate_signing_key_pair()
    
    info = get_current_key_info()
    info["new_key_id"] = key_id
    info["rotated_at"] = _now().isoformat()
    
    return info


def list_archived_keys() -> list[dict[str, Any]]:
    """List all archived signing keys.
    
    Returns:
        List of archived key information
    """
    keys_dir = get_keys_dir()
    archived = []
    
    for file in keys_dir.iterdir():
        if "archived" in file.name and file.suffix == ".pem":
            # Extract timestamp from filename
            parts = file.stem.split("_")
            if len(parts) >= 3:
                try:
                    timestamp = "_".join(parts[2:4])  # YYYYMMDD_HHMMSS
                    dt = datetime.strptime(timestamp, "%Y%m%d_%H%M%S")
                    
                    key_type = "private" if "private" in file.name else "public"
                    
                    archived.append({
                        "key_id": file.stem,
                        "type": key_type,
                        "archived_at": dt.replace(tzinfo=timezone.utc).isoformat(),
                        "path": str(file),
                    })
                except ValueError:
                    continue
    
    # Sort by archived_at descending
    archived.sort(key=lambda x: x["archived_at"], reverse=True)
    return archived
