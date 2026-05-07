from contextlib import asynccontextmanager
from pathlib import Path
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Allow `uvicorn main:app --reload` from inside `backend\app`
if __package__ in {None, ""}:
    backend_dir = Path(__file__).resolve().parent.parent
    backend_dir_str = str(backend_dir)
    if backend_dir_str not in sys.path:
        sys.path.insert(0, backend_dir_str)

from app.core.config import settings
from app.routers import alerts, auth, chain, comparison, crypto, health, logs
from app.services.crypto_self_check import run_crypto_self_check
from app.services.db import init_db
from app.services.file_storage import ensure_storage_files
from app.services.log_service import seed_demo_data
from app.core.limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Initialize database
    init_db()
    ensure_storage_files()
    run_crypto_self_check()
    if settings.seed_demo_data:
        seed_demo_data()
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description=(
        "Educational demo API for a blockchain-like tamper-proof logging system "
        "that encrypts log entries, chains them with SHA-256 hashes, and verifies tampering."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(health.router, prefix=settings.api_prefix, tags=["Health"])
app.include_router(auth.router, prefix=settings.api_prefix, tags=["Authentication"])
app.include_router(logs.router, prefix=settings.api_prefix, tags=["Logs"])
app.include_router(chain.router, prefix=settings.api_prefix, tags=["Chain"])
app.include_router(comparison.router, prefix=settings.api_prefix, tags=["Comparison"])
app.include_router(crypto.router, prefix=settings.api_prefix, tags=["Cryptography"])
app.include_router(alerts.router, prefix=settings.api_prefix, tags=["Alerts"])
