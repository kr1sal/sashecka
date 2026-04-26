from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware

import app.models
from app.api.router import api_router
from app.core.config import settings


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Minimal FastAPI backend with registration, login and protected profile."
    ),
    docs_url="/docs" if settings.enable_docs else None,
    redoc_url="/redoc" if settings.enable_docs else None,
    openapi_url="/openapi.json" if settings.enable_docs else None,
)

if settings.allowed_hosts and settings.allowed_hosts != ["*"]:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)

app.include_router(api_router)


@app.get("/", tags=["health"])
def root() -> dict[str, str]:
    return {"message": "Sashecka API is running"}


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
