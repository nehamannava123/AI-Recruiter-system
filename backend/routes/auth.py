from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models import User
from auth.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3)
    password: str = Field(min_length=6)
    role: str  # "candidate" or "recruiter"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    user_id: int


def _issue_token(user: User) -> TokenResponse:
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        username=user.username,
        user_id=user.id,
    )


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if payload.role not in ("candidate", "recruiter"):
        raise HTTPException(status_code=400, detail="role must be 'candidate' or 'recruiter'")

    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return _issue_token(user)


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm expects application/x-www-form-urlencoded body
    # with "username" and "password" fields.
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    return _issue_token(user)
