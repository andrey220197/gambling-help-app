"""
API для дневника мыслей (КПТ).
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import json

from app.db.database import get_db
from app.api.auth import get_current_user

router = APIRouter()


class ThoughtEntryCreate(BaseModel):
    situation: str
    thought: str
    emotions: List[str]
    emotionIntensity: int
    reaction: Optional[str] = None  # Реакции (Р в схеме СМЭР)


class ThoughtEntryResponse(BaseModel):
    id: str
    createdAt: str
    situation: str
    thought: str
    emotions: List[str]
    emotionIntensity: int
    reaction: Optional[str]


@router.get("")
async def get_thought_entries(
    limit: int = 50,
    user_id: int = Depends(get_current_user),
    db=Depends(get_db)
):
    """Получить записи дневника (схема СМЭР)."""
    async with db.execute(
        """SELECT id, situation, thought, emotions_json, emotion_intensity,
                  reaction, created_at
           FROM thought_entries
           WHERE user_id = ?
           ORDER BY created_at DESC
           LIMIT ?""",
        (user_id, limit)
    ) as cursor:
        rows = await cursor.fetchall()

    entries = []
    for row in rows:
        emotions = []
        if row[3]:
            try:
                emotions = json.loads(row[3])
            except:
                pass

        entries.append({
            "id": str(row[0]),
            "situation": row[1],
            "thought": row[2],
            "emotions": emotions,
            "emotionIntensity": row[4] or 5,
            "reaction": row[5],
            "createdAt": row[6],
        })

    return entries


@router.post("")
async def create_thought_entry(
    entry: ThoughtEntryCreate,
    user_id: int = Depends(get_current_user),
    db=Depends(get_db)
):
    """Создать запись в дневнике (схема СМЭР)."""
    emotions_json = json.dumps(entry.emotions)

    cursor = await db.execute(
        """INSERT INTO thought_entries
           (user_id, situation, thought, emotions_json, emotion_intensity, reaction)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (user_id, entry.situation, entry.thought, emotions_json,
         entry.emotionIntensity, entry.reaction)
    )
    await db.commit()

    entry_id = cursor.lastrowid

    # Получаем созданную запись
    async with db.execute(
        "SELECT created_at FROM thought_entries WHERE id = ?",
        (entry_id,)
    ) as cur:
        row = await cur.fetchone()

    return {
        "id": str(entry_id),
        "situation": entry.situation,
        "thought": entry.thought,
        "emotions": entry.emotions,
        "emotionIntensity": entry.emotionIntensity,
        "reaction": entry.reaction,
        "createdAt": row[0] if row else None,
    }


@router.delete("/{entry_id}")
async def delete_thought_entry(
    entry_id: int,
    user_id: int = Depends(get_current_user),
    db=Depends(get_db)
):
    """Удалить запись из дневника."""
    result = await db.execute(
        "DELETE FROM thought_entries WHERE id = ? AND user_id = ?",
        (entry_id, user_id)
    )
    await db.commit()
    
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    return {"success": True}


@router.get("/stats")
async def get_diary_stats(
    user_id: int = Depends(get_current_user),
    db=Depends(get_db)
):
    """Получить статистику дневника (схема СМЭР)."""
    # Общее количество записей
    async with db.execute(
        "SELECT COUNT(*) FROM thought_entries WHERE user_id = ?",
        (user_id,)
    ) as cursor:
        total = (await cursor.fetchone())[0]

    # Частые эмоции
    async with db.execute(
        "SELECT emotions_json FROM thought_entries WHERE user_id = ?",
        (user_id,)
    ) as cursor:
        rows = await cursor.fetchall()

    emotion_counts = {}
    for row in rows:
        if row[0]:
            try:
                emotions = json.loads(row[0])
                for e in emotions:
                    emotion_counts[e] = emotion_counts.get(e, 0) + 1
            except:
                pass

    # Сортируем по частоте
    top_emotions = sorted(emotion_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "totalEntries": total,
        "topEmotions": [{"id": e[0], "count": e[1]} for e in top_emotions],
    }
