from fastapi import APIRouter, Depends
from pydantic import BaseModel
import aiosqlite

from app.db.database import get_db
from app.api.auth import get_current_user

router = APIRouter()


class StreakResponse(BaseModel):
    current_streak: int
    best_streak: int
    last_checkin_date: str | None


@router.get("", response_model=StreakResponse)
async def get_streak(
    user_id: int = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Получает текущий streak пользователя."""
    cursor = await db.execute(
        "SELECT current_streak, best_streak, last_checkin_date FROM streaks WHERE user_id = ?",
        (user_id,)
    )
    row = await cursor.fetchone()
    
    if not row:
        return StreakResponse(
            current_streak=0,
            best_streak=0,
            last_checkin_date=None,
        )
    
    return StreakResponse(
        current_streak=row["current_streak"],
        best_streak=row["best_streak"],
        last_checkin_date=row["last_checkin_date"],
    )
