from typing import Any
from fastapi import APIRouter, Depends
from app.routers.auth import get_current_user
from app.schemas.logs import ComparisonMetricsResponse
from app.services.comparison_service import build_comparison_metrics


router = APIRouter(prefix="/comparison")


@router.get("/metrics", response_model=ComparisonMetricsResponse)
def get_comparison_metrics(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ComparisonMetricsResponse:
    return ComparisonMetricsResponse(**build_comparison_metrics())
