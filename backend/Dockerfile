FROM python:3.12-slim AS base

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_PROJECT_ENVIRONMENT=/app/.venv 
ENV HOST=0.0.0.0
ENV PORT=8000

WORKDIR /app

COPY pyproject.toml uv.lock ./

# Install third-party dependencies first for better layer caching.
RUN uv sync --no-dev --no-install-project

COPY app ./app
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Install the local package into the project environment.
RUN uv sync --no-dev
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE $PORT

CMD ["/app/docker-entrypoint.sh"]
