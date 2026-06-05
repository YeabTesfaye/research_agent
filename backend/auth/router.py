from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth import models, schemas, service
from auth.email import initiate_password_reset
from dependencies import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserResponse, status_code=201)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    if service.get_user_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="Email already registered.")

    user = models.User(
        email=payload.email,
        hashed_password=service.hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = service.get_user_by_email(db, payload.email)
    if not user or not service.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled.")

    return {
        "access_token": service.create_access_token(user.id),
        "refresh_token": service.create_refresh_token(user.id),
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=schemas.TokenResponse)
def refresh(payload: schemas.RefreshRequest, db: Session = Depends(get_db)):
    try:
        data = service.decode_token(payload.refresh_token)
        if data.get("type") != "refresh":
            raise ValueError()
        user = service.get_user_by_id(db, int(data["sub"]))
        if not user or not user.is_active:
            raise ValueError()
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    return {
        "access_token": service.create_access_token(user.id),
        "refresh_token": service.create_refresh_token(user.id),
        "token_type": "bearer",
    }


@router.post("/forgot-password", status_code=200)
def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    initiate_password_reset(db, payload.email)
    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password", status_code=200)
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.password_reset_token == payload.token
    ).first()

    if not user or not user.password_reset_expires:
        raise HTTPException(status_code=400, detail="Invalid or expired token.")
    if user.password_reset_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset token has expired.")

    user.hashed_password = service.hash_password(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()

    return {"message": "Password reset successfully."}


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user