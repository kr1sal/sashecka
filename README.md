# Sashecka

`Sashecka` сейчас состоит из двух частей:

1. `FastAPI` backend с JWT-аутентификацией, CRUD для пользователей и групп, поиском и Swagger.
2. Mixed-framework frontend на `Vite + Module Federation`: `React shell`, `React remotes` и `Vue profile remote`.

Проект собран как демонстрационный MVP: без лишней инфраструктуры, но уже с границами, которые позволяют дальше добавлять profile editing, OAuth-провайдеров и richer permissions UX.

## Стек

### Backend

- `Python 3.12`
- `uv`
- `FastAPI`
- `SQLAlchemy 2.0`
- `Pydantic v2`
- `SQLite`
- `PyJWT`
- `pwdlib[argon2]`
- `Uvicorn`

### Frontend

- `React`
- `Vue`
- `Vite`
- `TypeScript`
- `Module Federation`
- `Mantine`
- `PrimeVue`
- `React Router`
- `TanStack Query`

## Что реализовано

### Backend

- `POST /api/v1/auth/register` - регистрация пользователя
- `POST /api/v1/auth/login` - JWT логин через `OAuth2PasswordRequestForm`
- `GET /api/v1/users/current` - текущий пользователь
- `PUT /api/v1/users/current` - обновление текущего пользователя
- `DELETE /api/v1/users/current` - удаление текущего пользователя
- `GET /api/v1/users` - список пользователей с поиском по `q`
- `GET /api/v1/groups` - список групп с поиском по `q`
- `GET /api/v1/groups/{id}` - детали группы
- `POST /api/v1/groups` - создание группы
- `PUT /api/v1/groups/{id}` - обновление группы
- `DELETE /api/v1/groups/{id}` - удаление группы
- Swagger UI на `/docs`
- ReDoc на `/redoc`

### Frontend

- `React shell` с layout, navigation, auth session и route guards
- `React auth remote` со страницами `login` и `register`
- `React app remote` с `home`, `settings`, `group page`
- `Vue profile remote` с кастомизацией профиля
- общий `api-client`, `auth-session`, `design-tokens`, `shared-ui`
- единый root script для локального старта всех remotes

## Архитектура frontend

```text
frontend/
├── apps/
│   ├── shell/
│   ├── auth/
│   ├── react-app/
│   └── profile-vue/
├── packages/
│   ├── api-client/
│   ├── auth-session/
│   ├── design-tokens/
│   └── shared-ui/
├── scripts/
│   └── dev-all.mjs
└── package.json
```

Границы такие:

- `shell` владеет top-level routing, auth state и fallback UI
- `auth` отвечает за `login/register`
- `react-app` отвечает за `home/settings/group`
- `profile-vue` отвечает за страницу профиля

## Конфигурация

### Backend

Поддерживается конфигурация через `backend/.env` и system env.

Приоритет:

1. `backend/.env`
2. system env
3. defaults в `backend/app/core/config.py`

Шаблон лежит в `backend/.env.example`.

### Frontend

Frontend переменные лежат в `frontend/.env.example`.

Основные:

- `VITE_API_BASE_URL`
- `VITE_SHELL_ORIGIN`
- `VITE_BACKEND_ORIGIN`
- `VITE_AUTH_REMOTE_URL`
- `VITE_REACT_APP_REMOTE_URL`
- `VITE_PROFILE_VUE_REMOTE_URL`

## Локальный запуск без Docker

### 1. Backend

```bash
cd backend
uv python install 3.12
uv lock
uv sync
uv run uvicorn app.main:app --reload
```

После запуска:

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 2. Frontend

```bash
cd frontend
npm ci
npm run dev
```

Это поднимет:

- shell: [http://localhost:4173](http://localhost:4173)
- auth remote: [http://localhost:4174/remoteEntry.js](http://localhost:4174/remoteEntry.js)
- react-app remote: [http://localhost:4175/remoteEntry.js](http://localhost:4175/remoteEntry.js)
- profile-vue remote: [http://localhost:4176/remoteEntry.js](http://localhost:4176/remoteEntry.js)

## Запуск через Docker Compose

Есть готовый `compose.yaml`, который поднимает весь стек.

```bash
docker compose up -d --build
```

После запуска:

- сайт: [http://localhost:4183](http://localhost:4183)
- Swagger UI: [http://localhost:8001/docs](http://localhost:8001/docs)
- auth remote: [http://localhost:4174/remoteEntry.js](http://localhost:4174/remoteEntry.js)
- react-app remote: [http://localhost:4175/remoteEntry.js](http://localhost:4175/remoteEntry.js)
- profile-vue remote: [http://localhost:4176/remoteEntry.js](http://localhost:4176/remoteEntry.js)

Полезные команды:

```bash
docker compose logs -f
docker compose ps
docker compose down
```

Почему в compose используются `4183` и `8001`:

- чтобы не конфликтовать с локальными `4173` и `8000`, если ты уже поднимал сервисы вручную.

## Быстрый smoke-flow

1. Открой сайт
2. Зарегистрируй нового пользователя
3. Залогинься
4. Проверь `home search`
5. Открой `settings`
6. Открой `profile`
7. Открой `group page`

## Полезные замечания

- Если backend ругается на старую SQLite-схему вроде `no such column: groups.owner_id`, старая `app.db` не совпадает с текущими моделями. Для локального MVP проще удалить старую базу и поднять backend заново.
- Для compose используется отдельная база `backend/app-compose.db`, чтобы не мешать локальной `backend/app.db`.
- `401 Unauthorized` на логине обычно означает неверный email/username или пароль, а не поломку frontend federation.
- В dev-режиме frontend использует Vite proxy в shell, поэтому браузер ходит в backend через shell origin, а не напрямую.

## Production Deployment

Для production теперь есть отдельный стек:

- `compose.prod.yaml` для VPS deployment
- `frontend/Dockerfile.prod` для статических production-сборок shell и remotes
- `deploy/nginx/default.conf.template` для единого reverse proxy

Production-режим подразумевает:

- один публичный entrypoint на `80/443`
- backend, PostgreSQL и remotes только во внутренней Docker-сети
- shell и remotes за одним origin через path prefixes
- PostgreSQL вместо SQLite
- docs по умолчанию выключены

Подробный runbook лежит в [docs/production-vps.md](docs/production-vps.md).

## Документация, на которую опирался проект

- FastAPI Security:
  [`OAuth2 with Password (and hashing), Bearer with JWT tokens`](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- SQLAlchemy ORM Quick Start:
  [`ORM Quick Start`](https://docs.sqlalchemy.org/en/stable/orm/quickstart.html)
- Mantine + Vite:
  [`Usage with Vite`](https://mantine.dev/guides/vite)
- Module Federation:
  [`Module Federation for Vite`](https://module-federation.io/)

## Следующие шаги

1. Добавить richer profile data вместо placeholder в `profile-vue`
2. Добавить смену пароля и более явный account security flow
3. Добавить OAuth через `Google`, `GitHub`, `GitLab`
4. Перейти с `SQLite` на `PostgreSQL`, когда MVP стабилизируется