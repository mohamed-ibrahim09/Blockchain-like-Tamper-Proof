from typing import Any
from fastapi import APIRouter, Depends
from app.routers.auth import get_current_user
from app.schemas.logs import ChainVerificationResponse, ResetStorageResponse, WarningEntryResponse, WarningListResponse
from app.services.log_service import get_warning_history, reset_chain_data, verify_chain


router = APIRouter(prefix="/chain")


@router.post("/verify", response_model=ChainVerificationResponse)
def verify_log_chain(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ChainVerificationResponse:
    return verify_chain()


@router.get("/warnings", response_model=WarningListResponse)
def list_chain_warnings(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> WarningListResponse:
    items = [WarningEntryResponse(**item) for item in reversed(get_warning_history())]
    return WarningListResponse(items=items, total=len(items))


@router.post("/reset", response_model=ResetStorageResponse)
def reset_chain_storage(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ResetStorageResponse:
    return ResetStorageResponse(**reset_chain_data())
