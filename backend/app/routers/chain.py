from fastapi import APIRouter

from app.schemas.logs import ChainVerificationResponse, ResetStorageResponse, WarningEntryResponse, WarningListResponse
from app.services.log_service import get_warning_history, reset_chain_data, verify_chain


router = APIRouter(prefix="/chain")


@router.post("/verify", response_model=ChainVerificationResponse)
def verify_log_chain() -> ChainVerificationResponse:
    return verify_chain()


@router.get("/warnings", response_model=WarningListResponse)
def list_chain_warnings() -> WarningListResponse:
    items = [WarningEntryResponse(**item) for item in reversed(get_warning_history())]
    return WarningListResponse(items=items, total=len(items))


@router.post("/reset", response_model=ResetStorageResponse)
def reset_chain_storage() -> ResetStorageResponse:
    return ResetStorageResponse(**reset_chain_data())
