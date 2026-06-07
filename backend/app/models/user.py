import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


def new_id() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=new_id)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    subscription = relationship("Subscription", back_populates="user", uselist=False)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String, primary_key=True, default=new_id)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    dodo_customer_id = Column(String, unique=True, index=True, nullable=True)
    dodo_subscription_id = Column(String, unique=True, index=True, nullable=True)
    plan = Column(String, default="free")        # free | monthly | yearly
    status = Column(String, default="free")      # free | active | canceled | past_due
    current_period_end = Column(DateTime, nullable=True)
    rewrites_used_this_month = Column(Integer, default=0)
    rewrites_limit = Column(Integer, default=3)  # free: 3, pro: -1 (unlimited)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="subscription")
