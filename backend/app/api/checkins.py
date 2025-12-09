"""
API для чек-инов.
Версия 3 — с поддержкой суммы потерь при срыве.
"""

from datetime import date
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
import aiosqlite

from app.db.database import get_db
from app.api.auth import get_current_user

router = APIRouter()


class CheckInCreate(BaseModel):
    urge: int = Field(..., ge=0, le=10, description="Уровень тяги (0-10)")
    stress: int = Field(..., ge=0, le=10, description="Уровень стресса (0-10)")
    mood: int = Field(..., ge=0, le=10, description="Настроение (0-10)")
    relapse: bool = Field(default=False, description="Был ли срыв")
    note: Optional[str] = Field(default=None, max_length=500, description="Заметка")
    lossAmount: Optional[int] = Field(default=None, description="Сумма потерь при срыве")


class CheckInResponse(BaseModel):
    id: int
    urge: int
    stress: int
    mood: int
    relapse: bool
    note: Optional[str]
    lossAmount: Optional[int] = None
    date: str  # Изменено для совместимости с новым фронтом
    streakUpdated: bool = False
    newStreak: int = 0
    previousStreak: int = 0


@router.post("")
async def create_checkin(
    checkin: CheckInCreate,
    user_id: int = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Создаёт новый чек-ин и обновляет streak."""
    
    # Сохраняем предыдущую серию (для показа после срыва)
    cursor = await db.execute(
        "SELECT current_streak FROM streaks WHERE user_id = ?",
        (user_id,)
    )
    row = await cursor.fetchone()
    previous_streak = row[0] if row else 0
    
    # Создаём чек-ин
    cursor = await db.execute(
        """
        INSERT INTO checkins (user_id, urge, stress, mood, relapse, note, loss_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (user_id, checkin.urge, checkin.stress, checkin.mood, 
         checkin.relapse, checkin.note, checkin.lossAmount)
    )
    await db.commit()
    checkin_id = cursor.lastrowid
    
    # Записываем потерю в money_entries если есть
    if checkin.relapse and checkin.lossAmount and checkin.lossAmount > 0:
        await db.execute(
            "INSERT INTO money_entries (user_id, amount, entry_type) VALUES (?, ?, 'loss')",
            (user_id, checkin.lossAmount)
        )
        await db.commit()
    
    # Обновляем streak
    today = date.today().isoformat()
    
    cursor = await db.execute(
        "SELECT current_streak, best_streak, last_checkin_date FROM streaks WHERE user_id = ?",
        (user_id,)
    )
    streak_row = await cursor.fetchone()
    
    streak_updated = False
    new_streak = 0
    
    if streak_row:
        current_streak = streak_row[0]
        best_streak = streak_row[1]
        last_date = streak_row[2]
        
        if checkin.relapse:
            # Срыв — сбрасываем streak
            new_streak = 0
        elif last_date == today:
            # Уже был чек-ин сегодня
            new_streak = current_streak
        else:
            # Новый день без срыва
            new_streak = current_streak + 1
        
        new_best = max(best_streak, new_streak)
        
        await db.execute(
            """UPDATE streaks 
               SET current_streak = ?, best_streak = ?, last_checkin_date = ?
               WHERE user_id = ?""",
            (new_streak, new_best, today, user_id)
        )
        await db.commit()
        streak_updated = True
    else:
        # Создаём запись streak если нет
        new_streak = 0 if checkin.relapse else 1
        await db.execute(
            """INSERT INTO streaks (user_id, current_streak, best_streak, last_checkin_date)
               VALUES (?, ?, ?, ?)""",
            (user_id, new_streak, new_streak, today)
        )
        await db.commit()
        streak_updated = True
    
    # Получаем созданный чек-ин
    cursor = await db.execute(
        "SELECT * FROM checkins WHERE id = ?",
        (checkin_id,)
    )
    row = await cursor.fetchone()
    
    return {
        "id": row[0],
        "urge": row[2],
        "stress": row[3],
        "mood": row[4],
        "relapse": bool(row[5]),
        "note": row[6],
        "lossAmount": row[7] if len(row) > 7 else None,
        "date": row[8] if len(row) > 8 else row[7],  # created_at
        "streakUpdated": streak_updated,
        "newStreak": new_streak,
        "previousStreak": previous_streak,
    }


@router.get("")
async def get_checkins(
    limit: int = 30,
    user_id: int = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Получает историю чек-инов пользователя."""
    cursor = await db.execute(
        """SELECT id, user_id, urge, stress, mood, relapse, note, loss_amount, created_at
           FROM checkins 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT ?""",
        (user_id, limit)
    )
    rows = await cursor.fetchall()
    
    return [
        {
            "id": str(row[0]),
            "urge": row[2],
            "stress": row[3],
            "mood": row[4],
            "relapse": bool(row[5]),
            "note": row[6],
            "lossAmount": row[7],
            "date": row[8],
        }
        for row in rows
    ]


@router.get("/today")
async def get_today_checkin(
    user_id: int = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Проверяет был ли чек-ин сегодня."""
    today = date.today().isoformat()
    
    cursor = await db.execute(
        """SELECT id, urge, stress, mood, relapse, note, loss_amount, created_at
           FROM checkins 
           WHERE user_id = ? AND date(created_at) = ?
           ORDER BY created_at DESC
           LIMIT 1""",
        (user_id, today)
    )
    row = await cursor.fetchone()
    
    if row:
        return {
            "hasCheckin": True,
            "checkin": {
                "id": str(row[0]),
                "urge": row[1],
                "stress": row[2],
                "mood": row[3],
                "relapse": bool(row[4]),
                "note": row[5],
                "lossAmount": row[6],
                "date": row[7],
            }
        }
    
    return {"hasCheckin": False, "checkin": None}
