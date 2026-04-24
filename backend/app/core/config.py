from dataclasses import dataclass
from pathlib import Path
import os


BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_STORAGE_DIR = PROJECT_ROOT / "storage"


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv(
        "APP_NAME",
        "Blockchain-like Tamper-Proof Logging System",
    )
    api_prefix: str = os.getenv("API_PREFIX", "/api")
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    crypto_source_dir: str = os.getenv(
        "CRYPTO_SOURCE_DIR",
        str(PROJECT_ROOT),
    )
    storage_dir: str = os.getenv("STORAGE_DIR", str(DEFAULT_STORAGE_DIR))
    log_chain_file: str = os.getenv("LOG_CHAIN_FILE", "log_chain.jsonl")
    tamper_warning_file: str = os.getenv("TAMPER_WARNING_FILE", "tamper_warnings.jsonl")
    seed_demo_data: bool = os.getenv("SEED_DEMO_DATA", "true").lower() == "true"

    @property
    def allowed_origins(self) -> list[str]:
        raw = os.getenv("FRONTEND_ORIGIN", self.frontend_origin)
        return [item.strip() for item in raw.split(",") if item.strip()]

    @property
    def project_root(self) -> Path:
        return PROJECT_ROOT

    @property
    def resolved_crypto_source_dir(self) -> Path:
        return Path(self.crypto_source_dir).resolve()

    @property
    def resolved_storage_dir(self) -> Path:
        return Path(self.storage_dir).resolve()

    @property
    def log_chain_path(self) -> Path:
        return self.resolved_storage_dir / self.log_chain_file

    @property
    def tamper_warning_path(self) -> Path:
        return self.resolved_storage_dir / self.tamper_warning_file


settings = Settings()
