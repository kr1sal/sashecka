from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserGroupAccessCreate(BaseModel):
    user_id: int | None
    grants: list[str] = Field(default_factory=list)


class UserGroupAccessUpdate(BaseModel):
    user_id: int | None
    group_id: int
    grants: list[str] = Field(default_factory=list)


class UserGroupAccessRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    group_id: int
    is_active: bool
    grants: list[str]
    created_at: datetime
    updated_at: datetime | None


class UserGroupAccessDelete(BaseModel):
    user_id: int # | None - для общих прав, которые нельзя удалить (они удаляются вместе с группой)
    group_id: int


class GroupCreate(BaseModel):
    name: str = Field(min_length=3, max_length=255)
    description: str | None = Field(default=None, min_length=3, max_length=255)
    accesses: list[UserGroupAccessCreate] = Field(default_factory=list)


class GroupUpdate(BaseModel):
    name: str = Field(min_length=3, max_length=255)
    description: str | None = Field(default=None, min_length=3, max_length=255)
    accesses: list[UserGroupAccessUpdate] = Field(default_factory=list)


class GroupRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None = None
    accesses: list[UserGroupAccessRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime | None


class GroupDelete(BaseModel):
    id: int
