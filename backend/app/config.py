import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key")
    ANON_SALT: str = os.getenv("ANON_SALT", "dev-salt")
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # БД — используем persistent volume path если папка data существует
    _data_dir = Path("/app/backend/data")
    if _data_dir.exists():
        DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{_data_dir}/app.db")
    else:
        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")

    # JWT настройки
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24 * 7  # 7 дней


settings = Settings()
