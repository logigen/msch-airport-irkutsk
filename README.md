# МСЧ Аэропорт Иркутск

Веб-приложение для автоматизации работы Медико-санитарной части аэропорта Иркутск.

## Технологии

* Node.js 20
* Express
* PostgreSQL 16
* Docker
* Docker Compose
* JWT
* HTML/CSS/JavaScript

## Структура проекта

```
msch-airport-irkutsk
│
├── msch-backend
│   ├── src
│   │   ├── db
│   │   ├── middleware
│   │   ├── routes
│   │   └── index.js
│   ├── Dockerfile
│   ├── package.json
│   └── package-lock.json
│
├── frontend
├── schema.sql
├── seed.sql
├── docker-compose.yml
└── .env
```

---

# Локальное развертывание

## Подготовка окружения

Установить:

* Node.js 20.x или выше;
* Docker Desktop;
* Git.

Клонировать репозиторий:

```bash
git clone <repository_url>
cd msch-airport-irkutsk
```

## Настройка проекта

Создать файл `.env` в корне проекта:

```env
DB_HOST=db
DB_PORT=5432

DB_NAME=msch
DB_USER=msch
DB_PASSWORD=msch

JWT_SECRET=your_secret_key

PORT=3001
```

## Запуск проекта

Выполнить команду:

```bash
docker compose up -d --build
```

Проверить состояние контейнеров:

```bash
docker ps
```

После запуска будут созданы контейнеры:

* db — PostgreSQL 16;
* backend — Node.js + Express;
* frontend — клиентское приложение.

## Доступ к приложению

Frontend:

```
http://localhost:8080
```

Backend API:

```
http://localhost:3001
```

---

# Docker

Проект состоит из трех сервисов:

## PostgreSQL

Образ:

```yaml
postgres:16-alpine
```

Данные сохраняются в том:

```yaml
pg_data
```

При первом запуске автоматически выполняются:

* schema.sql;
* seed.sql.

## Backend

Образ собирается из файла:

```
msch-backend/Dockerfile
```

Точка входа:

```bash
node src/index.js
```

Backend доступен на порту:

```
3001
```

## Frontend

Frontend публикуется на порту:

```
8080
```

---

# Конфигурация базы данных

Подключение к PostgreSQL осуществляется через файл:

```
src/db/pool.js
```

Используются переменные окружения:

```javascript
host: process.env.DB_HOST || 'db',
port: parseInt(process.env.DB_PORT || '5432'),
database: process.env.DB_NAME || 'msch',
user: process.env.DB_USER || 'msch',
password: process.env.DB_PASSWORD || 'msch'
```

---

# Режим разработки

Установить зависимости:

```bash
npm install
```

Запуск сервера:

```bash
npm run dev
```

Используется nodemon:

```json
"dev": "nodemon src/index.js"
```

---

# Инициализация базы данных

При первом запуске контейнера PostgreSQL автоматически выполняются:

* `schema.sql`;
* `seed.sql`.

Дополнительно при старте приложения создаются и обновляются служебные таблицы:

* `gallery_photos`;
* `patient_medical_histories`;
* `app_settings`.

Настраиваются триггеры и индексы для таблицы `appointments`.

---

# Остановка проекта

Остановить контейнеры:

```bash
docker compose down
```

Остановить и удалить тома:

```bash
docker compose down -v
```

---

# Автор

Проект разработан в рамках выпускной квалификационной работы по теме:

**«Разработка информационной системы для Медико-санитарной части аэропорта Иркутск»**.
