# Task Reminder

Task Reminder is a Django application for managing tasks, reminders, users, and activity history. The project now runs on Django with SQLite in local development.

## Stack

- Django 5.1
- SQLite for local development
- Django templates for the UI
- `django-axes` for login protection

## Project Structure

- `apps/accounts`: authentication, profile, and user management
- `apps/tasks`: task, reminder, and activity features
- `apps/core`: shared base models and root redirect
- `config/settings`: base, local, and production settings
- `templates`: server-rendered pages
- `static`: CSS and static assets

## Local Setup

1. Install dependencies:

```bash
py -3 -m pip install -r requirements.txt
```

2. Apply migrations:

```bash
py -3 manage.py migrate
```

3. Start the development server:

```bash
py -3 manage.py runserver 127.0.0.1:8000
```

4. Open the app:

```text
http://127.0.0.1:8000/
```

## Environment

Local development reads variables from `.env`. The current Django settings use:

- `SECRET_KEY`
- `ALLOWED_HOSTS`

Production settings also support PostgreSQL through:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

## Notes

- `manage.py`, `wsgi.py`, and `asgi.py` default to `config.settings.local`
- Local development uses `db.sqlite3`
- Static files are served from `static/` in development
