"""
Схема базы данных v3 — с поддержкой дневника мыслей и финансов.
"""

SCHEMA_V3 = """
-- =============================================
-- ПОЛЬЗОВАТЕЛИ
-- =============================================

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anon_hash TEXT UNIQUE NOT NULL,
    recovery_code TEXT UNIQUE NOT NULL,
    telegram_id INTEGER,                    -- для отправки уведомлений
    reminder_enabled BOOLEAN DEFAULT TRUE,
    reminder_hour INTEGER DEFAULT 20,       -- час напоминания (0-23)
    last_reminder_date DATE,                -- дата последнего напоминания
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ
-- =============================================

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INTEGER PRIMARY KEY,
    track TEXT DEFAULT 'gambling',  -- gambling, trading, digital
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_day INTEGER DEFAULT 0,
    
    -- Результаты скрининга
    risk_behavior_score INTEGER,       -- A1: импульсивность
    gambling_score INTEGER,            -- A2: PGSI
    trading_score INTEGER,             -- A3
    digital_score INTEGER,             -- A4
    emotional_regulation_score INTEGER, -- A5
    
    -- Вычисленный профиль
    risk_level TEXT DEFAULT 'unknown',  -- low, medium, high
    impulse_level TEXT DEFAULT 'unknown',
    emotional_vulnerability TEXT DEFAULT 'unknown',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- НАСТРОЙКИ ФИНАНСОВ
-- =============================================

CREATE TABLE IF NOT EXISTS money_settings (
    user_id INTEGER PRIMARY KEY,
    enabled BOOLEAN DEFAULT FALSE,
    average_amount INTEGER DEFAULT 0,      -- средняя сумма за эпизод
    show_saved BOOLEAN DEFAULT TRUE,       -- показывать "сэкономлено"
    track_losses BOOLEAN DEFAULT FALSE,    -- учитывать потери при срывах
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- ИСТОРИЯ ФИНАНСОВ (потери при срывах)
-- =============================================

CREATE TABLE IF NOT EXISTS money_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,           -- сумма (положительное число = потеря)
    entry_type TEXT DEFAULT 'loss',    -- loss, saved
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- ДНЕВНИК МЫСЛЕЙ (КПТ)
-- =============================================

CREATE TABLE IF NOT EXISTS thought_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    situation TEXT NOT NULL,           -- С: ситуация
    thought TEXT NOT NULL,             -- М: мысль
    emotions_json TEXT,                -- Э: эмоции ["excitement", "anxiety"]
    emotion_intensity INTEGER,         -- интенсивность 1-10
    reaction TEXT,                     -- Р: реакции (что сделал)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- ЧЕК-ИНЫ
-- =============================================

CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    urge INTEGER NOT NULL CHECK (urge >= 0 AND urge <= 10),
    stress INTEGER NOT NULL CHECK (stress >= 0 AND stress <= 10),
    mood INTEGER NOT NULL CHECK (mood >= 0 AND mood <= 10),
    relapse BOOLEAN DEFAULT FALSE,
    note TEXT,
    loss_amount INTEGER,               -- сумма потерь при срыве
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- СЕРИИ (STREAKS)
-- =============================================

CREATE TABLE IF NOT EXISTS streaks (
    user_id INTEGER PRIMARY KEY,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    last_checkin_date DATE,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- ТЕСТЫ (справочник)
-- =============================================

CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    level TEXT NOT NULL,                -- A, B, C, D
    cluster TEXT,
    name_ru TEXT NOT NULL,
    description_ru TEXT,
    track TEXT DEFAULT 'all',
    frequency TEXT DEFAULT 'daily',
    min_risk_level TEXT,                -- low, medium, high
    show_after_relapse BOOLEAN DEFAULT FALSE,
    show_on_high_urge BOOLEAN DEFAULT FALSE,
    cooldown_days INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0
);

-- =============================================
-- ВОПРОСЫ ТЕСТОВ
-- =============================================

CREATE TABLE IF NOT EXISTS test_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    question_ru TEXT NOT NULL,
    answer_type TEXT NOT NULL,
    choices_json TEXT,
    allow_multiple BOOLEAN DEFAULT FALSE,
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
    total_score INTEGER,
    answers_json TEXT,
    interpretation TEXT,
    bot_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (test_id) REFERENCES tests(id)
);

-- =============================================
-- ИСТОРИЯ ПОКАЗА ТЕСТОВ
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
-- СТАТЬИ
-- =============================================

CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    read_time TEXT DEFAULT '3 мин',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SOS СОБЫТИЯ
-- =============================================

CREATE TABLE IF NOT EXISTS sos_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    trigger_type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- ИНДЕКСЫ
-- =============================================

CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_test_results_user ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_thought_entries_user ON thought_entries(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_money_entries_user ON money_entries(user_id, created_at);
"""


async def init_db_v3(db):
    """Инициализирует БД со схемой v3."""
    await db.executescript(SCHEMA_V3)
    await db.commit()
    print("✅ Database v3 initialized")


async def migrate_to_v3(db):
    """Миграция с v2 на v3 — добавляет новые таблицы."""
    
    # Проверяем существуют ли новые таблицы
    cursor = await db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='money_settings'"
    )
    if await cursor.fetchone():
        print("✅ Already on v3")
        return
    
    # Добавляем новые таблицы
    await db.execute("""
        CREATE TABLE IF NOT EXISTS money_settings (
            user_id INTEGER PRIMARY KEY,
            enabled BOOLEAN DEFAULT FALSE,
            average_amount INTEGER DEFAULT 0,
            show_saved BOOLEAN DEFAULT TRUE,
            track_losses BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    await db.execute("""
        CREATE TABLE IF NOT EXISTS money_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            entry_type TEXT DEFAULT 'loss',
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    await db.execute("""
        CREATE TABLE IF NOT EXISTS thought_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            situation TEXT NOT NULL,
            thought TEXT NOT NULL,
            emotions_json TEXT,
            emotion_intensity INTEGER,
            distortion TEXT,
            alternative_thought TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    # Добавляем колонку loss_amount в checkins если её нет
    try:
        await db.execute("ALTER TABLE checkins ADD COLUMN loss_amount INTEGER")
    except:
        pass  # Колонка уже существует
    
    # Добавляем колонку read_time в articles если её нет
    try:
        await db.execute("ALTER TABLE articles ADD COLUMN read_time TEXT DEFAULT '3 мин'")
    except:
        pass
    
    await db.commit()
    print("✅ Migrated to v3")


async def migrate_add_reminders(db):
    """Миграция: добавляет поля для уведомлений и другие недостающие колонки."""

    # Добавляем колонки в users если их нет
    columns_to_add = [
        ("telegram_id", "INTEGER"),
        ("reminder_enabled", "BOOLEAN DEFAULT TRUE"),
        ("reminder_hour", "INTEGER DEFAULT 20"),
        ("last_reminder_date", "DATE"),
    ]

    for col_name, col_type in columns_to_add:
        try:
            await db.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            print(f"[OK] Added column users.{col_name}")
        except:
            pass  # Колонка уже существует

    # Добавляем min_risk_level в tests если нет
    try:
        await db.execute("ALTER TABLE tests ADD COLUMN min_risk_level TEXT")
        print("[OK] Added column tests.min_risk_level")
    except:
        pass  # Колонка уже существует

    # Добавляем reaction в thought_entries (схема СМЭР)
    try:
        await db.execute("ALTER TABLE thought_entries ADD COLUMN reaction TEXT")
        print("[OK] Added column thought_entries.reaction")
    except:
        pass  # Колонка уже существует

    await db.commit()


if __name__ == "__main__":
    import asyncio
    import aiosqlite
    
    async def main():
        async with aiosqlite.connect("./app.db") as db:
            await migrate_to_v3(db)
    
    asyncio.run(main())
