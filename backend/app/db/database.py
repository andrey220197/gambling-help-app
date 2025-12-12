import aiosqlite
from app.config import settings
from app.db.schema_v3 import SCHEMA_V3

DATABASE_PATH = settings.DATABASE_URL.replace("sqlite:///", "")


async def get_db():
    """Получить соединение с БД."""
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()


async def init_db():
    """Инициализация таблиц БД с полной схемой v3."""
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.executescript(SCHEMA_V3)
        await db.commit()
        print(f"[OK] Database initialized at {DATABASE_PATH}")

        # Seed articles if empty
        cursor = await db.execute("SELECT COUNT(*) FROM articles")
        count = (await cursor.fetchone())[0]
        if count == 0:
            try:
                from app.db.seed_articles import seed_articles
                await seed_articles(db)
                print("[OK] Articles seeded")
            except Exception as e:
                print(f"[WARN] Could not seed articles: {e}")
