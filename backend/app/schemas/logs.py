from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


AlgorithmName = Literal["rsa", "playfair", "vigenere", "hybrid"]


class LogCreateRequest(BaseModel):
    original_message: str = Field(min_length=1)
    algorithm: AlgorithmName
    key: str | None = None
    # User fields will be populated from JWT token, not from request body

    @model_validator(mode="after")
    def validate_keys(self) -> "LogCreateRequest":
        if self.algorithm in {"playfair", "vigenere"} and not self.key:
            raise ValueError("A key is required for non-hybrid algorithms.")
        return self


class LogTamperRequest(BaseModel):
    field: Literal["original_message", "encrypted_message", "algorithm", "key_metadata"] = "encrypted_message"
    new_value: str = Field(min_length=1)
    note: str | None = None


class LogDecryptRequest(BaseModel):
    key: str | None = None


class LogEntryResponse(BaseModel):
    id: int
    original_message: str
    encrypted_message: str
    algorithm: AlgorithmName
    key_metadata: dict[str, Any]
    previous_hash: str
    current_hash: str
    hybrid_steps: list[dict[str, Any]] | None = None
    encryption_time_ms: float
    decryption_time_ms: float
    output_length: int
    tampered: bool
    tamper_note: str | None
    created_at: datetime
    updated_at: datetime
    # User attribution fields
    created_by_user_id: int | None = None
    created_by_username: str | None = None
    # Digital signature
    signature: dict[str, Any] | None = None


class LogListResponse(BaseModel):
    items: list[LogEntryResponse]
    total: int


class LogDecryptResponse(BaseModel):
    id: int
    algorithm: AlgorithmName
    decrypted_message: str
    pipeline: list[str]
    used_stored_key_metadata: bool


class VerificationBlockResult(BaseModel):
    id: int
    algorithm: AlgorithmName
    status: Literal["valid", "tampered", "affected"]
    previous_hash_valid: bool
    current_hash_valid: bool
    stored_previous_hash: str
    expected_previous_hash: str
    stored_current_hash: str
    recalculated_hash: str
    tampered_flag: bool
    reasons: list[str]


class ChainVerificationResponse(BaseModel):
    is_valid: bool
    verified_at: datetime
    total_blocks: int
    valid_blocks: int
    tampered_blocks: int
    affected_blocks: int
    changed_block_ids: list[int]
    affected_block_ids: list[int]
    first_broken_block_id: int | None = None
    warning_written: bool = False
    warning_file_path: str
    results: list[VerificationBlockResult]


class WarningEntryResponse(BaseModel):
    timestamp: datetime
    is_valid: bool
    changed_block_ids: list[int]
    affected_block_ids: list[int]
    first_broken_block_id: int | None = None
    summary: str


class WarningListResponse(BaseModel):
    items: list[WarningEntryResponse]
    total: int


class ResetStorageResponse(BaseModel):
    success: bool
    cleared_logs: bool
    cleared_warnings: bool
    message: str


class ComparisonMetric(BaseModel):
    algorithm: str
    label: str
    encryption_time_ms: float
    decryption_time_ms: float
    output_length: int
    verification_behavior: str
    qualitative_note: str
    observed_logs: int


class ComparisonMetricsResponse(BaseModel):
    sample_message: str
    current_chain_status: Literal["healthy", "broken"]
    log_count: int
    metrics: list[ComparisonMetric]
