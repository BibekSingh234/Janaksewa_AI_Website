# Janaksewa AI — Citizen Assistance

Janaksewa AI is a Django-based civic assistance website for Janakpur with public information pages, citizen registration/login, complaint submission/tracking, an AI chatbot, contact messages, and separate user/admin dashboards.

## Fixed architecture

- **Backend:** Django
- **Database:** SQLite by default; optional MySQL
- **AI:** Google Gemini (optional; local fallback works without a key)
- **Frontend:** HTML5, CSS3, JavaScript, Bootstrap 5
- **Authentication:** Django session authentication
- **Dashboards:** `/dashboard.html` for citizens and `/admin-dashboard.html` for staff/superusers
- **Uploads:** complaint/profile images are stored under `media/`

## Run locally on Windows

From the project root (the folder containing `manage.py`):

```bat
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy backend\.env.example backend\.env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Then open:

- Website: `http://127.0.0.1:8000/`
- Login/Register: `http://127.0.0.1:8000/login-register.html`
- Citizen dashboard: `http://127.0.0.1:8000/dashboard.html`
- Admin dashboard: `http://127.0.0.1:8000/admin-dashboard.html`
- Django admin: `http://127.0.0.1:8000/admin/`
- API health: `http://127.0.0.1:8000/api/health/`

**Important:** run the website through Django rather than opening the HTML files with `file://`. This keeps the frontend and session authentication on the same origin and avoids browser CORS/cookie problems.

## Environment variables

Edit `backend/.env`:

```env
DJANGO_SECRET_KEY=replace-with-a-long-random-secret
DEBUG=True
GEMINI_API_KEY=PASTE_YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-2.5-flash
USE_MYSQL=false
DB_NAME=janakpur_db
DB_USER=root
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3306
DEFAULT_FROM_EMAIL=noreply@localhost
ADMIN_EMAIL=admin@localhost
```

If Gemini is not configured, the chatbot still responds using the built-in local fallback. For production, set a real secret, `DEBUG=False`, valid `ALLOWED_HOSTS`, email settings, and a production database.

## MySQL

Set:

```env
USE_MYSQL=true
DB_NAME=janakpur_db
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=127.0.0.1
DB_PORT=3306
```

Create the database in MySQL first, then run:

```bat
python manage.py migrate
```

## Main API endpoints

- `GET /api/health/`
- `GET /api/csrf/`
- `GET /api/me/`
- `POST /api/login/`
- `POST /api/register/`
- `POST /api/logout/`
- `POST /api/complaints/create/`
- `GET /api/complaints/mine/`
- `GET /api/complaints/` — admin only
- `PATCH /api/complaints/<id>/status/` — admin only
- `GET /api/dashboard/my-stats/`
- `GET /api/dashboard/stats/` — admin only
- `GET /api/news/`
- `GET /api/services/`
- `GET /api/tourist-places/`
- `POST /api/contact/`
- `POST /api/chat/`

## Security notes

- Django session authentication is now used as the source of truth for dashboard access; localStorage is only used for UI convenience.
- State-changing API endpoints use Django CSRF protection.
- Admin APIs verify `is_staff` server-side.
- Do not commit `backend/.env` or API keys.
- The Gemini key that was present in the uploaded project should be considered exposed and **must be rotated/revoked**. The fixed project contains only a placeholder.
- The supplied SQLite database was retained for local development, but production should use a properly managed database and backups.

## Validation performed

The repaired project was checked for:

- Django system checks
- Migration consistency
- JavaScript syntax
- CSS parsing
- HTML structure and duplicate IDs
- Local asset/page paths
- Django page routing
- API health/news/services/tourism routes
- User registration/session/current-user flow
- User dashboard statistics
- Complaint creation
- Admin login, authorization, statistics and complaint listing
- Contact-message submission
- CSRF rejection/acceptance behavior

External Gemini requests and real email delivery require the corresponding external configuration and cannot be fully verified without valid service credentials.
