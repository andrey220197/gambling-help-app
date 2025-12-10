"""
API эндпоинты для системы тестов.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
import aiosqlite

from app.api.auth import get_current_user
from app.db.database import get_db
from app.services.test_engine import TestEngine

router = APIRouter()


class TestAnswer(BaseModel):
    question_code: str
    value: Any


class TestSubmission(BaseModel):
    test_code: str
    answers: List[TestAnswer]


class TrackSelection(BaseModel):
    track: str


@router.get("/next")
async def get_next_test(
    urge: Optional[int] = None,
    stress: Optional[int] = None,
    mood: Optional[int] = None,
    relapse: Optional[bool] = False,
    time_of_day: Optional[str] = "evening",
    user_id: int = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    engine = TestEngine(db)
    
    context = {
        "urge": urge,
        "stress": stress,
        "mood": mood,
        "relapse": relapse,
        "time_of_day": time_of_day,
    }
    
    test = await engine.get_next_test(user_id, context)
    
    if not test:
        return {"test": None, "message": "Нет доступных тестов"}
    
    return {"test": test}


@router.post("/submit")
async def submit_test_result(
    submission: TestSubmission,
    user_id: int = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    engine = TestEngine(db)
    answers = {a.question_code: a.value for a in submission.answers}
    
    # Считаем score
    score = 0
    for answer in submission.answers:
        if isinstance(answer.value, int):
            score += answer.value
        elif isinstance(answer.value, bool):
            score += 3 if answer.value else 0
        elif isinstance(answer.value, list):
            score += len(answer.value)
    
    # Для тестов онбординга (A) используем специальный метод
    if submission.test_code.startswith("A"):
        result = await engine.complete_onboarding_test(
            user_id,
            submission.test_code,
            answers,
            score
        )
    else:
        result = await engine.process_test_result(
            user_id,
            submission.test_code,
            answers,
            score
        )
    
    return result


@router.post("/onboarding/track")
async def select_track(
    selection: TrackSelection,
    user_id: int = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    valid_tracks = ["gambling", "trading", "digital"]

    if selection.track not in valid_tracks:
        raise HTTPException(status_code=400, detail="Invalid track")

    # Для trading/digital сразу завершаем онбординг (без дополнительного теста)
    if selection.track in ["trading", "digital"]:
        await db.execute(
            """UPDATE user_profiles
               SET track = ?, onboarding_completed = 1, risk_level = 'medium',
                   updated_at = CURRENT_TIMESTAMP
               WHERE user_id = ?""",
            (selection.track, user_id)
        )
    else:
        # Для gambling - продолжаем онбординг (будет тест A2)
        await db.execute(
            """UPDATE user_profiles
               SET track = ?, updated_at = CURRENT_TIMESTAMP
               WHERE user_id = ?""",
            (selection.track, user_id)
        )
    await db.commit()

    return {
        "success": True,
        "track": selection.track,
        "onboarding_completed": selection.track in ["trading", "digital"],
    }


@router.get("/profile")
async def get_test_profile(
    user_id: int = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    async with db.execute(
        "SELECT * FROM user_profiles WHERE user_id = ?",
        (user_id,)
    ) as cursor:
        row = await cursor.fetchone()
        
        if not row:
            return {
                "onboarding_completed": False,
                "onboarding_day": 0,
                "track": None,
                "risk_level": None,
            }
        
        columns = [d[0] for d in cursor.description]
        profile = dict(zip(columns, row))
        
        return {
            "onboarding_completed": profile.get("onboarding_completed", False),
            "onboarding_day": profile.get("onboarding_day", 0),
            "track": profile.get("track"),
            "risk_level": profile.get("risk_level"),
        }


@router.get("/history")
async def get_test_history(
    limit: int = 30,
    user_id: int = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    async with db.execute(
        """SELECT tr.*, t.code, t.name_ru 
           FROM test_results tr
           JOIN tests t ON tr.test_id = t.id
           WHERE tr.user_id = ?
           ORDER BY tr.created_at DESC
           LIMIT ?""",
        (user_id, limit)
    ) as cursor:
        rows = await cursor.fetchall()
        columns = [d[0] for d in cursor.description]
        return [dict(zip(columns, row)) for row in rows]
