"""
API авторизации.
Версия 3 — с экспортом get_current_user для других модулей.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional
import aiosqlite

from app.db.database import get_db
from app.utils import (
    validate_telegram_init_data,
    create_anon_hash,
    generate_recovery_code,
    create_jwt_token,
    verify_jwt_token,
)
from app.config import settings

router = APIRouter()


# =============================================
# DEPENDENCY: get_current_user
# =============================================

async def get_current_user(
    authorization: str = Header(None),
    db: aiosqlite.Connection = Depends(get_db)
) -> int:
    """Извлекает user_id из JWT токена."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    token = authorization.replace("Bearer ", "")
    user_id = verify_jwt_token(token)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return user_id


# =============================================
# МОДЕЛИ
# =============================================

class AuthRequest(BaseModel):
    init_data: str


class AuthResponse(BaseModel):
    token: str
    user_id: int
    is_new_user: bool
    recovery_code: Optional[str] = None


class RecoveryRequest(BaseModel):
    recovery_code: str


# =============================================
# ЭНДПОИНТЫ
# =============================================

@router.post("/verify", response_model=AuthResponse)
async def verify_auth(request: AuthRequest, db: aiosqlite.Connection = Depends(get_db)):
    """
    Верифицирует initData от Telegram и возвращает JWT.
    """
    # В режиме разработки можно пропустить валидацию
    if settings.DEBUG and request.init_data == "debug":
        telegram_id = 12345678
    else:
        user = validate_telegram_init_data(request.init_data)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid init_data")
        telegram_id = user.id
    
    # Создаём анонимный хеш
    anon_hash = create_anon_hash(telegram_id)
    
    # Ищем пользователя
    cursor = await db.execute(
        "SELECT id, recovery_code FROM users WHERE anon_hash = ?",
        (anon_hash,)
    )
    row = await cursor.fetchone()
    
    if row:
        # Существующий пользователь
        user_id = row[0]
        token = create_jwt_token(user_id)
        return AuthResponse(
            token=token,
            user_id=user_id,
            is_new_user=False,
        )
    
    # Новый пользователь
    recovery_code = generate_recovery_code()
    
    cursor = await db.execute(
        "INSERT INTO users (anon_hash, recovery_code) VALUES (?, ?)",
        (anon_hash, recovery_code)
    )
    await db.commit()
    
    user_id = cursor.lastrowid
    
    # Создаём запись streak
    await db.execute(
        "INSERT INTO streaks (user_id, current_streak, best_streak) VALUES (?, 0, 0)",
        (user_id,)
    )
    
    # Создаём профиль пользователя
    await db.execute(
        "INSERT INTO user_profiles (user_id, onboarding_day) VALUES (?, 0)",
        (user_id,)
    )
    
    # Создаём настройки финансов
    await db.execute(
        "INSERT INTO money_settings (user_id) VALUES (?)",
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
    
    user_id = row[0]
    token = create_jwt_token(user_id)
    
    return AuthResponse(
        token=token,
        user_id=user_id,
        is_new_user=False,
    )


@router.get("/me")
async def get_me(
    user_id: int = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Получить данные текущего пользователя."""
    # Профиль
    cursor = await db.execute(
        """SELECT track, onboarding_completed, risk_level, 
                  risk_behavior_score, gambling_score, emotional_regulation_score
           FROM user_profiles WHERE user_id = ?""",
        (user_id,)
    )
    profile_row = await cursor.fetchone()
    
    # Streak
    cursor = await db.execute(
        "SELECT current_streak, best_streak, last_checkin_date FROM streaks WHERE user_id = ?",
        (user_id,)
    )
    streak_row = await cursor.fetchone()
    
    # Recovery code
    cursor = await db.execute(
        "SELECT recovery_code, created_at FROM users WHERE id = ?",
        (user_id,)
    )
    user_row = await cursor.fetchone()
    
    return {
        "id": str(user_id),
        "track": profile_row[0] if profile_row else None,
        "onboardingCompleted": bool(profile_row[1]) if profile_row else False,
        "riskLevel": profile_row[2] if profile_row else "unknown",
        "scores": {
            "impulse": profile_row[3] if profile_row else 0,
            "gambling": profile_row[4] if profile_row else 0,
            "emotional": profile_row[5] if profile_row else 0,
        },
        "streak": {
            "current": streak_row[0] if streak_row else 0,
            "best": streak_row[1] if streak_row else 0,
            "lastCheckinDate": streak_row[2] if streak_row else None,
        },
        "recoveryCode": user_row[0] if user_row else None,
        "createdAt": user_row[1] if user_row else None,
    }
