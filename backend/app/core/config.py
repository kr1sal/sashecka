import os
from pathlib import Path

from dotenv import dotenv_values


BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"
DEFAULT_DATABASE_PATH = BASE_DIR / "app.db"
ENV_VALUES = dotenv_values(ENV_FILE) if ENV_FILE.exists() else {}


def _get_env(name: str, default: str) -> str:
    file_value = ENV_VALUES.get(name)
    if file_value not in (None, ""):
        return file_value

    env_value = os.getenv(name)
    if env_value not in (None, ""):
        return env_value

    return default


class Settings:
    def __init__(self) -> None:
        self.app_name = _get_env("APP_NAME", "Sashecka API")
        self.app_version = _get_env("APP_VERSION", "0.1.0")
        self.api_prefix = _get_env("API_PREFIX", "/api/v1")
        self.secret_key = _get_env(
            "APP_SECRET_KEY",
            "dev-secret-key-change-me-before-production",
        )
        self.algorithm = _get_env("ALGORITHM", "HS256")
        self.access_token_expire_minutes = int(
            _get_env("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
        )
        self.host = _get_env("HOST", "0.0.0.0")
        self.port = int(_get_env("PORT", "8000"))
        self.database_path = DEFAULT_DATABASE_PATH
        self.database_url = _get_env(
            "DATABASE_URL",
            f"sqlite:///{self.database_path}",
        )


settings = Settings()
