"""
Скрипт миграции базы данных на v3.
Запускать из папки backend:
    python -m app.db.migrate_v3
"""

import asyncio
import aiosqlite
import os

async def migrate():
    db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'app.db')
    db_path = os.path.abspath(db_path)
    
    print(f"Migrating database: {db_path}")
    
    if not os.path.exists(db_path):
        print("❌ Database not found!")
        return
    
    async with aiosqlite.connect(db_path) as db:
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
            print("✅ Added loss_amount column to checkins")
        except:
            print("ℹ️ loss_amount column already exists")
        
        await db.commit()
        print("✅ Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
