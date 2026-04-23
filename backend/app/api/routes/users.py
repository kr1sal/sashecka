from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models.user import User
from app.models.user_group_access import UserGroupAccess
from app.schemas.user import UserRead, UserUpdate


router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(get_current_user)],)


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
