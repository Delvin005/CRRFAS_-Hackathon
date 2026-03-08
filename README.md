# CRRFAS — Campus Resource, Room and Facility Allocation System

## Setup

### Prerequisites
- Docker & Docker Compose installed
- Node.js 20+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

---

### 1. Clone & Configure

```bash
git clone <repo-url>
cd CRRFAS_Hackathon

# Copy and fill env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

---

### 2. Run with Docker Compose

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- Django Admin: http://localhost:8000/admin

---

### 3. Local Development (without Docker)

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

### 4. Create Django superuser (inside Docker)

```bash
docker-compose exec backend python manage.py createsuperuser
```
