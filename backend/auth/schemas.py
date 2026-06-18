import re

from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional
from datetime import datetime



def validate_password_strength(v: str) -> str:
    if len(v) < 8:
        raise ValueError("Password must be at least 8 characters.")
    if len(v) > 128:
        raise ValueError("Password must be under 128 characters.")
    if not re.search(r"[A-Z]", v):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not re.search(r"[0-9]", v):
        raise ValueError("Password must contain at least one number.")
    return v

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password must be 72 characters or fewer")
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        return validate_password_strength(v)
    
    @field_validator("full_name")
    @classmethod
    def santize_name(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 100:
                raise ValueError("Full name must be under 100 characters.")
        return v or None



class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v):
        return validate_password_strength(v)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v):
        return validate_password_strength(v)

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def sanitize_name(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 100:
                raise ValueError("Full name must be under 100 characters.")
        return v or None
    @field_validator("bio")
    @classmethod
    def sanitize_bio(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 200:
                raise ValueError("Bio must be under 200 characters.")
        return v or None
    @field_validator("avatar_url")
    @classmethod
    def sanitize_avatar_url(cls, v):
        if v is not None:
            v = v.strip()
        return v or None
    @field_validator("avatar_url")
    @classmethod
    def validate_avatar_url(cls, v):
        if v is not None and not re.match(r"^https?://", v):
            raise ValueError("Avatar URL must start with http:// or https://")
        return v


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime
    email_notifications: bool
    weekly_digest: bool
    last_login: Optional[datetime]

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class UpdatePreferencesRequest(BaseModel):
    email_notifications: Optional[bool] = None
    report_complete_email: Optional[bool] = None
    weekly_digest: Optional[bool] = None
    

class DeleteAccountRequest(BaseModel):
    password: str
    confirmation: bool

    @model_validator(mode="after")
    def check_confirmation(self):
        if self.confirmation != "DELETE":
            raise ValueError("You must type 'DELETE' to confirm account deletion.")
        return self
    
class PasswordStrengthResponse(BaseModel):
    is_strong: bool
    feedback : list[str]
    is_valid: bool
    