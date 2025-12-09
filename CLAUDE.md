# Точка опоры — Telegram Mini App

## Описание проекта
Приложение для помощи людям с игровой зависимостью (гемблинг, трейдинг, цифровые привычки). Telegram Mini App с React фронтендом и FastAPI бэкендом.

## Структура проекта

```
gambling-help-app/
├── frontend/          # React + Vite + Tailwind
│   └── src/
│       ├── api/client.js       # HTTP клиент с JWT
│       ├── components/         # UI компоненты
│       ├── screens/            # Экраны приложения
│       ├── store/useStore.js   # Zustand store
│       └── hooks/useTelegram.js
├── backend/           # FastAPI + SQLite
│   └── app/
│       ├── api/               # API роутеры
│       │   ├── auth.py        # Авторизация + get_current_user
│       │   ├── tests.py       # Система тестов
│       │   ├── checkins.py    # Ежедневные чек-ины
│       │   ├── diary.py       # КПТ дневник мыслей
│       │   └── money.py       # Отслеживание финансов
│       ├── services/
│       │   └── test_engine.py # Движок выбора тестов
│       ├── db/
│       │   ├── database.py
│       │   ├── tests_level_a.py  # Тесты онбординга
│       │   ├── tests_level_b.py  # Ежедневные тесты
│       │   └── tests_level_cd.py # Событийные тесты
│       ├── config.py
│       ├── utils.py
│       └── main.py
└── bot/               # Telegram бот
```

## Технологии
- **Frontend:** React 18, Vite, Tailwind CSS, Zustand, Recharts
- **Backend:** FastAPI, aiosqlite, PyJWT
- **Auth:** JWT токены, анонимный хеш Telegram ID
- **БД:** SQLite (app.db)

## Ключевые особенности

### Система тестов (4 уровня)
- **A (онбординг):** A1-A5, проходятся при регистрации
- **B (ежедневные):** после чек-ина, ротация
- **C (еженедельные):** по воскресеньям
- **D (событийные):** при срыве, высокой тяге, кризисе

### Онбординг flow
1. Intro слайды → 2. Выбор трека → 3. Тесты A1, A2/A3/A4, A5 → 4. Результаты → 5. Настройки денег → 6. Готово

### Авторизация
- Debug режим: `init_data = "debug"` → telegram_id = 12345678
- JWT токен хранится в localStorage (`tochka-opory-storage`)
- `get_current_user()` в `app/api/auth.py`

## Текущая проблема

Онбординг зацикливается на тесте A1. Причина:
- `tests.py` вызывает `process_test_result()` для всех тестов
- Но для тестов A нужно вызывать `complete_onboarding_test()`, который обновляет `onboarding_day`

### Исправление в tests.py:
```python
# Для тестов онбординга (A) используем специальный метод
if submission.test_code.startswith("A"):
    result = await engine.complete_onboarding_test(user_id, test_code, answers, score)
else:
    result = await engine.process_test_result(user_id, test_code, answers, score)
```

## Полезные команды

### Запуск
```bash
# Backend
cd backend
./venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm run dev
```

### Сброс пользователя для тестирования
```bash
cd backend
./venv/Scripts/python.exe -c "
import sqlite3
conn = sqlite3.connect('app.db')
conn.execute('DELETE FROM test_results WHERE user_id = 10')
conn.execute('UPDATE user_profiles SET onboarding_completed = 0, onboarding_day = 0 WHERE user_id = 10')
conn.commit()
print('Done!')
"
```

### Проверка БД
```bash
./venv/Scripts/python.exe -c "
import sqlite3
conn = sqlite3.connect('app.db')
conn.row_factory = sqlite3.Row
for row in conn.execute('SELECT * FROM user_profiles WHERE user_id = 10'):
    print(dict(row))
"
```

## Важные файлы для отладки
- `backend/app/api/tests.py` — API тестов
- `backend/app/services/test_engine.py` — логика выбора тестов
- `frontend/src/screens/Onboarding.jsx` — UI онбординга
- `frontend/src/api/client.js` — HTTP клиент

## Конфигурация
- JWT секрет: `settings.SECRET_KEY` (не JWT_SECRET!)
- Debug режим: `settings.DEBUG = True`
- БД: `backend/app.db`
