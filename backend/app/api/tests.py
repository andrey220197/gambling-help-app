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

    # Для всех треков - сохраняем и переходим к тесту A2/A3/A4
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
        "onboarding_completed": False,  # Ещё нужны тесты A2/A3/A4 и A5
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


@router.get("/analytics")
async def get_test_analytics(
    user_id: int = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Агрегированная аналитика по результатам тестов."""

    # Получаем профиль с онбординг-скорами
    async with db.execute(
        """SELECT risk_behavior_score, gambling_score, trading_score,
                  digital_score, emotional_regulation_score, risk_level, track
           FROM user_profiles WHERE user_id = ?""",
        (user_id,)
    ) as cursor:
        profile_row = await cursor.fetchone()

    profile = {}
    if profile_row:
        columns = [d[0] for d in cursor.description]
        profile = dict(zip(columns, profile_row))

    # Получаем результаты B-тестов за последние 14 дней
    async with db.execute(
        """SELECT t.code, tr.total_score, tr.created_at
           FROM test_results tr
           JOIN tests t ON tr.test_id = t.id
           WHERE tr.user_id = ? AND t.level = 'B'
             AND tr.created_at >= datetime('now', '-14 days')
           ORDER BY tr.created_at DESC""",
        (user_id,)
    ) as cursor:
        b_results = await cursor.fetchall()

    # Получаем последний C-тест (еженедельный риск)
    async with db.execute(
        """SELECT t.code, tr.total_score, tr.interpretation, tr.created_at
           FROM test_results tr
           JOIN tests t ON tr.test_id = t.id
           WHERE tr.user_id = ? AND t.level = 'C'
           ORDER BY tr.created_at DESC LIMIT 1""",
        (user_id,)
    ) as cursor:
        c_result = await cursor.fetchone()

    # Агрегируем по кластерам
    clusters = {
        "urge": [],       # B1_*
        "impulse": [],    # B2_*
        "triggers": [],   # B3_*
        "emotions": [],   # B4_*
        "stress": [],     # B5_*
        "sleep": [],      # B6_*
        "decisions": [],  # B7_*
    }

    for code, score, _ in b_results:
        if score is None:
            continue
        if code.startswith("B1"):
            clusters["urge"].append(score)
        elif code.startswith("B2"):
            clusters["impulse"].append(score)
        elif code.startswith("B3"):
            clusters["triggers"].append(score)
        elif code.startswith("B4"):
            clusters["emotions"].append(score)
        elif code.startswith("B5"):
            clusters["stress"].append(score)
        elif code.startswith("B6"):
            clusters["sleep"].append(score)
        elif code.startswith("B7"):
            clusters["decisions"].append(score)

    def avg(lst):
        return round(sum(lst) / len(lst), 1) if lst else None

    def to_10_scale(val, max_val):
        """Нормализует значение к шкале 0-10."""
        if val is None:
            return None
        return min(10, round((val / max_val) * 10, 1))

    # Расчёт метрик (0-10 scale)
    metrics = {
        "impulse": {
            "value": to_10_scale(profile.get("risk_behavior_score"), 15),
            "label": "Импульсивность",
            "description": "Склонность к импульсивным решениям",
            "recent": to_10_scale(avg(clusters["impulse"]), 6),  # B2 max ~6
        },
        "urge": {
            "value": to_10_scale(avg(clusters["urge"]), 10),
            "label": "Тяга",
            "description": "Средний уровень тяги за 2 недели",
            "count": len(clusters["urge"]),
        },
        "emotional": {
            "value": to_10_scale(profile.get("emotional_regulation_score"), 18),
            "label": "Эмоц. уязвимость",
            "description": "Трудности с регуляцией эмоций",
            "recent": to_10_scale(avg(clusters["emotions"]), 6),
        },
        "stress": {
            "value": to_10_scale(avg(clusters["stress"]), 10),
            "label": "Стресс-реактивность",
            "description": "Реакция на стресс",
            "count": len(clusters["stress"]),
        },
        "triggers": {
            "value": to_10_scale(avg(clusters["triggers"]), 6),
            "label": "Триггеры",
            "description": "Осознанность триггеров",
            "count": len(clusters["triggers"]),
        },
    }

    # Трек-специфичный скор
    track = profile.get("track", "gambling")
    track_score = None
    if track == "gambling":
        track_score = to_10_scale(profile.get("gambling_score"), 15)
    elif track == "trading":
        track_score = to_10_scale(profile.get("trading_score"), 15)
    elif track == "digital":
        track_score = to_10_scale(profile.get("digital_score"), 18)

    # Общий уровень риска
    risk_level = profile.get("risk_level", "unknown")

    # Последняя еженедельная оценка
    weekly_assessment = None
    if c_result:
        weekly_assessment = {
            "code": c_result[0],
            "score": c_result[1],
            "interpretation": c_result[2],
            "date": c_result[3],
        }

    return {
        "risk_level": risk_level,
        "track": track,
        "track_score": track_score,
        "metrics": metrics,
        "weekly_assessment": weekly_assessment,
        "tests_completed_14d": len(b_results),
    }
