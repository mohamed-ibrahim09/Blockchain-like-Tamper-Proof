from fastapi import APIRouter
from app.schemas.logs import ComparisonMetricsResponse
from app.services.comparison_service import build_comparison_metrics


router = APIRouter(prefix="/comparison")


@router.get("/metrics", response_model=ComparisonMetricsResponse)
def get_comparison_metrics() -> ComparisonMetricsResponse:
    return ComparisonMetricsResponse(**build_comparison_metrics())
