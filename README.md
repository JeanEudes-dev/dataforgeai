# DataForge AI
[![Backend](https://img.shields.io/badge/backend-Django%20DRF-0C4B33)](backend)
[![Frontend](https://img.shields.io/badge/frontend-Web%20App-1E88E5)](frontend)
[![Data](https://img.shields.io/badge/sample%20data-CSVs-7B1FA2)](backend)
[![Status](https://img.shields.io/badge/status-active-success)](#)

DataForge AI is a full-stack, no-code data science platform. Upload a dataset, get instant EDA, train models with AutoML, and generate predictions or insights without writing code.

## Why it matters
- **Faster exploration**: Automated EDA surfaces distributions, correlations, and text summaries in minutes.
- **AutoML built-in**: Task detection, model selection, and evaluation without leaving the UI.
- **Actionable predictions**: Batch and real-time scoring with saved models and downloadable outputs.
- **Explainability**: AI assistant for “why” and “what-if” questions on metrics, models, and data quality.

## What’s inside
- **Backend (`backend/`)**: Django REST + DRF, PostgreSQL/SQLite, pandas/numpy/scikit-learn. See `backend/BACKEND_README.md` for full setup.
- **Frontend (`frontend/`)**: Web app that drives uploads, EDA views, model runs, and predictions.
- **Sample data**: Curated CSVs in `backend/` for testing uploads and model training flows.
- **Tags**: AutoML, EDA, Predictions, Explainability, JWT Auth, Docker-ready.

## Quick start (backend)
From the repo root:
1) Create env: `python -m venv venv && venv\\Scripts\\activate` (Windows) or `source venv/bin/activate` (Unix)  
2) Install deps: `pip install -r backend/requirements/base.txt`  
3) Env file: `cp backend/.env.example backend/.env` (or copy manually) and set secrets/DB.  
4) Run API: `cd backend && python manage.py migrate && python manage.py runserver 0.0.0.0:8000`

For Docker: `cd backend && docker-compose up --build` (uses project Dockerfile/compose).

## Quick start (frontend)
1) `cd frontend`  
2) Install dependencies (e.g., `npm install` or `yarn install` depending on the project setup)  
3) Run dev server (`npm run dev` or equivalent) and point it at the backend API URL.

## Repository map
- `backend/`: API, AutoML pipelines, data ingestion, auth, reports, tests.
- `frontend/`: UI for uploads, EDA, modeling, predictions, and AI assistant.
- `PRD.md`: Product spec and goals.
- `sample data`: CSVs under `backend/` for demos (house prices, churn, etc.).

## Development notes
- Python 3.11+ recommended; SQLite works for local dev, PostgreSQL for production.
- Authentication uses JWT (SimpleJWT). Configure secrets in `.env`.
- Optional: Google Gemini API for AI assistant responses.

## Contributing
1) Follow the quick start to run backend/frontend locally.  
2) Add tests where relevant (backend `pytest`, frontend test runner if configured).  
3) Keep README and `backend/BACKEND_README.md` in sync when adding major features.
