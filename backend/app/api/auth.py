"""
API для авторизации.
Версия 3 — с get_current_user и /me.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
import aiosqlite
import jwt

from app.db.database import get_db
from app.utils import (
    validate_telegram_init_data,
    create_anon_hash,
    generate_recovery_code,
    create_jwt_token,
)
from app.config import settings

router = APIRouter()


class AuthRequest(BaseModel):
    init_data: str


class AuthResponse(BaseModel):
    token: str
    user_id: int
    is_new_user: bool
    recovery_code: str | None = None


class RecoveryRequest(BaseModel):
    recovery_code: str


async def get_current_user(authorization: str = Header(None)) -> int:
    """Извлекает user_id из JWT токена."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid auth scheme")
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Authorization failed")


@router.get("/me")
async def get_me(
    user_id: int = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Получить данные текущего пользователя."""
    # Профиль
    cursor = await db.execute(
        "SELECT track, onboarding_completed FROM user_profiles WHERE user_id = ?",
        (user_id,)
    )
    profile_row = await cursor.fetchone()

    # User data с настройками уведомлений
    cursor = await db.execute(
        "SELECT recovery_code, reminder_enabled, reminder_hour FROM users WHERE id = ?",
        (user_id,)
    )
    user_row = await cursor.fetchone()

    # Streak
    cursor = await db.execute(
        "SELECT current_streak, best_streak, last_checkin_date FROM streaks WHERE user_id = ?",
        (user_id,)
    )
    streak_row = await cursor.fetchone()

    return {
        "userId": str(user_id),
        "track": profile_row["track"] if profile_row else None,
        "onboardingCompleted": bool(profile_row["onboarding_completed"]) if profile_row else False,
        "recoveryCode": user_row["recovery_code"] if user_row else None,
        "reminderEnabled": bool(user_row["reminder_enabled"]) if user_row else True,
        "reminderHour": user_row["reminder_hour"] if user_row else 20,
        "streak": {
            "current": streak_row["current_streak"] if streak_row else 0,
            "best": streak_row["best_streak"] if streak_row else 0,
            "lastCheckinDate": streak_row["last_checkin_date"] if streak_row else None,
        } if streak_row else {"current": 0, "best": 0, "lastCheckinDate": None},
    }


class ReminderSettingsRequest(BaseModel):
    enabled: bool
    hour: int  # 0-23


@router.put("/reminders")
async def update_reminder_settings(
    request: ReminderSettingsRequest,
    user_id: int = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Обновить настройки уведомлений."""
    if not 0 <= request.hour <= 23:
        raise HTTPException(status_code=400, detail="Hour must be 0-23")

    await db.execute(
        "UPDATE users SET reminder_enabled = ?, reminder_hour = ? WHERE id = ?",
        (request.enabled, request.hour, user_id)
    )
    await db.commit()

    return {"ok": True, "enabled": request.enabled, "hour": request.hour}


@router.post("/verify", response_model=AuthResponse)
async def verify_auth(request: AuthRequest, db: aiosqlite.Connection = Depends(get_db)):
    """Верифицирует initData от Telegram и возвращает JWT."""
    if settings.DEBUG and request.init_data == "debug":
        telegram_id = 12345678
    else:
        user = validate_telegram_init_data(request.init_data)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid init_data")
        telegram_id = user.id

    anon_hash = create_anon_hash(telegram_id)

    cursor = await db.execute(
        "SELECT id, recovery_code FROM users WHERE anon_hash = ?",
        (anon_hash,)
    )
    row = await cursor.fetchone()

    if row:
        user_id = row["id"]
        # Обновляем telegram_id (может измениться при восстановлении)
        await db.execute(
            "UPDATE users SET telegram_id = ? WHERE id = ?",
            (telegram_id, user_id)
        )
        await db.commit()
        token = create_jwt_token(user_id)
        return AuthResponse(
            token=token,
            user_id=user_id,
            is_new_user=False,
        )

    # Новый пользователь
    recovery_code = generate_recovery_code()
    cursor = await db.execute(
        "INSERT INTO users (anon_hash, recovery_code, telegram_id) VALUES (?, ?, ?)",
        (anon_hash, recovery_code, telegram_id)
    )
    await db.commit()
    user_id = cursor.lastrowid

    # Создаём streak
    await db.execute(
        "INSERT INTO streaks (user_id, current_streak, best_streak) VALUES (?, 0, 0)",
        (user_id,)
    )
    
    # Создаём профиль
    await db.execute(
        "INSERT INTO user_profiles (user_id) VALUES (?)",
        (user_id,)
    )
    
    # Создаём настройки денег
    await db.execute(
        "INSERT OR IGNORE INTO money_settings (user_id) VALUES (?)",
        (user_id,)
    )
    
    await db.commit()

    token = create_jwt_token(user_id)
    return AuthResponse(
        token=token,
        user_id=user_id,
        is_new_user=True,
        recovery_code=recovery_code,
    )


@router.post("/recover", response_model=AuthResponse)
async def recover_account(
    request: RecoveryRequest,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Восстановление аккаунта по recovery code."""
    cursor = await db.execute(
        "SELECT id FROM users WHERE recovery_code = ?",
        (request.recovery_code.upper(),)
    )
    row = await cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Invalid recovery code")

    user_id = row["id"]
    token = create_jwt_token(user_id)

    return AuthResponse(
        token=token,
        user_id=user_id,
        is_new_user=False,
    )
