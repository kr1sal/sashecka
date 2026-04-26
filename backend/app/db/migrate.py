from sqlalchemy import inspect, text

import app.models
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


def migrate_database() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_user_profile_columns()


def main() -> None:
    migrate_database()


if __name__ == "__main__":
    main()
