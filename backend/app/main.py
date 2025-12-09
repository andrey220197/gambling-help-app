"""
FastAPI приложение — Точка опоры.
Версия 3.0
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.api import auth, checkins, streaks, articles, sos, tests, diary, money
from app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Инициализация при запуске."""
    await init_db()
    yield


app = FastAPI(
    title="Точка опоры API",
    description="API для Telegram Mini App помощи при игровой зависимости",
    version="3.0.0",
    lifespan=lifespan
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/health")
async def health():
    """Health check для мониторинга."""
    return {"status": "healthy", "version": "3.0.0"}


# API роутеры
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(checkins.router, prefix="/checkins", tags=["checkins"])
app.include_router(streaks.router, prefix="/streak", tags=["streak"])
app.include_router(articles.router, prefix="/articles", tags=["articles"])
app.include_router(sos.router, prefix="/sos", tags=["sos"])
app.include_router(tests.router, prefix="/tests", tags=["tests"])
app.include_router(diary.router, prefix="/diary", tags=["diary"])
app.include_router(money.router, prefix="/money", tags=["money"])


# Статика фронтенда (для production)
FRONTEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)

if os.path.exists(FRONTEND_DIR):
    # Статические файлы
    assets_dir = os.path.join(FRONTEND_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    
    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
    
    # SPA fallback — все неизвестные пути отдают index.html
    @app.get("/{path:path}")
    async def serve_spa(path: str):
        # Если это API путь — пропускаем
        if path.startswith(("auth", "checkins", "streak", "articles", "sos", "tests", "diary", "money", "health")):
            return {"detail": "Not Found"}
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
