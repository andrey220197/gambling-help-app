"""
API для отслеживания финансов.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from app.db.database import get_db
from app.api.auth import get_current_user

router = APIRouter()


class MoneySettingsUpdate(BaseModel):
    enabled: bool
    averageAmount: int
    showSaved: bool
    trackLosses: bool


class MoneyEntryCreate(BaseModel):
    amount: int
    type: str = "loss"  # loss | saved
    note: Optional[str] = None


@router.get("/settings")
async def get_money_settings(
    user_id: int = Depends(get_current_user),
    db=Depends(get_db)
):
    """Получить настройки финансов."""
    async with db.execute(
        """SELECT enabled, average_amount, show_saved, track_losses
           FROM money_settings WHERE user_id = ?""",
        (user_id,)
    ) as cursor:
        row = await cursor.fetchone()
    
    if row:
        return {
            "enabled": bool(row[0]),
            "averageAmount": row[1] or 0,
            "showSaved": bool(row[2]),
            "trackLosses": bool(row[3]),
        }
    
    # Возвращаем дефолтные настройки
    return {
        "enabled": False,
        "averageAmount": 0,
        "showSaved": True,
        "trackLosses": False,
    }


@router.put("/settings")
async def update_money_settings(
    settings: MoneySettingsUpdate,
    user_id: int = Depends(get_current_user),
    db=Depends(get_db)
):
    """Обновить настройки финансов."""
    # Upsert
    await db.execute(
        """INSERT INTO money_settings (user_id, enabled, average_amount, show_saved, track_losses)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
               enabled = excluded.enabled,
               average_amount = excluded.average_amount,
               show_saved = excluded.show_saved,
               track_losses = excluded.track_losses,
               updated_at = CURRENT_TIMESTAMP""",
        (user_id, settings.enabled, settings.averageAmount, 
         settings.showSaved, settings.trackLosses)
    )
    await db.commit()
    
    return {
        "enabled": settings.enabled,
        "averageAmount": settings.averageAmount,
        "showSaved": settings.showSaved,
        "trackLosses": settings.trackLosses,
    }


@router.get("/entries")
async def get_money_entries(
    limit: int = 50,
    user_id: int = Depends(get_current_user),
    db=Depends(get_db)
):
    """Получить историю финансов."""
    async with db.execute(
        """SELECT id, amount, entry_type, note, created_at
           FROM money_entries
           WHERE user_id = ?
           ORDER BY created_at DESC
           LIMIT ?""",
        (user_id, limit)
    ) as cursor:
        rows = await cursor.fetchall()
    
    return [
        {
            "id": str(row[0]),
            "amount": row[1],
            "type": row[2],
            "note": row[3],
            "date": row[4],
        }
        for row in rows
    ]


@router.post("/entries")
async def add_money_entry(
    entry: MoneyEntryCreate,
    user_id: int = Depends(get_current_user),
    db=Depends(get_db)
):
    """Добавить запись о потере/сбережении."""
    cursor = await db.execute(
        """INSERT INTO money_entries (user_id, amount, entry_type, note)
           VALUES (?, ?, ?, ?)""",
        (user_id, entry.amount, entry.type, entry.note)
    )
    await db.commit()
    
    entry_id = cursor.lastrowid
    
    async with db.execute(
        "SELECT created_at FROM money_entries WHERE id = ?",
        (entry_id,)
    ) as cur:
        row = await cur.fetchone()
    
    return {
        "id": str(entry_id),
        "amount": entry.amount,
        "type": entry.type,
        "note": entry.note,
        "date": row[0] if row else None,
    }


@router.get("/stats")
async def get_money_stats(
    user_id: int = Depends(get_current_user),
    db=Depends(get_db)
):
    """Получить статистику финансов."""
    # Настройки
    async with db.execute(
        "SELECT average_amount FROM money_settings WHERE user_id = ?",
        (user_id,)
    ) as cursor:
        row = await cursor.fetchone()
    
    average_amount = row[0] if row else 0
    
    # Текущая серия
    async with db.execute(
        "SELECT current_streak FROM streaks WHERE user_id = ?",
        (user_id,)
    ) as cursor:
        row = await cursor.fetchone()
    
    current_streak = row[0] if row else 0
    
    # Сэкономлено (приблизительно)
    saved_total = current_streak * average_amount if average_amount else 0
    
    # Потери
    async with db.execute(
        """SELECT COALESCE(SUM(amount), 0) FROM money_entries 
           WHERE user_id = ? AND entry_type = 'loss'""",
        (user_id,)
    ) as cursor:
        lost_total = (await cursor.fetchone())[0]
    
    # Количество срывов с потерями
    async with db.execute(
        "SELECT COUNT(*) FROM money_entries WHERE user_id = ? AND entry_type = 'loss'",
        (user_id,)
    ) as cursor:
        loss_count = (await cursor.fetchone())[0]
    
    return {
        "savedTotal": saved_total,
        "lostTotal": lost_total,
        "averageAmount": average_amount,
        "currentStreak": current_streak,
        "lossCount": loss_count,
    }
