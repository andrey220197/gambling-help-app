from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import aiosqlite

from app.db.database import get_db

router = APIRouter()


class ArticleResponse(BaseModel):
    id: int
    title: str
    content: str
    category: str


class ArticleShort(BaseModel):
    id: int
    title: str
    category: str


@router.get("", response_model=list[ArticleShort])
async def get_articles(
    category: Optional[str] = None,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Получает список всех статей (краткая информация)."""
    if category:
        cursor = await db.execute(
            "SELECT id, title, category FROM articles WHERE category = ? ORDER BY order_index",
            (category,)
        )
    else:
        cursor = await db.execute(
            "SELECT id, title, category FROM articles ORDER BY order_index"
        )
    
    rows = await cursor.fetchall()
    
    return [
        ArticleShort(
            id=row["id"],
            title=row["title"],
            category=row["category"],
        )
        for row in rows
    ]


@router.get("/random", response_model=ArticleResponse)
async def get_random_article(db: aiosqlite.Connection = Depends(get_db)):
    """Получает случайную статью (карточка дня)."""
    cursor = await db.execute(
        "SELECT * FROM articles ORDER BY RANDOM() LIMIT 1"
    )
    row = await cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="No articles found")
    
    return ArticleResponse(
        id=row["id"],
        title=row["title"],
        content=row["content"],
        category=row["category"],
    )


@router.get("/categories")
async def get_categories(db: aiosqlite.Connection = Depends(get_db)):
    """Получает список категорий."""
    cursor = await db.execute(
        "SELECT DISTINCT category FROM articles"
    )
    rows = await cursor.fetchall()
    
    return [row["category"] for row in rows]


@router.get("/{article_id}", response_model=ArticleResponse)
async def get_article(
    article_id: int,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Получает конкретную статью."""
    cursor = await db.execute(
        "SELECT * FROM articles WHERE id = ?",
        (article_id,)
    )
    row = await cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return ArticleResponse(
        id=row["id"],
        title=row["title"],
        content=row["content"],
        category=row["category"],
    )
