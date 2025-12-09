import hmac
import hashlib
import json
from datetime import datetime, timedelta
from urllib.parse import parse_qs
from typing import Optional

import jwt
from pydantic import BaseModel

from app.config import settings


class TelegramUser(BaseModel):
    """Данные пользователя из Telegram WebApp."""
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    language_code: Optional[str] = None


def validate_telegram_init_data(init_data: str) -> Optional[TelegramUser]:
    """
    Валидирует initData от Telegram WebApp.
    
    Проверяет подпись данных с использованием BOT_TOKEN.
    Возвращает данные пользователя или None при невалидных данных.
    """
    try:
        # Парсим данные
        parsed = parse_qs(init_data)
        
        # Извлекаем hash
        received_hash = parsed.get("hash", [None])[0]
        if not received_hash:
            return None
        
        # Собираем строку для проверки (без hash, отсортировано)
        data_check_pairs = []
        for key, values in parsed.items():
            if key != "hash":
                data_check_pairs.append(f"{key}={values[0]}")
        data_check_pairs.sort()
        data_check_string = "\n".join(data_check_pairs)
        
        # Создаём secret_key из BOT_TOKEN
        secret_key = hmac.new(
            b"WebAppData",
            settings.BOT_TOKEN.encode(),
            hashlib.sha256
        ).digest()
        
        # Вычисляем hash
        computed_hash = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Сравниваем
        if not hmac.compare_digest(computed_hash, received_hash):
            return None
        
        # Извлекаем данные пользователя
        user_data = parsed.get("user", [None])[0]
        if not user_data:
            return None
        
        user_dict = json.loads(user_data)
        return TelegramUser(**user_dict)
        
    except Exception as e:
        print(f"Error validating init_data: {e}")
        return None


def create_jwt_token(user_id: int) -> str:
    """Создаёт JWT токен для пользователя."""
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_jwt_token(token: str) -> Optional[int]:
    """
    Проверяет JWT токен.
    Возвращает user_id или None при невалидном токене.
    """
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload.get("user_id")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# FastAPI Dependency для получения текущего пользователя
from fastapi import HTTPException, Header
from typing import Annotated


async def get_current_user(
        authorization: Annotated[str | None, Header()] = None
) -> int:
    """
    FastAPI Dependency для извлечения user_id из JWT токена.
    Ожидает заголовок: Authorization: Bearer <token>
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = parts[1]
    user_id = verify_jwt_token(token)

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user_id