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
        print("[OK] Database v3 initialized")
