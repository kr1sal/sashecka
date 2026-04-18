from contextlib import asynccontextmanager

from fastapi import FastAPI

import app.models
from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
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
