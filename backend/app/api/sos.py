from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
import aiosqlite

from app.db.database import get_db
from app.api.auth import get_current_user

router = APIRouter()


class SOSRequest(BaseModel):
    trigger_type: Optional[str] = None  # "high_urge", "stress", "manual"


class SOSResponse(BaseModel):
    logged: bool
    message: str
    techniques: list[dict]


# Техники для SOS-режима
SOS_TECHNIQUES = [
    {
        "id": "breathing",
        "title": "Дыхание 4-4-4-4",
        "description": "Вдох 4 секунды → Задержка 4 секунды → Выдох 4 секунды → Задержка 4 секунды. Повтори 4 раза.",
        "duration_seconds": 64,
    },
    {
        "id": "grounding",
        "title": "Заземление 5-4-3-2-1",
        "description": "Назови 5 вещей, которые видишь. 4 — которые слышишь. 3 — которые можешь потрогать. 2 запаха. 1 вкус.",
        "duration_seconds": 120,
    },
    {
        "id": "pause",
        "title": "Пауза 10 минут",
        "description": "Поставь таймер на 10 минут. Не принимай решений до его окончания. Тяга — как волна: она нарастает и спадает.",
        "duration_seconds": 600,
    },
    {
        "id": "distraction",
        "title": "Переключение",
        "description": "Выйди на улицу на 5 минут. Или умойся холодной водой. Или позвони кому-то близкому.",
        "duration_seconds": 300,
    },
]


@router.post("", response_model=SOSResponse)
async def trigger_sos(
    request: SOSRequest,
    user_id: int = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Логирует SOS-событие и возвращает техники помощи.
    
    Используется для:
    - Ручного нажатия кнопки SOS
    - Автоматического триггера при высоком urge в чек-ине
    """
    # Логируем событие
    await db.execute(
        "INSERT INTO sos_events (user_id, trigger_type) VALUES (?, ?)",
        (user_id, request.trigger_type)
    )
    await db.commit()
    
    return SOSResponse(
        logged=True,
        message="Ты справишься. Это временное состояние. Попробуй одну из техник:",
        techniques=SOS_TECHNIQUES,
    )


@router.get("/techniques")
async def get_techniques():
    """Получает список техник без логирования."""
    return SOS_TECHNIQUES
