import json
from datetime import datetime, timezone
from time import perf_counter
from typing import Any

from app.core.config import settings
from app.schemas.logs import ChainVerificationResponse, VerificationBlockResult
from app.services.crypto_service import CryptoService, CryptoServiceError, crypto_service
from app.services.crypto_signatures import ensure_signing_key_exists, sign_block
from app.services.file_storage import (
    StorageCorruptionError,
    append_log_record,
    append_warning_record,
    clear_storage_files,
    read_log_records,
    read_warning_records,
    write_log_records,
)
from app.services.hash_service import GENESIS_PREVIOUS_HASH, canonicalize_hash_payload, sha256_hash


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _record_to_response(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": int(record["id"]),
        "original_message": record["original_message"],
        "encrypted_message": record["encrypted_message"],
        "algorithm": record["algorithm"],
        "key_metadata": record["key_metadata"],
        "previous_hash": record["previous_hash"],
        "current_hash": record["current_hash"],
        "hybrid_steps": record.get("hybrid_steps"),
        "encryption_time_ms": round(float(record["encryption_time_ms"]), 4),
        "decryption_time_ms": round(float(record["decryption_time_ms"]), 4),
        "output_length": int(record["output_length"]),
        "tampered": bool(record.get("tampered", False)),
        "tamper_note": record.get("tamper_note"),
        "created_at": datetime.fromisoformat(record["created_at"]),
        "updated_at": datetime.fromisoformat(record["updated_at"]),
        "created_by_user_id": record.get("created_by_user_id"),
        "created_by_username": record.get("created_by_username"),
        "signature": record.get("signature"),
    }


def serialize_log(record: dict[str, Any]) -> dict[str, Any]:
    return _record_to_response(record)


def get_logs() -> list[dict[str, Any]]:
    """Return all non-sentinel log records."""
    return [r for r in read_log_records() if not r.get("is_sentinel")]


def get_log_or_404(log_id: int) -> dict[str, Any] | None:
    for record in read_log_records():
        if int(record["id"]) == log_id and not record.get("is_sentinel"):
            return record
    return None


def create_log(
    *,
    original_message: str,
    algorithm: str,
    key: str | None,
    hybrid_steps: list[dict[str, str]] | None,
    created_by_user_id: int | None = None,
    created_by_username: str | None = None,
) -> dict[str, Any]:
    records = read_log_records()
    real_records = [r for r in records if not r.get("is_sentinel")]
    previous_record = real_records[-1] if real_records else None
    previous_hash = previous_record["current_hash"] if previous_record else GENESIS_PREVIOUS_HASH
    created_at = _now()

    encrypt_started = perf_counter()
    encryption = crypto_service.encrypt(
        algorithm=algorithm,
        message=original_message,
        key=key,
        hybrid_steps=hybrid_steps,
    )
    encryption_time_ms = (perf_counter() - encrypt_started) * 1000

    decrypt_started = perf_counter()
    crypto_service.decrypt(
        algorithm=algorithm,
        encrypted_message=encryption.encrypted_message,
        key_metadata=encryption.key_metadata,
        hybrid_steps=encryption.hybrid_steps,
    )
    decryption_time_ms = (perf_counter() - decrypt_started) * 1000

    current_hash = sha256_hash(
        canonicalize_hash_payload(
            encrypted_message=encryption.encrypted_message,
            algorithm=algorithm,
            key_metadata=encryption.key_metadata,
            previous_hash=previous_hash,
            created_at=created_at,
            hybrid_steps=encryption.hybrid_steps,
        )
    )

    record = {
        "id": int(real_records[-1]["id"]) + 1 if real_records else 1,
        "original_message": original_message,
        "encrypted_message": encryption.encrypted_message,
        "algorithm": algorithm,
        "key_metadata": encryption.key_metadata,
        "previous_hash": previous_hash,
        "current_hash": current_hash,
        "hybrid_steps": encryption.hybrid_steps,
        "encryption_time_ms": encryption_time_ms,
        "decryption_time_ms": decryption_time_ms,
        "output_length": len(encryption.encrypted_message),
        "tampered": False,
        "tamper_note": None,
        "created_at": created_at.isoformat(),
        "updated_at": created_at.isoformat(),
        "created_by_user_id": created_by_user_id,
        "created_by_username": created_by_username,
    }

    # Sign the block with ECDSA
    ensure_signing_key_exists()
    signature_data = sign_block(record)
    record["signature"] = signature_data

    append_log_record(record)
    _update_sentinel()
    verify_chain(write_warning=True)
    return record


def decrypt_log(
    *,
    log: dict[str, Any],
    override_key: str | None = None,
) -> dict[str, Any]:
    stored_key_metadata = dict(log["key_metadata"])
    used_stored_key_metadata = True

    if log["algorithm"] != "hybrid" and override_key:
        stored_key_metadata["key"] = override_key
        used_stored_key_metadata = False

    decrypted_message, pipeline = crypto_service.decrypt(
        algorithm=log["algorithm"],
        encrypted_message=log["encrypted_message"],
        key_metadata=stored_key_metadata,
        hybrid_steps=log.get("hybrid_steps"),
    )

    return {
        "id": int(log["id"]),
        "algorithm": log["algorithm"],
        "decrypted_message": decrypted_message,
        "pipeline": pipeline,
        "used_stored_key_metadata": used_stored_key_metadata,
    }


def tamper_log(*, log: dict[str, Any], field: str, new_value: str, note: str | None) -> dict[str, Any]:
    records = read_log_records()
    updated_at = _now().isoformat()
    mutated: dict[str, Any] | None = None

    for record in records:
        if int(record["id"]) != int(log["id"]):
            continue
        if field == "key_metadata":
            try:
                record[field] = json.loads(new_value)
            except json.JSONDecodeError as exc:
                raise ValueError("key_metadata must be valid JSON.") from exc
        else:
            record[field] = new_value
        record["tampered"] = True
        record["tamper_note"] = note or "Demo tamper simulation applied."
        record["updated_at"] = updated_at
        mutated = record
        break

    if mutated is None:
        raise ValueError("Log entry not found.")

    write_log_records(records)
    _update_sentinel()
    verify_chain(write_warning=True)
    return mutated


def _update_sentinel() -> None:
    """Remove any existing sentinel and append a fresh one after the last real block.

    The sentinel is a hidden block whose previous_hash anchors to the last real
    block's current_hash.  If someone deletes the last real block, the sentinel's
    previous_hash will no longer match any block, and chain verification will
    detect the break.
    """
    records = read_log_records()

    # Remove existing sentinel(s)
    records = [r for r in records if not r.get("is_sentinel")]

    if not records:
        return

    last_record = records[-1]
    previous_hash = last_record["current_hash"]
    created_at = _now()

    sentinel_id = int(last_record["id"]) + 1

    sentinel = {
        "id": sentinel_id,
        "original_message": "__SENTINEL__",
        "encrypted_message": "__SENTINEL__",
        "algorithm": "sentinel",
        "key_metadata": {"mode": "sentinel", "purpose": "chain-anchor"},
        "previous_hash": previous_hash,
        "current_hash": sha256_hash(
            canonicalize_hash_payload(
                encrypted_message="__SENTINEL__",
                algorithm="sentinel",
                key_metadata={"mode": "sentinel", "purpose": "chain-anchor"},
                previous_hash=previous_hash,
                created_at=created_at,
                hybrid_steps=[],
            )
        ),
        "hybrid_steps": [],
        "encryption_time_ms": 0,
        "decryption_time_ms": 0,
        "output_length": 0,
        "tampered": False,
        "tamper_note": None,
        "created_at": created_at.isoformat(),
        "updated_at": created_at.isoformat(),
        "created_by_user_id": None,
        "created_by_username": None,
        "is_sentinel": True,
    }

    records.append(sentinel)
    write_log_records(records)


def _append_warning_if_needed(response: ChainVerificationResponse) -> bool:
    if response.is_valid:
        return False

    first_break = f" First broken block: #{response.first_broken_block_id}." if response.first_broken_block_id else ""
    summary = (
        f"Tampering detected. Changed blocks: {response.changed_block_ids or 'none'}. "
        f"Affected blocks: {response.affected_block_ids or 'none'}.{first_break}"
    )
    existing_warnings = read_warning_records()
    last_warning = existing_warnings[-1] if existing_warnings else None
    if last_warning and (
        last_warning.get("changed_block_ids") == response.changed_block_ids
        and last_warning.get("affected_block_ids") == response.affected_block_ids
        and last_warning.get("first_broken_block_id") == response.first_broken_block_id
        and last_warning.get("summary") == summary
    ):
        return False

    append_warning_record(
        {
            "timestamp": response.verified_at.isoformat(),
            "is_valid": response.is_valid,
            "changed_block_ids": response.changed_block_ids,
            "affected_block_ids": response.affected_block_ids,
            "first_broken_block_id": response.first_broken_block_id,
            "summary": summary,
        }
    )
    return True


def get_warning_history() -> list[dict[str, Any]]:
    return read_warning_records()


def reset_chain_data() -> dict[str, Any]:
    result = clear_storage_files()
    return {
        "success": True,
        "cleared_logs": result["cleared_logs"],
        "cleared_warnings": result["cleared_warnings"],
        "message": "Log ledger and warning history were cleared successfully.",
    }


def verify_chain(*, write_warning: bool = True) -> ChainVerificationResponse:
    try:
        records = read_log_records()
    except StorageCorruptionError as exc:
        verified_at = _now()
        warning = {
            "timestamp": verified_at.isoformat(),
            "is_valid": False,
            "changed_block_ids": [],
            "affected_block_ids": [],
            "first_broken_block_id": None,
            "summary": str(exc),
        }
        if write_warning:
            append_warning_record(warning)
        return ChainVerificationResponse(
            is_valid=False,
            verified_at=verified_at,
            total_blocks=0,
            valid_blocks=0,
            tampered_blocks=0,
            affected_blocks=0,
            changed_block_ids=[],
            affected_block_ids=[],
            first_broken_block_id=None,
            warning_written=write_warning,
            warning_file_path=str(settings.tamper_warning_path),
            results=[],
        )

    # Build a sentinel lookup for quick checks
    sentinel_ids: set[int] = {int(r["id"]) for r in records if r.get("is_sentinel")}

    previous_stored_hash = GENESIS_PREVIOUS_HASH
    previous_recalculated_hash = GENESIS_PREVIOUS_HASH
    all_results: list[VerificationBlockResult] = []
    first_broken_block_id: int | None = None

    for index, record in enumerate(records):
        created_at = datetime.fromisoformat(record["created_at"])
        recalculated_hash = sha256_hash(
            canonicalize_hash_payload(
                encrypted_message=record["encrypted_message"],
                algorithm=record["algorithm"],
                key_metadata=record["key_metadata"],
                previous_hash=record["previous_hash"],
                created_at=created_at,
                hybrid_steps=record.get("hybrid_steps"),
            )
        )
        previous_hash_valid = record["previous_hash"] == previous_recalculated_hash
        current_hash_valid = record["current_hash"] == recalculated_hash
        reasons: list[str] = []

        direct_previous_edit = False
        if index > 0:
            direct_previous_edit = (
                record["previous_hash"] != previous_stored_hash and record["previous_hash"] != previous_recalculated_hash
            )

        if not previous_hash_valid:
            reasons.append("Stored previous_hash does not match the actual previous block hash.")
        if not current_hash_valid:
            reasons.append("Current hash does not match the recalculated hash from stored data.")
        if record.get("tampered"):
            reasons.append("This block was marked through the demo tamper simulation.")

        direct_change = (
            current_hash_valid is False
            or direct_previous_edit
            or bool(record.get("tampered"))
            or (index == 0 and previous_hash_valid is False)
        )
        if previous_hash_valid and current_hash_valid and first_broken_block_id is None:
            status = "valid"
        elif direct_change:
            status = "tampered"
            if first_broken_block_id is None:
                first_broken_block_id = int(record["id"])
        else:
            status = "affected"
            if first_broken_block_id is None:
                first_broken_block_id = int(record["id"])
            reasons.append("This block is downstream from an earlier broken block.")

        all_results.append(
            VerificationBlockResult(
                id=int(record["id"]),
                algorithm=record["algorithm"],
                status=status,
                previous_hash_valid=previous_hash_valid,
                current_hash_valid=current_hash_valid,
                stored_previous_hash=record["previous_hash"],
                expected_previous_hash=previous_recalculated_hash,
                stored_current_hash=record["current_hash"],
                recalculated_hash=recalculated_hash,
                tampered_flag=bool(record.get("tampered", False)),
                reasons=reasons,
            )
        )
        previous_stored_hash = record["current_hash"]
        previous_recalculated_hash = recalculated_hash

    # Sentinel blocks verify the chain anchor but must NOT appear in the
    # user-facing results or counts — they are invisible implementation details.
    public_results = [r for r in all_results if r.id not in sentinel_ids]

    response = ChainVerificationResponse(
        # is_valid uses ALL results (including sentinel) so chain breaks are caught
        is_valid=all(r.status == "valid" for r in all_results),
        verified_at=_now(),
        # Public metrics only count real (non-sentinel) blocks
        total_blocks=len(public_results),
        valid_blocks=sum(r.status == "valid" for r in public_results),
        tampered_blocks=sum(r.status == "tampered" for r in public_results),
        affected_blocks=sum(r.status == "affected" for r in public_results),
        changed_block_ids=[r.id for r in public_results if r.status == "tampered"],
        affected_block_ids=[r.id for r in public_results if r.status == "affected"],
        first_broken_block_id=first_broken_block_id if first_broken_block_id not in sentinel_ids else None,
        warning_written=False,
        warning_file_path=str(settings.tamper_warning_path),
        results=public_results,
    )
    warning_written = _append_warning_if_needed(response) if write_warning else False
    return response.model_copy(update={"warning_written": warning_written})


def seed_demo_data() -> None:
    records = read_log_records()
    if records:
        return

    demo_logs = [
        {
            "original_message": "Attendance log opened for lab session A.",
            "algorithm": "vigenere",
            "key": "SECURITY",
            "hybrid_steps": None,
        },
        {
            "original_message": "Exam paper access event approved by supervisor.",
            "algorithm": "playfair",
            "key": "CAMPUSKEY",
            "hybrid_steps": None,
        },
        {
            "original_message": "Server room inspection recorded for weekly audit.",
            "algorithm": "rsa",
            "key": None,
            "hybrid_steps": None,
        },
        {
            "original_message": "Hybrid sample log to show layered educational encryption.",
            "algorithm": "hybrid",
            "key": None,
            "hybrid_steps": None,
        },
    ]

    for payload in demo_logs:
        try:
            create_log(**payload)
        except CryptoServiceError:
            break
