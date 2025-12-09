import hmac
import hashlib
import secrets
import random

from app.config import settings

# Списки слов для recovery code
ADJECTIVES = [
    "WOLF", "BEAR", "HAWK", "LION", "TIGER", "EAGLE", "RAVEN", "STORM",
    "FROST", "FLAME", "STONE", "RIVER", "OCEAN", "WIND", "CLOUD", "STAR",
    "MOON", "SUN", "TREE", "LEAF", "SNOW", "RAIN", "FIRE", "ICE"
]

NOUNS = [
    "MOUNTAIN", "FOREST", "VALLEY", "DESERT", "ISLAND", "CANYON", "MEADOW",
    "GLACIER", "VOLCANO", "PRAIRIE", "TUNDRA", "JUNGLE", "SAVANNA", "REEF",
    "CLIFF", "CAVE", "PEAK", "RIDGE", "SHORE", "GROVE", "FIELD", "BROOK"
]


def create_anon_hash(telegram_id: int) -> str:
    """
    Создаёт анонимный хеш из telegram_id.
    
    ВАЖНО: telegram_id нигде не сохраняется!
    Только этот хеш используется для идентификации.
    """
    message = f"{telegram_id}{settings.ANON_SALT}".encode()
    return hmac.new(
        settings.SECRET_KEY.encode(),
        message,
        hashlib.sha256
    ).hexdigest()


def generate_recovery_code() -> str:
    """
    Генерирует человекочитаемый код восстановления.
    
    Формат: WORD-WORD-NNNN
    Пример: WOLF-MOON-7234
    """
    adj = random.choice(ADJECTIVES)
    noun = random.choice(NOUNS)
    number = random.randint(1000, 9999)
    return f"{adj}-{noun}-{number}"


def verify_anon_hash(telegram_id: int, stored_hash: str) -> bool:
    """Проверяет соответствие telegram_id и хеша."""
    computed_hash = create_anon_hash(telegram_id)
    return hmac.compare_digest(computed_hash, stored_hash)
