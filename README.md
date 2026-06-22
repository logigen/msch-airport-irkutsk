# МСЧ аэропорта Иркутск

React/Vite frontend, Express API backend и PostgreSQL база данных.

## Структура

```text
./
  msch/                 frontend React/Vite
  msch-backend/         backend Express API
  schema.sql            схема БД
  seed.sql              демо-данные (только для разработки)
  docker-compose.yml    запуск всего проекта
  Dockerfile.frontend   сборка frontend
  nginx.conf            frontend + proxy /api
  .env.example          шаблон переменных окружения
```

## Подготовка

1. Скопируй `.env.example` в `.env` и задай свои значения `DB_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.
2. Файл `.env` не должен попадать в git (уже в `.gitignore`).

## Запуск через Docker

1. Запусти Docker Desktop.
2. Открой терминал в папке проекта:

```bash
docker compose up --build
```

3. Открой приложение:

```text
http://localhost:8080
```

API доступен через:

```text
http://localhost:8080/api
```

Сбросить базу и заново применить `schema.sql` + `seed.sql`:

```bash
docker compose down -v
docker compose up --build
```

## Локальный frontend без Docker

```bash
cd msch
npm install
npm run dev
```

Открой `http://localhost:5173`. Frontend проксирует `/api` на `http://localhost:3001`.

## Локальный backend без Docker

Нужен PostgreSQL и переменные из `.env` (для локального запуска укажи `DB_HOST=localhost`).

```bash
cd msch-backend
npm install
npm start
```

Проверка: `http://localhost:3001/api/health`

## Админ-панель

После входа под учётной записью с ролью `admin` открой `/admin`.

Разделы:
- **Обзор** — сводка по пользователям, врачам и записям
- **Пользователи** — поиск, смена роли, удаление
- **Врачи** — список специалистов
- **Записи** — завершение и отмена приёмов

Email и ФИО пациентов в интерфейсе отображаются частично скрытыми.

## Демо-данные

Файл `seed.sql` создаёт тестовых пользователей с доменом `@demo.local`. Используй только в локальной среде. Учётные данные не публикуются в документации — при необходимости сгенерируй свой bcrypt-хеш или зарегистрируй пользователя через форму.

## Частые проблемы

Если `docker compose build` пишет, что Docker API недоступен — Docker Desktop не запущен.

Если порт 8080 занят — измени маппинг `"8080:80"` в `docker-compose.yml`.
