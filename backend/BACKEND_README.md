# DataForge AI Backend

Django REST Framework backend for DataForge AI - an automated data analytics and ML platform.

## Features

- **User Authentication**: JWT-based authentication with registration, login, and token refresh
- **Dataset Management**: Upload and manage CSV/XLSX files with automatic schema detection
- **Exploratory Data Analysis (EDA)**: Automated statistical analysis, distributions, correlations, and insights
- **Machine Learning**: AutoML with multiple algorithms, automatic task detection, and model evaluation
- **Predictions**: Single and batch predictions using trained models
- **Reports**: Comprehensive analysis reports with AI-generated summaries
- **AI Assistant**: Gemini-powered Q&A and metric explanations

## Tech Stack

- Django 5.x
- Django REST Framework
- PostgreSQL (or SQLite for development)
- pandas / numpy / scikit-learn
- Google Gemini API (optional)
- JWT Authentication (SimpleJWT)

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL (optional, SQLite works for development)

### Installation

1. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   # For development
   pip install -r requirements/dev.txt

   # For production
   pip install -r requirements/base.txt
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Run migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Create superuser** (optional):
   ```bash
   python manage.py createsuperuser
   ```

6. **Run development server**:
   ```bash
   python manage.py runserver
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Django
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (use SQLite for development)
DATABASE_URL=sqlite:///db.sqlite3
# For PostgreSQL:
# DATABASE_URL=postgres://user:password@localhost:5432/dataforgeai

# File storage
MEDIA_ROOT=/path/to/media
MAX_UPLOAD_SIZE_MB=50

# JWT
ACCESS_TOKEN_LIFETIME_MINUTES=60
REFRESH_TOKEN_LIFETIME_DAYS=7

# AI (optional)
GEMINI_API_KEY=your-gemini-api-key
```

## API Endpoints

### Authentication (`/api/v1/auth/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register/` | Register new user |
| POST | `/login/` | Login, get tokens |
| POST | `/logout/` | Logout, invalidate token |
| POST | `/token/refresh/` | Refresh access token |
| GET | `/me/` | Get current user profile |

### Datasets (`/api/v1/datasets/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user's datasets |
| POST | `/` | Upload new dataset |
| GET | `/{id}/` | Get dataset details |
| DELETE | `/{id}/` | Delete dataset |
| GET | `/{id}/preview/` | Get first N rows |
| GET | `/{id}/schema/` | Get column schema |
| GET | `/{id}/download/` | Download original file |

### EDA (`/api/v1/eda/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Trigger EDA for dataset |
| GET | `/{id}/` | Get EDA result |
| GET | `/dataset/{dataset_id}/` | Get EDA for dataset |

### ML Training (`/api/v1/ml/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/train/` | Start training job |
| GET | `/jobs/` | List training jobs |
| GET | `/jobs/{id}/` | Get job details |
| GET | `/models/` | List trained models |
| GET | `/models/{id}/` | Get model details |
| DELETE | `/models/{id}/` | Delete model |
| GET | `/models/{id}/download/` | Download model file |

### Predictions (`/api/v1/predictions/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict/` | Single prediction (JSON) |
| POST | `/batch/` | Batch prediction (file) |
| GET | `/jobs/` | List prediction jobs |
| GET | `/jobs/{id}/` | Get job details |
| GET | `/jobs/{id}/download/` | Download predictions |

### Reports (`/api/v1/reports/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate/` | Generate report |
| GET | `/` | List reports |
| GET | `/{id}/` | Get report details |
| DELETE | `/{id}/` | Delete report |

### AI Assistant (`/api/v1/assistant/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ask/` | Ask a question |
| POST | `/explain/` | Explain a metric |
| GET | `/status/` | Check AI availability |

## API Documentation

Interactive API documentation is available at:
- Swagger UI: `/api/v1/docs/`
- ReDoc: `/api/v1/redoc/`

## Project Structure

```
backend/
├── config/
│   ├── settings.py      # Django settings
│   ├── urls.py          # Root URL configuration
│   ├── wsgi.py          # WSGI entry point
│   └── asgi.py          # ASGI entry point
├── apps/
│   ├── core/            # Shared utilities, exceptions
│   ├── users/           # User authentication
│   ├── datasets/        # Dataset management
│   ├── eda/             # Exploratory data analysis
│   ├── ml/              # Machine learning training
│   ├── predictions/     # Model predictions
│   ├── reports/         # Report generation
│   └── assistant/       # AI assistant
├── tests/               # Test configuration
├── requirements/        # Dependencies
├── media/               # Uploaded files
└── manage.py
```

## ML Pipeline

### Supported Algorithms

**Classification**:
- Logistic Regression
- Random Forest Classifier
- Gradient Boosting Classifier

**Regression**:
- Linear Regression
- Random Forest Regressor
- Gradient Boosting Regressor

### Task Detection

The system automatically detects whether a problem is classification or regression based on:
- Target column data type (categorical → classification)
- Unique value ratio (< 5% and ≤ 20 unique values → classification)

### Model Selection

Models are ranked by:
- Classification: Weighted F1 Score (higher is better)
- Regression: RMSE (lower is better)

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=apps

# Run specific app tests
pytest apps/users/tests/
```

## Development

### Code Quality

```bash
# Format code
black .
isort .

# Check code style
flake8
```

### Create Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

## Security Considerations

- File uploads are validated by content type (not just extension)
- Size limits enforced on uploads (default 50MB)
- JWT tokens with configurable expiry
- User data isolation (users only see their own resources)
- UUID primary keys to prevent enumeration

## License

Proprietary - DataForge AI
