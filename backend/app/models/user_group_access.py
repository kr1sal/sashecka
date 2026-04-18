from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.group import Group
    from app.models.user import User


class UserGroupAccess(Base):
    __tablename__ = "user_group_accesses"
    # Пользователь не может иметь несколько доступов к одной и той же группе
    __table_args__ = (
        UniqueConstraint("user_id", "group_id", name="uq_user_group_access"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)  # None = общие права для всех пользователей
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    grants: Mapped[list[str]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    user: Mapped["User"] = relationship(back_populates="accesses")
    group: Mapped["Group"] = relationship(back_populates="accesses")
