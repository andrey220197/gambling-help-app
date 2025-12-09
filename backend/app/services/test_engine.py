"""
Движок выбора тестов.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import random
import json

from app.db.tests_level_a import LEVEL_A_TESTS
from app.db.tests_level_b import LEVEL_B_TESTS, DAILY_TEST_ROTATION
from app.db.tests_level_cd import LEVEL_C_TESTS, LEVEL_D_TESTS, CRISIS_KEYWORDS


class TestEngine:
    """Движок выбора и обработки тестов."""
    
    def __init__(self, db):
        self.db = db
    
    async def get_next_test(
        self,
        user_id: int,
        context: Dict[str, Any] = None
    ) -> Optional[Dict]:
        """Определяет следующий тест для пользователя."""
        context = context or {}
        
        profile = await self._get_user_profile(user_id)
        
        # 1. Проверяем онбординг
        if not profile.get("onboarding_completed"):
            return await self._get_onboarding_test(user_id, profile)
        
        # 2. Проверяем событийные тесты (D) — высший приоритет
        event_test = await self._check_event_tests(user_id, context, profile)
        if event_test:
            return event_test
        
        # 3. Проверяем еженедельный тест (C) — по воскресеньям
        weekly_test = await self._check_weekly_test(user_id, context, profile)
        if weekly_test:
            return weekly_test
        
        # 4. Выбираем ежедневный тест (B)
        return await self._get_daily_test(user_id, context, profile)
    
    # =========================================
    # ОНБОРДИНГ (A)
    # =========================================
    
    async def _get_onboarding_test(
        self,
        user_id: int,
        profile: Dict
    ) -> Optional[Dict]:
        """Возвращает тест онбординга в зависимости от дня."""
        
        day = profile.get("onboarding_day", 0)
        track = profile.get("track", "gambling")
        
        print(f"=== ONBOARDING: day={day}, track={track} ===")
        
        if day == 0 or day == 1:
            return self._format_test(LEVEL_A_TESTS["A1"])
        
        elif day == 2:
            track_tests = {
                "gambling": "A2",
                "trading": "A3",
                "digital": "A4",
            }
            test_code = track_tests.get(track, "A2")
            return self._format_test(LEVEL_A_TESTS[test_code])
        
        elif day == 3:
            return self._format_test(LEVEL_A_TESTS["A5"])
        
        return None
    
    async def complete_onboarding_test(
        self,
        user_id: int,
        test_code: str,
        answers: Dict,
        score: int
    ) -> Dict:
        """Обрабатывает завершение теста онбординга."""
        
        test = LEVEL_A_TESTS.get(test_code)
        if not test:
            return {"error": "Test not found"}
        
        interpretation = self._interpret_score(test, score)
        profile_updates = {}
        
        if test_code == "A1":
            profile_updates["risk_behavior_score"] = score
            profile_updates["onboarding_day"] = 2
            await self._update_user_profile(user_id, profile_updates)
            await self._save_test_result(user_id, test_code, answers, score, interpretation)
            return {
                "interpretation": interpretation,
                "show_track_selection": True,
                "track_options": test.get("track_options", []),
            }
        
        elif test_code in ["A2", "A3", "A4"]:
            field_map = {"A2": "gambling_score", "A3": "trading_score", "A4": "digital_score"}
            profile_updates[field_map[test_code]] = score
            profile_updates["onboarding_day"] = 3
        
        elif test_code == "A5":
            profile_updates["emotional_regulation_score"] = score
            profile_updates["onboarding_completed"] = True
            profile_updates["onboarding_day"] = 4
            risk_level = await self._calculate_risk_level(user_id, score)
            profile_updates["risk_level"] = risk_level
        
        await self._update_user_profile(user_id, profile_updates)
        await self._save_test_result(user_id, test_code, answers, score, interpretation)
        
        return {
            "interpretation": interpretation,
            "profile_updates": profile_updates,
            "onboarding_completed": profile_updates.get("onboarding_completed", False),
        }
    
    # =========================================
    # СОБЫТИЙНЫЕ ТЕСТЫ (D)
    # =========================================
    
    async def _check_event_tests(
        self,
        user_id: int,
        context: Dict,
        profile: Dict
    ) -> Optional[Dict]:
        """Проверяет нужен ли событийный тест."""
        
        # D1: Срыв
        if context.get("relapse"):
            if not await self._was_shown_recently(user_id, "D1", hours=24):
                return self._format_test(LEVEL_D_TESTS.get("D1"))
        
        # D2: Высокая тяга (≥7)
        urge = context.get("urge", 0)
        if urge and urge >= 7:
            if not await self._was_shown_recently(user_id, "D2", hours=12):
                return self._format_test(LEVEL_D_TESTS.get("D2"))
        
        # D3: Кризисные слова в заметке
        note = context.get("note", "") or ""
        if note and any(keyword in note.lower() for keyword in CRISIS_KEYWORDS):
            if not await self._was_shown_recently(user_id, "D3", hours=24):
                return self._format_test(LEVEL_D_TESTS.get("D3"))
        
        # D4: Возврат после долгого отсутствия (3+ дней)
        last_checkin = await self._get_last_checkin_date(user_id)
        if last_checkin:
            days_since = (datetime.now() - last_checkin).days
            if days_since >= 3:
                if not await self._was_shown_recently(user_id, "D4", hours=168):  # 7 дней
                    return self._format_test(LEVEL_D_TESTS.get("D4"))
        
        return None
    
    # =========================================
    # ЕЖЕНЕДЕЛЬНЫЕ ТЕСТЫ (C)
    # =========================================
    
    async def _check_weekly_test(
        self,
        user_id: int,
        context: Dict,
        profile: Dict
    ) -> Optional[Dict]:
        """Проверяет нужен ли еженедельный тест (по воскресеньям)."""
        
        today = datetime.now()
        
        # Проверяем воскресенье (weekday() == 6)
        if today.weekday() != 6:
            return None
        
        # Проверяем не проходил ли уже на этой неделе
        week_start = today - timedelta(days=today.weekday())
        
        async with self.db.execute(
            """SELECT COUNT(*) FROM test_results tr
               JOIN tests t ON tr.test_id = t.id
               WHERE tr.user_id = ? AND t.level = 'C'
               AND tr.created_at >= ?""",
            (user_id, week_start.strftime("%Y-%m-%d"))
        ) as cursor:
            count = (await cursor.fetchone())[0]
            if count > 0:
                return None
        
        # Выбираем тест в зависимости от трека
        track = profile.get("track", "gambling")
        
        # Ротация еженедельных тестов
        weekly_tests = ["C1", "C2", "C3", "C4"]
        
        # Находим какой тест давно не проходил
        test_code = await self._get_least_recent_test(user_id, weekly_tests)
        
        return self._format_test(LEVEL_C_TESTS.get(test_code))
    
    # =========================================
    # ЕЖЕДНЕВНЫЕ ТЕСТЫ (B)
    # =========================================
    
    async def _get_daily_test(
        self,
        user_id: int,
        context: Dict,
        profile: Dict
    ) -> Optional[Dict]:
        """Выбирает ежедневный тест с ротацией."""
        
        urge = context.get("urge", 0) or 0
        stress = context.get("stress", 0) or 0
        
        # Обязательные тесты каждый день
        mandatory = ["B1_1"]  # Базовый уровень тяги
        
        # Условные тесты при высоких показателях
        conditional = []
        if urge >= 7:
            conditional.extend(["B1_2", "B7_1"])  # Детали тяги, триггеры
        if stress >= 7:
            conditional.extend(["B5_1", "B5_2"])  # Стресс-тесты
        
        # Пул для ротации (когда нет срочных)
        rotation_pool = ["B2_1", "B3_1", "B4_1", "B6_1"]
        
        # Выбираем тест
        # 1. Сначала обязательные (если не прошёл сегодня)
        for code in mandatory:
            if not await self._was_completed_today(user_id, code):
                test = LEVEL_B_TESTS.get(code)
                if test:
                    return self._format_test(test)
        
        # 2. Условные тесты
        for code in conditional:
            if not await self._was_completed_today(user_id, code):
                test = LEVEL_B_TESTS.get(code)
                if test:
                    return self._format_test(test)
        
        # 3. Ротация из пула (выбираем давно не проходимый)
        test_code = await self._get_least_recent_test(user_id, rotation_pool)
        if test_code and not await self._was_completed_today(user_id, test_code):
            test = LEVEL_B_TESTS.get(test_code)
            if test:
                return self._format_test(test)
        
        # Всё пройдено — возвращаем None
        return None
    
    # =========================================
    # ОБРАБОТКА РЕЗУЛЬТАТОВ
    # =========================================
    
    async def process_test_result(
        self,
        user_id: int,
        test_code: str,
        answers: Dict,
        score: int
    ) -> Dict:
        """Обрабатывает результат любого теста."""
        
        test = (
            LEVEL_A_TESTS.get(test_code) or
            LEVEL_B_TESTS.get(test_code) or
            LEVEL_C_TESTS.get(test_code) or
            LEVEL_D_TESTS.get(test_code)
        )
        
        if not test:
            return {"error": "Test not found", "bot_message": "Тест не найден"}
        
        interpretation = self._interpret_score(test, score)
        await self._save_test_result(user_id, test_code, answers, score, interpretation)
        
        bot_message = self._get_bot_response(test, score, interpretation)
        actions = self._get_recommended_actions(test, interpretation)
        
        return {
            "interpretation": interpretation,
            "bot_message": bot_message,
            "actions": actions,
        }
    
    # =========================================
    # ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    # =========================================
    
    def _format_test(self, test: Dict) -> Optional[Dict]:
        """Форматирует тест для отправки на фронтенд."""
        if not test:
            return None
        return {
            "code": test["code"],
            "level": test["level"],
            "name": test["name_ru"],
            "description": test.get("description_ru", ""),
            "intro_message": test.get("intro_message"),
            "questions": test["questions"],
            "outro_message": test.get("outro_message"),
        }
    
    def _interpret_score(self, test: Dict, score: int) -> Dict:
        """Интерпретирует результат теста."""
        interpretation = test.get("interpretation", {})
        ranges = interpretation.get("ranges", [])
        
        for r in ranges:
            if r["min"] <= score <= r["max"]:
                return {
                    "level": r["level"],
                    "message": r["message"],
                    "score": score,
                    "max_score": interpretation.get("max_score", 0),
                }
        
        return {
            "level": "unknown",
            "message": "Результат обработан",
            "score": score,
        }
    
    def _get_bot_response(self, test: Dict, score: int, interpretation: Dict) -> str:
        """Получает ответ бота на результат теста."""
        bot_responses = test.get("bot_responses", {})
        level = interpretation.get("level", "")
        
        if level in bot_responses:
            return bot_responses[level]
        
        return interpretation.get("message", "Спасибо за ответ.")
    
    def _get_recommended_actions(self, test: Dict, interpretation: Dict) -> list:
        """Определяет рекомендуемые действия."""
        actions = []
        level = interpretation.get("level", "")
        
        if level in ["high", "red", "problem_gambling", "vulnerable", "critical"]:
            actions.append("offer_sos")
            actions.append("show_helplines")
        
        if level in ["yellow", "medium", "elevated", "moderate_risk"]:
            actions.append("soft_intervention")
        
        return list(set(actions))
    
    async def _get_user_profile(self, user_id: int) -> Dict:
        """Получает профиль пользователя."""
        async with self.db.execute(
            "SELECT * FROM user_profiles WHERE user_id = ?",
            (user_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                columns = [d[0] for d in cursor.description]
                return dict(zip(columns, row))
        
        await self.db.execute(
            "INSERT OR IGNORE INTO user_profiles (user_id, onboarding_day) VALUES (?, 1)",
            (user_id,)
        )
        await self.db.commit()
        return {"user_id": user_id, "onboarding_day": 1, "onboarding_completed": False}
    
    async def _update_user_profile(self, user_id: int, updates: Dict):
        """Обновляет профиль пользователя."""
        if not updates:
            return
        
        set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
        values = list(updates.values()) + [user_id]
        
        await self.db.execute(
            f"UPDATE user_profiles SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
            values
        )
        await self.db.commit()
    
    async def _save_test_result(
        self,
        user_id: int,
        test_code: str,
        answers: Dict,
        score: int,
        interpretation: Dict
    ):
        """Сохраняет результат теста."""
        await self.db.execute(
            """INSERT INTO test_results (user_id, test_id, total_score, answers_json, interpretation, bot_message)
               SELECT ?, id, ?, ?, ?, ? FROM tests WHERE code = ?""",
            (user_id, score, json.dumps(answers), interpretation.get("level"), interpretation.get("message"), test_code)
        )
        await self.db.commit()
    
    async def _calculate_risk_level(self, user_id: int, emotional_score: int) -> str:
        """Вычисляет общий уровень риска."""
        profile = await self._get_user_profile(user_id)
        
        risk_score = profile.get("risk_behavior_score", 0) or 0
        gambling_score = profile.get("gambling_score", 0) or 0
        
        total = risk_score + gambling_score + emotional_score
        
        if total <= 15:
            return "low"
        elif total <= 30:
            return "medium"
        else:
            return "high"
    
    async def _was_shown_recently(self, user_id: int, test_code: str, hours: int = 24) -> bool:
        """Проверяет показывался ли тест недавно."""
        async with self.db.execute(
            """SELECT COUNT(*) FROM test_results tr
               JOIN tests t ON tr.test_id = t.id
               WHERE tr.user_id = ? AND t.code = ?
               AND tr.created_at >= datetime('now', ?)""",
            (user_id, test_code, f'-{hours} hours')
        ) as cursor:
            count = (await cursor.fetchone())[0]
            return count > 0
    
    async def _was_completed_today(self, user_id: int, test_code: str) -> bool:
        """Проверяет пройден ли тест сегодня."""
        async with self.db.execute(
            """SELECT COUNT(*) FROM test_results tr
               JOIN tests t ON tr.test_id = t.id
               WHERE tr.user_id = ? AND t.code = ?
               AND date(tr.created_at) = date('now')""",
            (user_id, test_code)
        ) as cursor:
            count = (await cursor.fetchone())[0]
            return count > 0
    
    async def _get_last_checkin_date(self, user_id: int) -> Optional[datetime]:
        """Получает дату последнего чек-ина."""
        async with self.db.execute(
            "SELECT created_at FROM checkins WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
            (user_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                return datetime.fromisoformat(row[0].replace('Z', '+00:00').split('+')[0])
        return None
    
    async def _get_least_recent_test(self, user_id: int, test_codes: List[str]) -> Optional[str]:
        """Возвращает код теста, который давно не проходился."""
        if not test_codes:
            return None
        
        # Получаем даты последнего прохождения для каждого теста
        placeholders = ','.join(['?' for _ in test_codes])
        async with self.db.execute(
            f"""SELECT t.code, MAX(tr.created_at) as last_taken
                FROM tests t
                LEFT JOIN test_results tr ON t.id = tr.test_id AND tr.user_id = ?
                WHERE t.code IN ({placeholders})
                GROUP BY t.code""",
            [user_id] + test_codes
        ) as cursor:
            rows = await cursor.fetchall()
        
        # Находим тест с самой старой датой (или без даты)
        test_dates = {code: None for code in test_codes}
        for row in rows:
            test_dates[row[0]] = row[1]
        
        # Сначала тесты без даты (никогда не проходились)
        for code in test_codes:
            if test_dates.get(code) is None:
                return code
        
        # Иначе самый старый
        sorted_tests = sorted(test_dates.items(), key=lambda x: x[1] or "")
        return sorted_tests[0][0] if sorted_tests else test_codes[0]
