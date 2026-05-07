from dataclasses import dataclass
from pathlib import Path
import os
import secrets

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=False)
except ImportError:
    pass  # python-dotenv not installed; rely on OS environment


BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_STORAGE_DIR = PROJECT_ROOT / "storage"


def _get_secret_key() -> str:
    """Get or generate the JWT secret key."""
    env_key = os.getenv("SECRET_KEY")
    if env_key:
        return env_key
    # Generate a random key if not provided (for development only)
    return secrets.token_hex(32)


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv(
        "APP_NAME",
        "Blockchain-like Tamper-Proof Logging System",
    )
    api_prefix: str = os.getenv("API_PREFIX", "/api")
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    crypto_source_dir: str = os.getenv("CRYPTO_SOURCE_DIR") or str(PROJECT_ROOT)
    storage_dir: str = os.getenv("STORAGE_DIR") or str(DEFAULT_STORAGE_DIR)
    log_chain_file: str = os.getenv("LOG_CHAIN_FILE", "log_chain.jsonl")
    tamper_warning_file: str = os.getenv("TAMPER_WARNING_FILE", "tamper_warnings.jsonl")
    seed_demo_data: bool = os.getenv("SEED_DEMO_DATA", "true").lower() == "true"
    
    # Authentication settings
    secret_key: str = _get_secret_key()
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))  # 24 hours
    
    # Key rotation settings
    key_ttl_days: int = int(os.getenv("KEY_TTL_DAYS", "90"))
    
    # Alert settings
    alert_webhook_url: str = os.getenv("ALERT_WEBHOOK_URL", "")
    alert_email_to: str = os.getenv("ALERT_EMAIL_TO", "")
    smtp_host: str = os.getenv("SMTP_HOST", "")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: str = os.getenv("SMTP_USER", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    
    # Database settings
    use_sqlite: bool = os.getenv("USE_SQLITE", "true").lower() == "true"

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
