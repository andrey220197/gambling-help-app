import asyncio
import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup, MenuButtonWebApp
from telegram.ext import Application, CommandHandler, ContextTypes

from config import BOT_TOKEN, WEBAPP_URL

# Логирование
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /start — приветствие и кнопка открытия приложения."""
    
    keyboard = [
        [InlineKeyboardButton(
            "🚀 Открыть приложение",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )],
        [InlineKeyboardButton(
            "ℹ️ Помощь",
            callback_data="help"
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    welcome_text = """👋 Привет! Я — *Точка опоры*

Это безопасное пространство для тех, кто хочет контролировать финансовые импульсы и тягу к азартным играм.

*Что я умею:*
• 📝 Ежедневные чек-ины состояния
• 🔥 Отслеживание дней без игры
• 🆘 SOS-техники при сильной тяге
• 🧠 Научные объяснения механизмов

⚠️ _Это не медицинская помощь. При кризисе звони 112 или 8-800-2000-122_

Нажми кнопку ниже, чтобы начать 👇"""

    await update.message.reply_text(
        welcome_text,
        parse_mode='Markdown',
        reply_markup=reply_markup
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /help — информация и контакты."""
    
    help_text = """*Точка опоры — помощь и поддержка*

*Команды:*
/start — открыть приложение
/app — быстрая ссылка на приложение  
/help — эта справка
/sos — экстренная помощь

*Горячие линии:*
📞 112 — экстренная помощь
📞 8-800-2000-122 — психологическая помощь (бесплатно)

*О проекте:*
Приложение создано на основе научных исследований нейробиологии зависимости. Все техники основаны на доказательной психологии.

⚠️ _Это не замена профессиональной терапии_"""

    await update.message.reply_text(help_text, parse_mode='Markdown')


async def app_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /app — быстрое открытие приложения."""
    
    keyboard = [[
        InlineKeyboardButton(
            "🚀 Открыть приложение",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )
    ]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Нажми кнопку, чтобы открыть приложение 👇",
        reply_markup=reply_markup
    )


async def sos_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /sos — экстренная помощь."""
    
    sos_text = """🆘 *Экстренная помощь*

Ты справишься. Это временное состояние.

*Попробуй прямо сейчас:*

1️⃣ *Дыхание 4-4-4-4*
Вдох 4 сек → Задержка 4 сек → Выдох 4 сек → Задержка 4 сек
Повтори 4 раза

2️⃣ *Заземление 5-4-3-2-1*
Назови 5 вещей, которые видишь
4 — которые слышишь
3 — которые можешь потрогать
2 запаха, 1 вкус

3️⃣ *Пауза 10 минут*
Поставь таймер. Не принимай решений до сигнала.
Тяга — как волна: она нарастает и спадает.

*Если совсем тяжело:*
📞 8-800-2000-122 (бесплатно, круглосуточно)"""

    keyboard = [[
        InlineKeyboardButton(
            "🚀 Открыть SOS в приложении",
            web_app=WebAppInfo(url=f"{WEBAPP_URL}/sos")
        )
    ]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        sos_text,
        parse_mode='Markdown',
        reply_markup=reply_markup
    )


async def setup_menu_button(application: Application):
    """Устанавливает кнопку Menu для открытия WebApp."""
    await application.bot.set_chat_menu_button(
        menu_button=MenuButtonWebApp(
            text="Открыть",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )
    )
    logger.info("✅ Menu button configured")


def main():
    """Запуск бота."""
    
    if not BOT_TOKEN:
        logger.error("❌ BOT_TOKEN not found in config!")
        return
    
    if not WEBAPP_URL or WEBAPP_URL == "https://your-app-url.com":
        logger.warning("⚠️ WEBAPP_URL not configured — using placeholder")
    
    # Создаём приложение
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Регистрируем команды
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("app", app_command))
    application.add_handler(CommandHandler("sos", sos_command))
    
    # Настраиваем кнопку меню при старте
    application.post_init = setup_menu_button
    
    # Запускаем
    logger.info("🚀 Bot starting...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
