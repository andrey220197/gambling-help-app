# Telegram Mini App: Помощь при проблемном гемблинге

Безопасное, анонимное и научно обоснованное приложение для помощи людям с проблемными финансовыми импульсами.

## 🚀 Быстрый старт

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Скопируй .env.example в .env и заполни значения
cp .env.example .env

# Запуск
uvicorn app.main:app --reload --port 8000

# Заполнить статьи (один раз)
python -m app.db.seed_articles
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Фронтенд будет доступен на http://localhost:3000

### Telegram Bot (TODO)

```bash
cd bot
python bot.py
```

## 📁 Структура проекта

```
gambling-help-app/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/       # API endpoints
│   │   ├── db/        # Database
│   │   └── utils/     # Utilities
│   └── requirements.txt
├── frontend/          # React frontend
│   ├── src/
│   │   ├── screens/   # Pages
│   │   ├── components/
│   │   ├── api/       # API client
│   │   └── store/     # Zustand store
│   └── package.json
├── bot/               # Telegram bot (TODO)
├── CLAUDE.md          # Инструкции для Claude Code
└── PROJECT_BRIEF.md   # Описание проекта
```

## 🔑 Ключевые функции

- **Ежедневный чек-ин** — отслеживание тяги, стресса, настроения
- **Streak трекер** — мотивация через подсчёт дней
- **SOS-режим** — техники при сильной тяге (дыхание, заземление)
- **Научные карточки** — объяснения механизмов зависимости
- **Полная анонимность** — никаких личных данных

## 🔒 Анонимность

```
anon_hash = HMAC-SHA256(telegram_id + SECRET_SALT)
```

- Telegram ID **не сохраняется**
- Используется только хеш для идентификации
- Recovery code для восстановления доступа

## ⚠️ Важно

Это **не медицинская помощь**. При кризисе:
- 📞 112
- 📞 8-800-2000-122 (психологическая помощь)

## 📜 Лицензия

MIT
