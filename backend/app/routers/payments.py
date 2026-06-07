from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import httpx
import hmac
import hashlib
import json
import logging
from datetime import datetime, timezone

from ..database import get_db
from ..models.user import User, Subscription
from .auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])

DODO_API_URL = os.getenv("DODO_API_URL", "https://api.dodopayments.com")
DODO_SECRET_KEY = os.getenv("DODO_SECRET_KEY", "")
DODO_WEBHOOK_SECRET = os.getenv("DODO_WEBHOOK_SECRET", "")
DODO_PRICE_ID_MONTHLY = os.getenv("DODO_PRICE_ID_MONTHLY", "")
DODO_PRICE_ID_YEARLY = os.getenv("DODO_PRICE_ID_YEARLY", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


class CheckoutRequest(BaseModel):
    plan: str = "monthly"  # monthly | yearly


@router.post("/create-checkout")
async def create_checkout(
    req: CheckoutRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Dodo Payments checkout link for a subscription."""
    price_id = DODO_PRICE_ID_MONTHLY if req.plan == "monthly" else DODO_PRICE_ID_YEARLY
    if not price_id:
        raise HTTPException(400, f"No price ID configured for plan: {req.plan}")

    # Update user's dodo_customer_id if we already have one
    sub = user.subscription
    dodo_customer_id = sub.dodo_customer_id if sub else None

    body = {
        "price_data": [{"price_id": price_id, "quantity": 1}],
        "allowed_payment_methods": ["card"],
        "redirect_url": f"{FRONTEND_URL}/app?tab=tailor&checkout=success",
        "metadata": {"user_id": user.id},
    }
    if dodo_customer_id:
        body["customer_id"] = dodo_customer_id
    else:
        body["customer"] = {"email": user.email}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{DODO_API_URL}/payment_links",
                headers={
                    "Authorization": f"Bearer {DODO_SECRET_KEY}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
            if resp.status_code >= 400:
                logger.error("Dodo checkout error: %s %s", resp.status_code, resp.text)
                raise HTTPException(502, f"Dodo Payments API error: {resp.status_code}")

            data = resp.json()
            checkout_url = data.get("url") or data.get("checkout_url") or data.get("payment_link_url", "")

            # Store the dodo_customer_id if returned
            returned_customer_id = data.get("customer_id")
            if returned_customer_id and sub:
                sub.dodo_customer_id = returned_customer_id
                db.commit()

            return {"checkout_url": checkout_url}

    except httpx.RequestError as e:
        logger.error("Dodo HTTP error: %s", str(e))
        raise HTTPException(502, f"Cannot reach Dodo Payments: {str(e)}")


@router.post("/webhook")
async def webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Dodo Payments webhook events. No auth — public endpoint."""
    body_bytes = await request.body()
    signature = request.headers.get("x-dodo-signature") or request.headers.get("x-signature")

    # Verify webhook signature if secret is configured
    if DODO_WEBHOOK_SECRET and signature:
        computed = hmac.new(
            DODO_WEBHOOK_SECRET.encode(), body_bytes, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(computed, signature):
            logger.warning("Invalid webhook signature")
            raise HTTPException(400, "Invalid signature")

    try:
        payload = json.loads(body_bytes)
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON")

    event_type = payload.get("type") or payload.get("event") or payload.get("event_type", "")
    data = payload.get("data") or payload.get("payload", {})

    logger.info("Dodo webhook received: %s", event_type)

    if event_type in ("subscription.active", "subscription.created"):
        # Find subscription by dodo subscription ID or customer ID
        dodo_sub_id = data.get("id") or data.get("subscription_id")
        dodo_customer_id = data.get("customer_id")
        user_id = (data.get("metadata") or {}).get("user_id")

        if user_id:
            sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
            if sub:
                sub.dodo_subscription_id = dodo_sub_id or sub.dodo_subscription_id
                sub.dodo_customer_id = dodo_customer_id or sub.dodo_customer_id
                sub.plan = "monthly"
                sub.status = "active"
                sub.rewrites_used_this_month = 0  # reset on new billing period
                sub.rewrites_limit = -1  # unlimited
                # Parse current_period_end if available
                period_end = data.get("current_period_end") or data.get("expires_at")
                if period_end:
                    try:
                        sub.current_period_end = datetime.fromisoformat(period_end.replace("Z", "+00:00"))
                    except (ValueError, AttributeError):
                        pass
                db.commit()
                logger.info("Subscription activated for user %s", user_id)

    elif event_type in ("subscription.cancelled", "subscription.canceled"):
        dodo_sub_id = data.get("id") or data.get("subscription_id")
        if dodo_sub_id:
            sub = db.query(Subscription).filter(
                Subscription.dodo_subscription_id == dodo_sub_id
            ).first()
            if sub:
                sub.status = "canceled"
                sub.rewrites_limit = 3  # back to free tier limit
                db.commit()
                logger.info("Subscription cancelled for user %s", sub.user_id)

    elif event_type in ("subscription.updated", "subscription.past_due"):
        dodo_sub_id = data.get("id") or data.get("subscription_id")
        if dodo_sub_id:
            sub = db.query(Subscription).filter(
                Subscription.dodo_subscription_id == dodo_sub_id
            ).first()
            if sub:
                new_status = data.get("status", sub.status)
                if new_status in ("past_due", "incomplete"):
                    sub.status = "past_due"
                period_end = data.get("current_period_end") or data.get("expires_at")
                if period_end:
                    try:
                        sub.current_period_end = datetime.fromisoformat(period_end.replace("Z", "+00:00"))
                    except (ValueError, AttributeError):
                        pass
                db.commit()
                logger.info("Subscription updated for user %s", sub.user_id)

    return {"received": True}


@router.get("/status")
async def subscription_status(user: User = Depends(get_current_user)):
    """Get current subscription status for the authenticated user."""
    sub = user.subscription
    return {
        "plan": sub.plan if sub else "free",
        "status": sub.status if sub else "free",
        "rewrites_used": sub.rewrites_used_this_month if sub else 0,
        "rewrites_limit": sub.rewrites_limit if sub else 3,
    }
