"""Cryptographic router for signatures, Merkle trees, and key management.

Provides endpoints for:
- Digital signature operations
- Merkle tree building and proofs
- Key rotation and management
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.routers.auth import get_current_user
from app.schemas.crypto import (
    KeyRotationRequest,
    KeyRotationResponse,
    KeyStatusResponse,
    KeyHealthCheck,
    MerkleProofResponse,
    MerkleProofVerificationRequest,
    MerkleProofVerificationResponse,
    MerkleTreeInfoResponse,
    SignatureInfoResponse,
    SignatureVerificationResponse,
)
from app.services.crypto_signatures import (
    get_current_key_info,
    verify_block_signature,
    ensure_signing_key_exists,
)
from app.services.key_rotation import (
    auto_rotate_if_needed,
    check_key_health,
    force_key_rotation,
    get_key_status,
)
from app.services.log_service import get_log_or_404, get_logs, serialize_log
from app.services.merkle import (
    build_merkle_tree_from_logs,
    format_proof_for_api,
    hash_data,
    verify_chain_with_merkle,
)

router = APIRouter(prefix="/crypto", tags=["Cryptography"])


# Signature endpoints

@router.get("/signatures/key-info", response_model=SignatureInfoResponse)
def get_signature_key_info(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> SignatureInfoResponse:
    """Get information about the current signing key."""
    info = get_current_key_info()
    return SignatureInfoResponse(**info)


@router.post("/signatures/generate-key", response_model=SignatureInfoResponse)
def generate_initial_signing_key(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> SignatureInfoResponse:
    """Generate an initial signing key if none exists."""
    info = get_current_key_info()
    if info["exists"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A signing key already exists. Use key rotation instead.",
        )
    ensure_signing_key_exists()
    info = get_current_key_info()
    return SignatureInfoResponse(**info)


@router.post("/signatures/verify/{log_id}", response_model=SignatureVerificationResponse)
def verify_signature(
    log_id: int,
    request: Request,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> SignatureVerificationResponse:
    """Verify the digital signature of a log entry."""
    log = get_log_or_404(log_id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Log entry not found",
        )
    
    # Check if log has signature data
    if "signature" not in log or not log.get("signature"):
        return SignatureVerificationResponse(
            valid=False,
            log_id=log_id,
            algorithm="none",
            message="Log entry does not have a digital signature",
        )
    
    sig_data = log.get("signature", {})
    
    valid = verify_block_signature(
        data=log,
        signature_b64=sig_data.get("signature", ""),
        public_key_pem=sig_data.get("public_key", ""),
    )
    
    return SignatureVerificationResponse(
        valid=valid,
        log_id=log_id,
        algorithm=sig_data.get("algorithm", "unknown"),
        message="Signature is valid" if valid else "Signature verification failed",
    )


# Merkle Tree endpoints

@router.get("/merkle/tree", response_model=MerkleTreeInfoResponse)
def get_merkle_tree_info(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> MerkleTreeInfoResponse:
    """Get information about the current Merkle tree built from all logs."""
    logs = get_logs()
    result = verify_chain_with_merkle(logs)
    return MerkleTreeInfoResponse(
        root_hash=result["root_hash"],
        leaf_count=result["leaf_count"],
        valid=result["valid"],
        message=result["message"],
        leaf_hashes=result.get("leaf_hashes", []),
        log_ids=result.get("log_ids", []),
    )


@router.get("/merkle/proof/{log_id}", response_model=MerkleProofResponse)
def get_merkle_proof(
    log_id: int,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> MerkleProofResponse:
    """Get a Merkle inclusion proof for a specific log entry."""
    # Get all logs to build tree
    logs = get_logs()
    
    # Find the index of the requested log
    log_index = None
    for i, log in enumerate(logs):
        if log.get("id") == log_id:
            log_index = i
            break
    
    if log_index is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Log entry not found in chain",
        )
    
    # Build tree and get proof
    tree = build_merkle_tree_from_logs(logs)
    proof = tree.get_proof(log_index)
    
    if proof is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not generate Merkle proof",
        )
    
    formatted = format_proof_for_api(proof)
    return MerkleProofResponse(**formatted)


@router.post("/merkle/verify", response_model=MerkleProofVerificationResponse)
def verify_merkle_proof(
    payload: MerkleProofVerificationRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> MerkleProofVerificationResponse:
    """Verify a Merkle inclusion proof."""
    # Get the log data
    logs = get_logs()
    log = None
    for l in logs:
        if l.get("id") == payload.log_id:
            log = l
            break
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Log entry not found",
        )
    
    # Build tree from current logs
    tree = build_merkle_tree_from_logs(logs)
    
    # Reconstruct proof object
    proof = {
        "leaf_index": 0,  # Not needed for verification
        "leaf_hash": payload.leaf_hash,
        "siblings": [{"hash": s.hash, "side": s.side} for s in payload.siblings],
        "root_hash": payload.root_hash,
    }
    
    # Prepare leaf data
    leaf_data = {
        "id": log.get("id"),
        "current_hash": log.get("current_hash"),
        "previous_hash": log.get("previous_hash"),
        "encrypted_message": log.get("encrypted_message"),
        "algorithm": log.get("algorithm"),
        "created_at": log.get("created_at"),
    }
    
    # Verify using the tree's own method
    valid = tree.verify_proof(leaf_data, proof)

    # Ensure the proof's root hash matches the current tree's root hash
    if valid and payload.root_hash != tree.get_root_hash():
        valid = False

    # Compute the root from the proof path for the response
    current_hash = hash_data(leaf_data)
    for sibling in proof["siblings"]:
        if sibling["side"] == "left":
            combined = sibling["hash"] + current_hash
        else:
            combined = current_hash + sibling["hash"]
        current_hash = hash_data(combined)

    return MerkleProofVerificationResponse(
        valid=valid,
        log_id=payload.log_id,
        computed_root=current_hash if valid else "",
        expected_root=payload.root_hash,
        message="Merkle proof is valid" if valid else "Merkle proof verification failed",
    )


# Key Rotation endpoints

@router.get("/keys/status", response_model=KeyStatusResponse)
def get_key_status_endpoint(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> KeyStatusResponse:
    """Get comprehensive key status including rotation information."""
    status = get_key_status()
    return KeyStatusResponse(**status)


@router.post("/keys/rotate", response_model=KeyRotationResponse)
def rotate_key(
    request: Request,
    payload: KeyRotationRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> KeyRotationResponse:
    """Manually rotate the signing key (admin operation)."""
    result = force_key_rotation(
        admin_username=current_user["username"],
        reason=payload.reason,
    )
    return KeyRotationResponse(**result)


@router.get("/keys/health", response_model=KeyHealthCheck)
def check_key_health_endpoint(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> KeyHealthCheck:
    """Check the health of the signing key."""
    health = check_key_health()
    return KeyHealthCheck(**health)


@router.post("/keys/auto-rotate")
def trigger_auto_rotation(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Trigger automatic key rotation if needed."""
    result = auto_rotate_if_needed()
    if result:
        return {
            "rotated": True,
            "result": result,
        }
    return {
        "rotated": False,
        "message": "Key does not need rotation at this time",
    }
