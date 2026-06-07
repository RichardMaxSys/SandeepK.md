from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
import os
import uuid

from ..database import get_db
from ..models.user import User, Subscription

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("JWT_SECRET", "careerai-jwt-secret-change-in-prod-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)


class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


def create_token(user_id: str, email: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "email": email, "exp": expires},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(401, "Invalid token")
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(401, "User not found")
    return user


def require_active_subscription(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    sub = user.subscription
    # Pro users: unlimited access
    if sub and sub.status == "active":
        return user
    # Free users: allow up to rewrites_limit per month
    if sub and sub.rewrites_used_this_month < sub.rewrites_limit:
        sub.rewrites_used_this_month += 1
        db.commit()
        return user
    # Over limit or no subscription
    used = sub.rewrites_used_this_month if sub else 0
    limit = sub.rewrites_limit if sub else 3
    raise HTTPException(
        status_code=403,
        detail={
            "error": "subscription_required",
            "message": f"You've used {used}/{limit} free AI rewrites this month. Upgrade for unlimited access.",
            "upgrade_url": "/pricing",
            "used": used,
            "limit": limit,
        },
    )


@router.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "Email already registered")
    user = User(
        id=str(uuid.uuid4()),
        email=req.email,
        hashed_password=pwd_context.hash(req.password),
        full_name=req.full_name,
    )
    db.add(user)
    sub = Subscription(
        id=str(uuid.uuid4()),
        user_id=user.id,
        plan="free",
        status="free",
        rewrites_used_this_month=0,
        rewrites_limit=3,
    )
    db.add(sub)
    db.commit()
    db.refresh(user)
    token = create_token(user.id, user.email)
    return {"token": token, "user": _user_response(user)}


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not pwd_context.verify(req.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")
    token = create_token(user.id, user.email)
    return {"token": token, "user": _user_response(user)}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return _user_response(user)


def _user_response(user: User) -> dict:
    sub = user.subscription
    return {
        "id": user.id,
        "email": user.email,
        "name": user.full_name,
        "plan": sub.plan if sub else "free",
        "status": sub.status if sub else "free",
        "rewrites_used": sub.rewrites_used_this_month if sub else 0,
        "rewrites_limit": sub.rewrites_limit if sub else 3,
        "current_period_end": sub.current_period_end.isoformat()
        if sub and sub.current_period_end
        else None,
    }
