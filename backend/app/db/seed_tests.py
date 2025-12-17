"""
Скрипт наполнения базы данных тестами.
Запуск: python -m app.db.seed_tests
"""

import asyncio
import aiosqlite
import json

from app.db.tests_level_a import LEVEL_A_TESTS
from app.db.tests_level_b import LEVEL_B_TESTS
from app.db.tests_level_cd import LEVEL_C_TESTS, LEVEL_D_TESTS


async def seed_tests_to_db(db: aiosqlite.Connection):
    """Наполняет БД тестами (принимает готовое соединение)."""

    # Проверяем есть ли уже тесты
    async with db.execute("SELECT COUNT(*) FROM tests") as cursor:
        count = (await cursor.fetchone())[0]
        if count > 0:
            print(f"[OK] Tests already seeded ({count} tests)")
            return

    test_id = 1

    # Уровень A
    for code, test in LEVEL_A_TESTS.items():
        await _insert_test(db, test_id, test)
        test_id += 1

    # Уровень B
    for code, test in LEVEL_B_TESTS.items():
        await _insert_test(db, test_id, test)
        test_id += 1

    # Уровень C
    for code, test in LEVEL_C_TESTS.items():
        await _insert_test(db, test_id, test)
        test_id += 1

    # Уровень D
    for code, test in LEVEL_D_TESTS.items():
        await _insert_test(db, test_id, test)
        test_id += 1

    await db.commit()

    # Статистика
    async with db.execute("SELECT COUNT(*) FROM tests") as cursor:
        count = (await cursor.fetchone())[0]
        print(f"[OK] {count} tests seeded")

    async with db.execute("SELECT COUNT(*) FROM test_questions") as cursor:
        count = (await cursor.fetchone())[0]
        print(f"[OK] {count} test questions seeded")


async def seed_tests():
    """Наполняет БД всеми тестами (standalone запуск)."""

    async with aiosqlite.connect("./app.db") as db:
        # Очищаем старые данные для пересоздания
        await db.execute("DELETE FROM test_questions")
        await db.execute("DELETE FROM tests")
        
        test_id = 1
        
        # Уровень A
        print("📝 Добавляем тесты уровня A (онбординг)...")
        for code, test in LEVEL_A_TESTS.items():
            await _insert_test(db, test_id, test)
            test_id += 1
        
        # Уровень B
        print("📝 Добавляем тесты уровня B (ежедневные)...")
        for code, test in LEVEL_B_TESTS.items():
            await _insert_test(db, test_id, test)
            test_id += 1
        
        # Уровень C
        print("📝 Добавляем тесты уровня C (еженедельные)...")
        for code, test in LEVEL_C_TESTS.items():
            await _insert_test(db, test_id, test)
            test_id += 1
        
        # Уровень D
        print("📝 Добавляем тесты уровня D (событийные)...")
        for code, test in LEVEL_D_TESTS.items():
            await _insert_test(db, test_id, test)
            test_id += 1
        
        await db.commit()
        
        # Статистика
        async with db.execute("SELECT COUNT(*) FROM tests") as cursor:
            count = (await cursor.fetchone())[0]
            print(f"✅ Добавлено {count} тестов")
        
        async with db.execute("SELECT COUNT(*) FROM test_questions") as cursor:
            count = (await cursor.fetchone())[0]
            print(f"✅ Добавлено {count} вопросов")


async def _insert_test(db: aiosqlite.Connection, test_id: int, test: dict):
    """Вставляет тест и его вопросы."""
    
    # Вставляем тест
    await db.execute(
        """INSERT INTO tests (id, code, level, cluster, name_ru, description_ru, 
           track, frequency, min_risk_level, show_after_relapse, show_on_high_urge,
           cooldown_days, is_active, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            test_id,
            test["code"],
            test["level"],
            test.get("cluster"),
            test["name_ru"],
            test.get("description_ru", ""),
            test.get("track", "all"),
            test.get("frequency", "daily"),
            test.get("min_risk_level"),
            test.get("show_after_relapse", False),
            test.get("show_on_high_urge", False),
            test.get("cooldown_days", 1),
            True,
            test_id,
        )
    )
    
    # Вставляем вопросы
    for i, q in enumerate(test.get("questions", [])):
        choices_json = None
        if q.get("choices"):
            choices_json = json.dumps(q["choices"], ensure_ascii=False)
        
        await db.execute(
            """INSERT INTO test_questions (test_id, code, question_ru, answer_type,
               choices_json, allow_multiple, weight, order_index)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                test_id,
                q["code"],
                q["question_ru"],
                q["answer_type"],
                choices_json,
                q.get("allow_multiple", False),
                q.get("weight", 1),
                i,
            )
        )


if __name__ == "__main__":
    asyncio.run(seed_tests())
