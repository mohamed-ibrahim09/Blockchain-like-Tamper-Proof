"""Cryptographic schemas for signatures, Merkle trees, and key management."""

from typing import Any, Optional
from pydantic import BaseModel, Field


# Digital Signature Schemas

class SignatureData(BaseModel):
    """Digital signature data attached to a log entry."""
    signature: str
    algorithm: str = "ECDSA-P256-SHA256"
    public_key: str


class SignatureVerificationRequest(BaseModel):
    """Request to verify a signature."""
    log_id: int
    signature: str
    public_key: str


class SignatureVerificationResponse(BaseModel):
    """Response from signature verification."""
    valid: bool
    log_id: int
    algorithm: str
    message: str


class SignatureInfoResponse(BaseModel):
    """Current signing key information."""
    exists: bool
    algorithm: Optional[str] = None
    fingerprint: Optional[str] = None
    created_at: Optional[str] = None
    public_key_pem: Optional[str] = None


# Merkle Tree Schemas

class MerkleSiblingNode(BaseModel):
    """A sibling node in a Merkle proof path."""
    hash: str
    side: str  # "left" or "right"


class MerkleProofResponse(BaseModel):
    """Merkle inclusion proof for a log entry."""
    leaf_index: int
    leaf_hash: str
    siblings: list[MerkleSiblingNode]
    root_hash: str
    hash_algorithm: str = "SHA-256"


class MerkleTreeInfoResponse(BaseModel):
    """Information about the current Merkle tree."""
    root_hash: Optional[str]
    leaf_count: int
    valid: bool
    message: str
    leaf_hashes: list[str] = []
    log_ids: list[int] = []


class MerkleProofVerificationRequest(BaseModel):
    """Request to verify a Merkle proof."""
    log_id: int
    leaf_hash: str
    siblings: list[MerkleSiblingNode]
    root_hash: str


class MerkleProofVerificationResponse(BaseModel):
    """Response from Merkle proof verification."""
    valid: bool
    log_id: int
    computed_root: str
    expected_root: str
    message: str


# Key Rotation Schemas

class KeyRotationRequest(BaseModel):
    """Request to manually rotate the signing key."""
    reason: Optional[str] = Field(default="Manual key rotation", max_length=200)


class KeyInfo(BaseModel):
    """Key information in rotation response."""
    key_id: Optional[str] = None
    algorithm: Optional[str] = None
    fingerprint: Optional[str] = None
    created_at: Optional[str] = None
    expires_at: Optional[str] = None
    metadata_id: Optional[int] = None


class KeyRotationResponse(BaseModel):
    """Response from key rotation operation."""
    success: bool
    manual: bool
    reason: Optional[str] = None
    rotated_at: str
    old_key: dict[str, Any]
    new_key: KeyInfo


class ArchivedKeyInfo(BaseModel):
    """Information about an archived key."""
    key_id: str
    type: str
    archived_at: str
    path: str


class KeyRotationInfo(BaseModel):
    """Key rotation status information."""
    should_rotate: bool
    reason: Optional[str] = None
    ttl_days: int
    current_key_created_at: Optional[str] = None
    current_key_expires_at: Optional[str] = None
    days_until_expiry: Optional[int] = None


class KeyStatusResponse(BaseModel):
    """Comprehensive key status."""
    current_key: SignatureInfoResponse
    archived_keys: list[ArchivedKeyInfo]
    archived_count: int
    rotation_info: KeyRotationInfo


class KeyHealthCheck(BaseModel):
    """Key health check result."""
    healthy: bool
    checks: dict[str, bool]
    issues: list[str]
