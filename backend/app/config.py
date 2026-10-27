"""Configuração do backend carregada do ambiente ou de backend/.env."""

import os
from pathlib import Path


def _load_backend_env() -> None:
    """Load simple KEY=VALUE entries from backend/.env without overriding the process env."""
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key, value = key.strip(), value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]
        if key:
            os.environ.setdefault(key, value)


_load_backend_env()

APP_ENV = os.getenv("APP_ENV", "development").strip().casefold()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./seha.db").strip()
CORS_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

SECRET_KEY = os.getenv("SECRET_KEY", "").strip()
if APP_ENV == "production":
    if len(SECRET_KEY) < 32:
        raise RuntimeError("Configure SECRET_KEY com pelo menos 32 caracteres no ambiente de produção.")
elif not SECRET_KEY:
    SECRET_KEY = "local-development-key-do-not-use-in-production"
