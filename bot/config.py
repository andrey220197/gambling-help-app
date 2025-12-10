import os
from dotenv import load_dotenv

# Загружаем .env из родительской папки (backend/.env)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

# Токен бота
BOT_TOKEN = os.getenv("BOT_TOKEN", "")

# URL WebApp (пока localhost для разработки, потом заменим на продакшн)
# Для локальной разработки используем ngrok или аналог
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://your-app-url.com")
