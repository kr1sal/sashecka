# Production Deployment On VPS

Этот проект теперь поддерживает production-схему для одного VPS с Docker Compose и одним публичным reverse proxy.

## Topology

- снаружи опубликованы только `80/443`
- `reverse-proxy` принимает весь внешний трафик
- `backend`, `postgres`, `shell-static` и все remotes живут только во внутренней Docker-сети
- shell и remotes публикуются под одним origin:
  - `/`
  - `/remotes/auth/`
  - `/remotes/react/`
  - `/remotes/profile/`
- API доступен через `/api/v1`

## Что нужно на сервере

- Linux VPS
- Docker Engine
- Docker Compose plugin
- домен, указывающий на VPS
- TLS-сертификаты для домена

## Production Secrets And Environment

Перед запуском экспортируй переменные окружения на сервере:

```bash
export SERVER_NAME=example.com
export PUBLIC_ORIGIN=https://example.com
export ALLOWED_HOSTS=example.com
export APP_SECRET_KEY='replace-with-a-long-random-secret'
export POSTGRES_PASSWORD='replace-with-a-strong-db-password'
export ENABLE_DOCS=false
```

Дополнительно можно настроить:

```bash
export POSTGRES_DB=sashecka
export POSTGRES_USER=sashecka
export UVICORN_WORKERS=2
export AUTH_RATE_LIMIT=10r/m
```

## TLS

`reverse-proxy` ожидает сертификаты в:

- `deploy/certs/fullchain.pem`
- `deploy/certs/privkey.pem`

Сам репозиторий не хранит сертификаты. Их нужно положить на сервер отдельно перед стартом production compose.

## Build And Start

```bash
docker compose -f compose.prod.yaml build
docker compose -f compose.prod.yaml up -d
```

Проверка состояния:

```bash
docker compose -f compose.prod.yaml ps
docker compose -f compose.prod.yaml logs -f reverse-proxy
docker compose -f compose.prod.yaml logs -f backend
```

## Health Checks

После запуска проверь:

```bash
curl -I http://example.com
curl -k https://example.com/healthz
curl -k https://example.com/api/v1/users/current
```

Есть внутренние health endpoints:

- proxy: `/healthz`
- backend: `/health`
- static containers: `/healthz`

## Security Baseline

- backend и remotes не публикуются напрямую наружу
- docs можно выключить через `ENABLE_DOCS=false`
- rate limiting на `POST /api/v1/auth/login` и `POST /api/v1/auth/register` настроен на уровне reverse proxy
- reverse proxy выставляет базовые security headers
- backend в production не стартует с dev-secret и не разрешает SQLite

## Database Strategy

Production использует PostgreSQL.

Официальная схема миграции в этом репозитории:

```bash
python -m app.db.migrate
```

Этот шаг уже встроен в backend entrypoint и запускается автоматически при старте production контейнера.

## Backups

Резервная копия PostgreSQL:

```bash
docker compose -f compose.prod.yaml exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-sashecka}" "${POSTGRES_DB:-sashecka}" > backup.sql
```

Восстановление:

```bash
cat backup.sql | docker compose -f compose.prod.yaml exec -T postgres \
  psql -U "${POSTGRES_USER:-sashecka}" "${POSTGRES_DB:-sashecka}"
```

## Rollout And Rollback

Обновление:

```bash
git pull
docker compose -f compose.prod.yaml build
docker compose -f compose.prod.yaml up -d
```

Быстрый rollback:

1. Вернуть предыдущий git revision.
2. Повторить `docker compose -f compose.prod.yaml build`.
3. Повторить `docker compose -f compose.prod.yaml up -d`.
4. Если менялась схема БД, восстановить backup.

## Monitoring Checklist

- следить за `docker compose ps`
- следить за свободным местом на диске
- следить за объёмом `postgres-data`
- собирать stdout/stderr контейнеров
- повесить внешний uptime-check на `/healthz`

## Known Security Debt

JWT всё ещё хранится в `localStorage`. Для следующей security-волны стоит перейти на `httpOnly` cookies + CSRF protection.
