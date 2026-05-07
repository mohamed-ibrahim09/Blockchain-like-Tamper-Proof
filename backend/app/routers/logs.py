from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.routers.auth import get_current_user
from app.schemas.logs import (
    LogCreateRequest,
    LogDecryptRequest,
    LogDecryptResponse,
    LogEntryResponse,
    LogListResponse,
    LogTamperRequest,
)
from app.services.crypto_service import CryptoServiceError
from app.services.log_service import create_log, decrypt_log, get_log_or_404, get_logs, serialize_log, tamper_log


router = APIRouter(prefix="/logs")


@router.post("", response_model=LogEntryResponse, status_code=status.HTTP_201_CREATED)
def create_log_entry(
    request: Request,
    payload: LogCreateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> LogEntryResponse:
    try:
        log = create_log(
            original_message=payload.original_message,
            algorithm=payload.algorithm,
            key=payload.key,
            hybrid_steps=None,
            created_by_user_id=current_user["id"],
            created_by_username=current_user["username"],
        )
        return LogEntryResponse(**serialize_log(log))
    except CryptoServiceError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("", response_model=LogListResponse)
def list_logs(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> LogListResponse:
    items = [LogEntryResponse(**serialize_log(log)) for log in get_logs()]
    return LogListResponse(items=items, total=len(items))


@router.get("/{log_id}", response_model=LogEntryResponse)
def get_log(
    log_id: int,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> LogEntryResponse:
    log = get_log_or_404(log_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log entry not found.")
    return LogEntryResponse(**serialize_log(log))


@router.post("/{log_id}/decrypt", response_model=LogDecryptResponse)
def decrypt_log_entry(
    log_id: int,
    payload: LogDecryptRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> LogDecryptResponse:
    log = get_log_or_404(log_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log entry not found.")

    try:
        result = decrypt_log(
            log=log,
            override_key=payload.key,
        )
        return LogDecryptResponse(**result)
    except CryptoServiceError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{log_id}/tamper", response_model=LogEntryResponse)
def tamper_log_entry(
    log_id: int,
    payload: LogTamperRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> LogEntryResponse:
    log = get_log_or_404(log_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log entry not found.")

    try:
        updated = tamper_log(
            log=log,
            field=payload.field,
            new_value=payload.new_value,
            note=payload.note,
        )
        return LogEntryResponse(**serialize_log(updated))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
