"""
Расширенная схема базы данных для системы тестов.
Запуск: python -m app.db.schema_v2
"""

SCHEMA_V2 = """
-- =============================================
-- ПОЛЬЗОВАТЕЛИ (расширение)
-- =============================================

-- Добавляем поля в users (если SQLite, пересоздаём)
-- track: gambling, trading, digital, mixed
-- onboarding_day: 1, 2, 3 (этап онбординга)
-- risk_level: low, medium, high
-- last_weekly_test: дата последнего еженедельного теста

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INTEGER PRIMARY KEY,
    track TEXT DEFAULT 'gambling',  -- gambling, trading, digital, mixed
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_day INTEGER DEFAULT 0,  -- 0=не начат, 1, 2, 3
    
    -- Результаты скрининга (Уровень A)
    risk_behavior_score INTEGER,       -- A1: 0-21
    gambling_score INTEGER,            -- A2: 0-15 (PGSI короткий)
    trading_score INTEGER,             -- A3: 0-15
    digital_score INTEGER,             -- A4: 0-18
    emotional_regulation_score INTEGER, -- A5: 0-18
    
    -- Вычисленный профиль риска
    risk_level TEXT DEFAULT 'unknown',  -- low, medium, high
    impulse_level TEXT DEFAULT 'unknown',
    emotional_vulnerability TEXT DEFAULT 'unknown',
    
    -- Метаданные
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- ТЕСТЫ (справочник)
-- =============================================

CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,          -- уникальный код: A1, B1_1, B2_3 и т.д.
    level TEXT NOT NULL,                -- A, B, C, D, E
    cluster TEXT,                       -- B1, B2, B3... (для уровня B)
    name_ru TEXT NOT NULL,              -- "Уровень тяги"
    description_ru TEXT,                -- Описание для пользователя
    
    -- Настройки показа
    track TEXT DEFAULT 'all',           -- gambling, trading, digital, all
    frequency TEXT DEFAULT 'daily',     -- daily, weekly, event, onboarding
    min_risk_level TEXT,                -- показывать только при risk >= X
    
    -- Условия показа
    show_after_relapse BOOLEAN DEFAULT FALSE,
    show_on_high_urge BOOLEAN DEFAULT FALSE,  -- urge >= 7
    cooldown_days INTEGER DEFAULT 1,    -- не показывать чаще чем раз в N дней
    
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0
);

-- =============================================
-- ВОПРОСЫ ТЕСТОВ
-- =============================================

CREATE TABLE IF NOT EXISTS test_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    code TEXT NOT NULL,                 -- B1_1_Q1, B1_1_Q2...
    question_ru TEXT NOT NULL,          -- Текст вопроса
    
    -- Тип ответа
    answer_type TEXT NOT NULL,          -- scale_0_10, scale_0_3, yes_no, choice
    
    -- Для choice: варианты ответов (JSON)
    choices_json TEXT,                  -- ["Стресс", "Скука", "Тревога"...]
    allow_multiple BOOLEAN DEFAULT FALSE,
    
    -- Вес для подсчёта
    weight INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    
    FOREIGN KEY (test_id) REFERENCES tests(id)
);

-- =============================================
-- РЕЗУЛЬТАТЫ ТЕСТОВ
-- =============================================

CREATE TABLE IF NOT EXISTS test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    test_id INTEGER NOT NULL,
    
    -- Результат
    total_score INTEGER,                -- Общий балл
    answers_json TEXT,                  -- {"Q1": 5, "Q2": "yes", "Q3": ["Стресс", "Скука"]}
    
    -- Интерпретация (заполняется ботом)
    interpretation TEXT,                -- low_risk, medium_risk, high_risk
    bot_message TEXT,                   -- Сообщение пользователю
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (test_id) REFERENCES tests(id)
);

-- =============================================
-- ЕЖЕДНЕВНЫЕ ЧЕКИНЫ (расширение)
-- =============================================

-- Добавляем детали к существующей таблице checkins
CREATE TABLE IF NOT EXISTS checkin_details (
    checkin_id INTEGER PRIMARY KEY,
    
    -- B1: Детали тяги
    urge_triggers_json TEXT,            -- ["Стресс", "Скука"]
    compulsion_strength INTEGER,        -- 0-3
    intrusive_thinking INTEGER,         -- 0-3
    automaticity BOOLEAN,
    delay_ability INTEGER,              -- 0-3
    
    -- B3: Триггеры (если показывался тест)
    emotional_triggers_json TEXT,
    situational_triggers_json TEXT,
    social_triggers_json TEXT,
    
    -- B4: Эмоции
    emotional_clarity INTEGER,          -- 0-3
    emotional_fog BOOLEAN,
    coping_ability INTEGER,             -- 0-3
    
    FOREIGN KEY (checkin_id) REFERENCES checkins(id)
);

-- =============================================
-- ИСТОРИЯ ПОКАЗА ТЕСТОВ (для ротации)
-- =============================================

CREATE TABLE IF NOT EXISTS test_show_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    test_id INTEGER NOT NULL,
    shown_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (test_id) REFERENCES tests(id)
);

-- =============================================
-- ИНДЕКСЫ
-- =============================================

CREATE INDEX IF NOT EXISTS idx_test_results_user ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_date ON test_results(created_at);
CREATE INDEX IF NOT EXISTS idx_test_show_history_user ON test_show_history(user_id, shown_at);
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, created_at);
"""

# Интерпретации результатов
INTERPRETATIONS = {
    "A1": {  # Универсальный скрининг (0-21)
        "ranges": [
            (0, 4, "low", "Низкий уровень рискованного поведения"),
            (5, 9, "medium", "Умеренный уровень — возможна потеря контроля в отдельных сферах"),
            (10, 14, "elevated", "Выраженная импульсивность — стоит внимательно наблюдать"),
            (15, 21, "high", "Высокий риск — поведение влияет на качество жизни"),
        ]
    },
    "A2": {  # PGSI короткий (0-15)
        "ranges": [
            (0, 0, "none", "Риска нет"),
            (1, 2, "low", "Низкий риск"),
            (3, 7, "medium", "Умеренный риск — рекомендован мониторинг"),
            (8, 15, "high", "Высокий риск — рекомендуется помощь"),
        ]
    },
    "A5": {  # Эмоциональная регуляция (0-18)
        "ranges": [
            (0, 4, "high_resilience", "Высокая устойчивость"),
            (5, 8, "moderate", "Умеренные трудности регуляции"),
            (9, 18, "vulnerable", "Выраженная эмоциональная уязвимость"),
        ]
    },
    "weekly_risk": {  # Еженедельный риск (0-15)
        "ranges": [
            (0, 3, "green", "Зелёная зона — стабильное состояние"),
            (4, 6, "yellow", "Жёлтая зона — есть признаки напряжения"),
            (7, 15, "red", "Красная зона — повышенный риск"),
        ]
    },
}


async def apply_schema_v2(db):
    """Применяет расширенную схему."""
    await db.executescript(SCHEMA_V2)
    await db.commit()
    print("✅ Schema V2 applied")


if __name__ == "__main__":
    import asyncio
    import aiosqlite
    
    async def main():
        async with aiosqlite.connect("./app.db") as db:
            await apply_schema_v2(db)
    
    asyncio.run(main())
