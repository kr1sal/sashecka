from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import inspect, text

import app.models
from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine


def _ensure_user_profile_columns() -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    column_names = {column["name"] for column in inspector.get_columns("users")}
    statements: list[str] = []

    if "profile_bio" not in column_names:
        statements.append("ALTER TABLE users ADD COLUMN profile_bio VARCHAR(1000)")
    if "profile_accent_color" not in column_names:
        statements.append("ALTER TABLE users ADD COLUMN profile_accent_color VARCHAR(7)")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    _ensure_user_profile_columns()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Minimal FastAPI backend with registration, login and protected profile."
    ),
    lifespan=lifespan,
)

app.include_router(api_router)


@app.get("/", tags=["health"])
def root() -> dict[str, str]:
    return {"message": "Sashecka API is running"}
