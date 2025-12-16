"""
Планировщик напоминаний.
Запускает проверку каждую минуту и отправляет уведомления пользователям.
"""

import asyncio
from datetime import datetime, date
import httpx
import aiosqlite

from app.config import settings

WEBAPP_URL = "https://gambling-help-andrey220197.amvera.io"


async def send_reminder(telegram_id: int, streak: int):
    """Отправляет напоминание пользователю через Telegram Bot API."""
    if not settings.BOT_TOKEN:
        print("[WARN] BOT_TOKEN not set, skipping reminder")
        return False

    messages = [
        f"👋 Привет! Не забудь сделать чек-ин сегодня.\n\n🔥 Твоя серия: {streak} дней",
        f"⏰ Время для ежедневного чек-ина!\n\n💪 Поддерживай серию — уже {streak} дней!",
        f"🎯 Напоминание: отметь своё состояние сегодня.\n\n📈 Серия: {streak} дней",
    ]

    # Выбираем сообщение на основе дня
    message = messages[datetime.now().day % len(messages)]

    keyboard = {
        "inline_keyboard": [[
            {"text": "✅ Сделать чек-ин", "web_app": {"url": WEBAPP_URL}}
        ]]
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.telegram.org/bot{settings.BOT_TOKEN}/sendMessage",
                json={
                    "chat_id": telegram_id,
                    "text": message,
                    "reply_markup": keyboard
                },
                timeout=10
            )
            if response.status_code == 200:
                print(f"[OK] Reminder sent to {telegram_id}")
                return True
            else:
                print(f"[WARN] Failed to send reminder to {telegram_id}: {response.text}")
                return False
    except Exception as e:
        print(f"[ERROR] Failed to send reminder: {e}")
        return False


async def check_and_send_reminders(db_path: str):
    """Проверяет кому нужно отправить напоминание и отправляет."""
    now = datetime.now()
    current_hour = now.hour
    today = date.today().isoformat()

    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row

        # Находим пользователей у которых:
        # 1. reminder_enabled = TRUE
        # 2. reminder_hour = текущий час
        # 3. last_reminder_date != сегодня (ещё не отправляли)
        # 4. нет чек-ина сегодня
        cursor = await db.execute("""
            SELECT u.id, u.telegram_id, COALESCE(s.current_streak, 0) as streak
            FROM users u
            LEFT JOIN streaks s ON u.id = s.user_id
            LEFT JOIN checkins c ON u.id = c.user_id AND DATE(c.created_at) = DATE('now')
            WHERE u.reminder_enabled = 1
              AND u.reminder_hour = ?
              AND u.telegram_id IS NOT NULL
              AND (u.last_reminder_date IS NULL OR u.last_reminder_date != ?)
              AND c.id IS NULL
        """, (current_hour, today))

        users = await cursor.fetchall()

        if not users:
            return 0

        sent_count = 0
        for user in users:
            success = await send_reminder(user["telegram_id"], user["streak"])
            if success:
                # Обновляем last_reminder_date
                await db.execute(
                    "UPDATE users SET last_reminder_date = ? WHERE id = ?",
                    (today, user["id"])
                )
                sent_count += 1

        await db.commit()
        return sent_count


async def run_scheduler(db_path: str):
    """Запускает планировщик напоминаний."""
    print("[Scheduler] Starting reminder scheduler...")

    while True:
        try:
            # Проверяем только в начале каждого часа (первые 5 минут)
            now = datetime.now()
            if now.minute < 5:
                sent = await check_and_send_reminders(db_path)
                if sent > 0:
                    print(f"[Scheduler] Sent {sent} reminders")

            # Ждём 1 минуту
            await asyncio.sleep(60)

        except Exception as e:
            print(f"[Scheduler] Error: {e}")
            await asyncio.sleep(60)
