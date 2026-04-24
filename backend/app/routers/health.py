from fastapi import APIRouter


router = APIRouter()


@router.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


@router.get("/")
def root() -> dict:
    return {
        "name": "Blockchain-like Tamper-Proof Logging System API",
        "docs": "/docs",
        "endpoints": [
            "/api/logs",
            "/api/chain/verify",
            "/api/comparison/metrics",
        ],
    }

