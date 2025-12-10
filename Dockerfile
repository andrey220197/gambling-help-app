FROM python:3.11-slim

WORKDIR /app

# Устанавливаем Node.js для сборки фронтенда
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Копируем файлы
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY frontend/package*.json /app/frontend/
RUN cd /app/frontend && npm install

COPY . /app/

# Собираем фронтенд
RUN cd /app/frontend && npm run build

# Заполняем базу статьями
RUN cd /app/backend && python -m app.db.seed_articles || true

WORKDIR /app/backend

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
