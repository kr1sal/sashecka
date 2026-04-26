#!/bin/sh
set -eu

if [ "${RUN_DB_MIGRATIONS:-true}" = "true" ]; then
  /app/.venv/bin/python -m app.db.migrate
fi

if [ "${UVICORN_WORKERS:-1}" -gt 1 ] 2>/dev/null; then
  exec /app/.venv/bin/uvicorn app.main:app \
    --host "${HOST:-0.0.0.0}" \
    --port "${PORT:-8000}" \
    --workers "${UVICORN_WORKERS}" \
    --proxy-headers \
    --forwarded-allow-ips "${FORWARDED_ALLOW_IPS:-*}"
fi

exec /app/.venv/bin/uvicorn app.main:app \
  --host "${HOST:-0.0.0.0}" \
  --port "${PORT:-8000}" \
  --proxy-headers \
  --forwarded-allow-ips "${FORWARDED_ALLOW_IPS:-*}"
