import hashlib
import json
from datetime import datetime
from typing import Any


GENESIS_PREVIOUS_HASH = "GENESIS::BLOCKCHAIN_LIKE_TAMPER_PROOF_LOGGER"


def canonicalize_hash_payload(
    *,
    encrypted_message: str,
    algorithm: str,
    key_metadata: dict[str, Any],
    previous_hash: str,
    created_at: datetime,
    hybrid_steps: list[dict[str, Any]] | None,
) -> str:
    payload = {
        "algorithm": algorithm,
        "created_at": created_at.isoformat(),
        "encrypted_message": encrypted_message,
        "hybrid_steps": hybrid_steps or [],
        "key_metadata": key_metadata,
        "previous_hash": previous_hash,
    }
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

