from pathlib import Path
import os


class Settings:
    app_name = "Sashecka API"
    app_version = "0.1.0"
    api_prefix = "/api/v1"
    secret_key = os.getenv(
        "APP_SECRET_KEY",
        "dev-secret-key-change-me-before-production",
    )
    algorithm = "HS256"
    access_token_expire_minutes = 60
    database_path = Path(__file__).resolve().parents[2] / "app.db"
    database_url = f"sqlite:///{database_path}"


settings = Settings()
