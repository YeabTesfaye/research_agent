from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from auth import service

bearer_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), 
                     db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        data = service.decode_token(token)
        if data.get("type") != "access":
            raise ValueError()
        user = service.get_user_by_id(db, int(data["sub"]))
        if not user or not user.is_active:
            raise ValueError()
        return user
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")