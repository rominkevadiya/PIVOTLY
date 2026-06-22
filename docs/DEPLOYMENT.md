# Pivotly Deployment Architecture

## Infrastructure Overview
Pivotly follows a "Zero-AWS-Cost" scale blueprint designed to run leanly on minimal infrastructure while maximizing AI concurrency.

- **Server:** Single AWS EC2 Instance (`t3.micro`)
- **Database:** AWS RDS PostgreSQL (`db.t3.micro`)
- **Web Server:** Nginx (Reverse Proxy & SSL termination)
- **Application Server:** Gunicorn with Uvicorn workers

*Note: Distributed systems like Redis, Celery, and Application Load Balancers are explicitly excluded from the current blueprint to minimize monthly billing.*

---

## 1. Environment Variables

The backend requires the following `.env` configuration:

```env
# Server
PORT=8000
ENVIRONMENT=production

# Database
DATABASE_URL=postgresql+psycopg2://user:password@rds-endpoint.amazonaws.com:5432/pivotly

# Security
SECRET_KEY=your-secure-jwt-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI Configuration
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.5-flash
TAVILY_API_KEY=your-tavily-key
```

---

## 2. Server Processes

### Nginx
Nginx is exposed on ports 80 (HTTP) and 443 (HTTPS) and proxies API traffic to Gunicorn.
- **Config location:** `/etc/nginx/sites-available/pivotly`

### Gunicorn & Uvicorn
FastAPI runs via Gunicorn managing Uvicorn ASGI workers.
- **Command:** `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000`
- **Management:** Managed via `systemd` service (`/etc/systemd/system/pivotly.service`)

---

## 3. Deployment Workflow

1. **Pull Changes:** `git pull origin main`
2. **Virtual Environment:** `source .venv/bin/activate`
3. **Install Dependencies:** `pip install -r requirements.txt`
4. **Database Migrations:** `alembic upgrade head`
5. **Restart Service:** `sudo systemctl restart pivotly`
6. **Check Logs:** `sudo journalctl -u pivotly -f`

## 4. Operational Maintenance
- **Database Backups:** Managed automatically by RDS via daily snapshots.
- **Error Tracking:** Trace UUIDs and raw prompt dumps are logged to `/tmp/pivotly_errors/` upon validation failure.
- **Log Management:** Ensure `/tmp/` and systemd journals are periodically rotated to prevent disk space exhaustion.
