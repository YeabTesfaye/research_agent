from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from auth import models, schemas, service
from auth.email import initiate_password_reset
from dependencies import get_current_user
from datetime import datetime
import time
from collections import defaultdict
from threading import Lock

router = APIRouter(prefix="/api/auth", tags=["auth"])

_login_attempts: dict = defaultdict(list)
_lock = Lock()


def _check_rate_limit(key: str, max_attempts: int = 5, window_seconds: int = 300):
    now = time.time()
    with _lock:
        _login_attempts[key] = [t for t in _login_attempts[key] if now - t < window_seconds]
        if len(_login_attempts[key]) >= max_attempts:
            raise HTTPException(
                status_code=429,
                detail=f"Too many attempts. Please wait {window_seconds // 60} minutes.",
                headers={"Retry-After": str(window_seconds)},
            )
        _login_attempts[key].append(now)


@router.post("/register", response_model=schemas.UserResponse, status_code=201)
async def register(payload: schemas.RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    _check_rate_limit(f"register:{ip}", max_attempts=10, window_seconds=3600)
    email = payload.email.lower()
    if await service.get_user_by_email(db, email):
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    user = models.User(
        email=email,
        hashed_password=service.hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=schemas.TokenResponse)
async def login(payload: schemas.LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    _check_rate_limit(f"login:{ip}", max_attempts=10, window_seconds=300)
    user = await service.get_user_by_email(db, payload.email.lower())
    if not user or not service.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been disabled.")
    user.last_login_at = datetime.utcnow()
    await db.commit()
    return {
        "access_token": service.create_access_token(user.id),
        "refresh_token": service.create_refresh_token(user.id),
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=schemas.TokenResponse)
async def refresh(payload: schemas.RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        data = service.decode_token(payload.refresh_token)
        if data.get("type") != "refresh":
            raise ValueError()
        user = await service.get_user_by_id(db, int(data["sub"]))
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
async def forgot_password(
    payload: schemas.ForgotPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    ip = request.client.host if request.client else "unknown"
    _check_rate_limit(f"forgot:{ip}", max_attempts=5, window_seconds=3600)
    await initiate_password_reset(db, payload.email.lower())
    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password", status_code=200)
async def reset_password(payload: schemas.ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.User).where(models.User.password_reset_token == payload.token)
    )
    user = result.scalar_one_or_none()
    if not user or not user.password_reset_expires:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")
    if user.password_reset_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")
    user.hashed_password = service.hash_password(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    await db.commit()
    return {"message": "Password updated successfully."}


@router.get("/me", response_model=schemas.UserResponse)
async def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=schemas.UserResponse)
async def update_profile(
    payload: schemas.UpdateProfileRequest,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.bio is not None:
        current_user.bio = payload.bio
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.patch("/preferences", response_model=schemas.UserResponse)
async def update_preferences(
    payload: schemas.UpdatePreferencesRequest,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.email_notifications is not None:
        current_user.email_notifications = payload.email_notifications
    if payload.report_complete_email is not None:
        current_user.report_complete_email = payload.report_complete_email
    if payload.weekly_digest is not None:
        current_user.weekly_digest = payload.weekly_digest
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/change-password", status_code=200)
async def change_password(
    payload: schemas.ChangePasswordRequest,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not service.verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password.")
    current_user.hashed_password = service.hash_password(payload.new_password)
    await db.commit()
    return {"message": "Password changed successfully."}


@router.delete("/account", status_code=200)
async def delete_account(
    payload: schemas.DeleteAccountRequest,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not service.verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password.")
    await db.delete(current_user)
    await db.commit()
    return {"message": "Account deleted successfully."}


@router.get("/password-strength")
def password_strength(password: str):
    if not password:
        return {"score": 0, "feedback": ["Enter a password"], "is_valid": False}
    return service.check_password_strength(password)