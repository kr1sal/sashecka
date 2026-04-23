from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session, selectinload

from app.deps import get_current_user, get_db
from app.models.group import Group
from app.models.user import User
from app.models.user_group_access import UserGroupAccess
from app.schemas.group import GroupCreate, GroupRead, GroupUpdate, UserGroupAccessCreate, UserGroupAccessUpdate


router = APIRouter(prefix="/groups", tags=["groups"], dependencies=[Depends(get_current_user)],)


def _has_grant(access: UserGroupAccess, grant: str) -> bool:
    return access.is_active and grant in access.grants


def _can_smth_group(group: Group, current_user: User, grant: str) -> bool:
    if group.owner_id == current_user.id:
        return True

    for access in group.accesses:
        if access.user_id == current_user.id and _has_grant(access, grant):
            return True
        if access.user_id is None and _has_grant(access, grant):
            return True

    return False


def _get_group_with_accesses(db: Session, group_id: int) -> Group | None:
    return db.scalar(
        select(Group)
        .options(selectinload(Group.accesses))
        .where(Group.id == group_id)
    )


def _filter_existing_user_ids(db: Session, user_ids: list[int | None]) -> list[int]:
    normalized_user_ids = [user_id for user_id in user_ids if user_id is not None]
    if not normalized_user_ids:
        return []

    found_ids = set(db.scalars(select(User.id).where(User.id.in_(normalized_user_ids))))
    return sorted(found_ids)


def _validate_user_ids(db: Session, user_ids: list[int | None]) -> None:
    normalized_user_ids = [user_id for user_id in user_ids if user_id is not None]
    if not normalized_user_ids:
        return

    found_ids = _filter_existing_user_ids(db, normalized_user_ids)
    missing_ids = sorted(set(normalized_user_ids) - set(found_ids))
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Users not found: {missing_ids}",
        )


@router.post(
    "",
    response_model=GroupRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create group with accesses",
)
def create_group(payload: GroupCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Group:
    existing_group = db.scalar(select(Group).where(Group.name == payload.name))
    if existing_group is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Group with this name already exists",
        )
   
    _validate_user_ids(db, [access.user_id for access in payload.accesses])

    group = Group(owner_id=current_user.id, name=payload.name, description=payload.description)
    db.add(group)
    db.flush()

    # Создаём связи между группой и пользователями только для тех пользователей, которые существуют + валидация payload
    common_access: UserGroupAccessCreate | None = None
    for access in payload.accesses:
        # Пропускаем права для текущего пользователя, они всегда read/write/delete
        if access.user_id == current_user.id:
            continue
        if access.user_id is None and common_access is None:
            common_access = UserGroupAccess(
                user_id=None,
                group_id=group.id,
                is_active=True,
                grants=access.grants,
            )
            db.add(
                common_access
            )
            continue
        db.add(
            UserGroupAccess(
                user_id=access.user_id,
                group_id=group.id,
                is_active=True,
                grants=access.grants,
            )
        )
    
    # Если в payload нет общих прав, то создаём по умолчанию права для всех пользователей на чтение
    if common_access is None:
        db.add(
            UserGroupAccess(
                user_id=None,
                group_id=group.id,
                is_active=True,
                grants=["read"],
            )
        )

    db.commit()

    group_with_accesses = _get_group_with_accesses(db, group.id)
    if group_with_accesses is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load created group",
        )
    return group_with_accesses


@router.get("", response_model=list[GroupRead], summary="List groups")
def list_groups(
    q: str | None = Query(default=None, min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Group]:
    statement = select(Group).options(selectinload(Group.accesses))
    if q:
        search = f"%{q}%"
        statement = statement.where(
            or_(Group.name.ilike(search), Group.description.ilike(search))
        )

    groups = list(
        db.scalars(statement.order_by(Group.id))
    )
    return [group for group in groups if _can_smth_group(group, current_user, 'read')]


@router.get("/{group_id}", response_model=GroupRead, summary="Get group by id")
def get_group(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Group:
    group = _get_group_with_accesses(db, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    if not _can_smth_group(group, current_user, 'read'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to read this group")
    return group


@router.put("/{group_id}", response_model=GroupRead, summary="Update group")
def update_group(
    group_id: int,
    payload: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Group:
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    if not _can_smth_group(group, current_user, 'write'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to update this group")
    
    existing_group = db.scalar(
        select(Group).where(Group.name == payload.name, Group.id != group_id)
    )
    if existing_group is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Group with this name already exists",
        )
    
    # При обновлении группы проверяем, что все пользователи, для которых устанавливаются права, существуют
    _validate_user_ids(db, [access.user_id for access in payload.accesses])

    group.name = payload.name
    group.description = payload.description

    # Не уверен, что стоит удалять все связи между группой и пользователями при обновлении группы, однако нам не нужно выполнять доп операцию по получению всех доступов, которые в списке не указаны
    db.execute(delete(UserGroupAccess).where(UserGroupAccess.group_id == group_id))
    db.flush()

    # Создаём связи между группой и пользователями только для тех пользователей, которые существуют + валидация payload
    common_access: UserGroupAccessUpdate | None = None
    for access in payload.accesses:
        # Пропускаем права для текущего пользователя, они всегда read/write/delete
        if access.user_id == current_user.id:
            continue
        if access.user_id is None and common_access is None:
            common_access = UserGroupAccess(
                user_id=None,
                group_id=group.id,
                is_active=True,
                grants=access.grants,
            )
            db.add(
                common_access
            )
            continue
        db.add(
            UserGroupAccess(
                user_id=access.user_id,
                group_id=group.id,
                is_active=True,
                grants=access.grants,
            )
        )
    
    # Если в payload нет общих прав, то создаём по умолчанию права для всех пользователей на чтение
    if common_access is None:
        db.add(
            UserGroupAccess(
                user_id=None,
                group_id=group.id,
                is_active=True,
                grants=["read"],
            )
        )

    db.commit()

    group_with_accesses = _get_group_with_accesses(db, group_id)
    if group_with_accesses is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load updated group",
        )
    return group_with_accesses


@router.delete(
    "/{group_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete group",
)
def delete_group(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Response:
    group = db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    if not _can_smth_group(group, current_user, 'delete'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions to delete this group")
    
    db.execute(delete(UserGroupAccess).where(UserGroupAccess.group_id == group_id))
    db.delete(group)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
