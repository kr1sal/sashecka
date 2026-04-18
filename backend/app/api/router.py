from fastapi import APIRouter

from app.api.routes import auth, groups, users
from app.core.config import settings


api_router = APIRouter(prefix=settings.api_prefix)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(groups.router)
