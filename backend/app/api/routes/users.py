from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session, selectinload

from app.deps import get_current_user, get_db
from app.models.user import User
from app.models.user_group_access import UserGroupAccess
from app.schemas.group import UserGroupInvitationRead
from app.schemas.user import UserRead, UserUpdate


router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(get_current_user)],)


def _serialize_invitation(access: UserGroupAccess) -> UserGroupInvitationRead:
    if access.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User invitation must belong to a specific user",
        )
    if access.group is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invitation group is missing",
        )

    return UserGroupInvitationRead(
        id=access.id,
        user_id=access.user_id,
        group_id=access.group_id,
        is_active=access.is_active,
        grants=access.grants,
        created_at=access.created_at,
        updated_at=access.updated_at,
        group_name=access.group.name,
        group_description=access.group.description,
    )


@router.get("/current", response_model=UserRead, summary="Get current user profile")
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user

@router.put("/current", response_model=UserRead, summary="Update current user")
def update_user(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    existing_user = db.scalar(
        select(User).where(
            or_(User.email == payload.email, User.username == payload.username),
            User.id != current_user.id,
        )
    )
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email or username already exists",
        )

    current_user.email = payload.email
    current_user.username = payload.username
    current_user.full_name = payload.full_name

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get(
    "/current/group-invitations",
    response_model=list[UserGroupInvitationRead],
    summary="List current user pending group invitations",
)
def list_current_user_group_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[UserGroupInvitationRead]:
    invitations = list(
        db.scalars(
            select(UserGroupAccess)
            .options(selectinload(UserGroupAccess.group))
            .where(
                UserGroupAccess.user_id == current_user.id,
                UserGroupAccess.is_active.is_(False),
            )
            .order_by(UserGroupAccess.created_at.desc(), UserGroupAccess.id.desc())
        )
    )
    return [_serialize_invitation(access) for access in invitations]


@router.patch(
    "/current/group-invitations/{access_id}",
    response_model=UserGroupInvitationRead,
    summary="Accept current user group invitation",
)
def accept_current_user_group_invitation(
    access_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserGroupInvitationRead:
    access = db.scalar(
        select(UserGroupAccess)
        .options(selectinload(UserGroupAccess.group))
        .where(
            UserGroupAccess.id == access_id,
            UserGroupAccess.user_id == current_user.id,
            UserGroupAccess.is_active.is_(False),
        )
    )
    if access is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")

    access.is_active = True
    db.commit()
    refreshed_access = db.scalar(
        select(UserGroupAccess)
        .options(selectinload(UserGroupAccess.group))
        .where(
            UserGroupAccess.id == access_id,
            UserGroupAccess.user_id == current_user.id,
        )
    )
    if refreshed_access is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    return _serialize_invitation(refreshed_access)


@router.delete(
    "/current/group-invitations/{access_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Ignore current user group invitation",
)
def ignore_current_user_group_invitation(
    access_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    access = db.scalar(
        select(UserGroupAccess).where(
            UserGroupAccess.id == access_id,
            UserGroupAccess.user_id == current_user.id,
        )
    )
    if access is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    
    db.delete(access)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/current", status_code=status.HTTP_204_NO_CONTENT, summary="Delete user")
def delete_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    db.execute(delete(UserGroupAccess).where(UserGroupAccess.user_id == current_user.id))
    db.delete(current_user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("", response_model=list[UserRead], summary="List users")
def list_users(
    q: str | None = Query(default=None, min_length=1),
    db: Session = Depends(get_db),
) -> list[User]:
    statement = select(User)
    if q:
        search = f"%{q}%"
        statement = statement.where(
            or_(
                User.email.ilike(search),
                User.username.ilike(search),
                User.full_name.ilike(search),
            )
        )

    return list(db.scalars(statement.order_by(User.id)))


@router.get("/{user_id}", response_model=UserRead, summary="Get user by id")
def get_user(user_id: int, db: Session = Depends(get_db)) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
