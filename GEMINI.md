This document defines how all AI and human agents should think, design, and code when working on DataForge AI — an AI-driven web platform for automated data analytics and prediction.

1. Product Vision & Positioning

Name: DataForge AI

Tagline (working): “Upload data. Get models, insights, and predictions — automatically.”

Core idea:
DataForge AI is a web platform where a user can:

Upload a dataset (CSV/XLSX),

Get automated EDA (stats, charts, insights),

Let the system train and select ML models,

Use the best model to make predictions on new data,

Download reports and ask an AI assistant for explanations.

Target users:

Students & researchers

Business analysts & managers

Developers who want a quick bootstrap for analytics

Product priorities (in order):

Correctness & safety of analysis

Clarity of results and UX

Performance on medium datasets

Code maintainability and extensibility

2. Architecture Overview

High-level architecture:

Frontend (React)

Upload & dataset management UI

EDA visualization dashboard

Model training & status views

Prediction input/output views

Report viewer

AI assistant chat panel

Backend (Django)

REST API for datasets, EDA, models, predictions, reports

ML orchestration layer

Job/status tracking

Authentication & basic permissions

Logging & auditing

ML/Analytics Layer

Pandas & NumPy for data handling

Scikit-learn (and optionally AutoML helpers) for modeling

SHAP/LIME for explanations (if implemented)

Storage

PostgreSQL for metadata & config

Filesystem or S3-compatible storage for raw datasets & generated reports

3. Tech Stack & Ground Rules
3.1 Backend (Django)

Framework: Django + Django REST Framework

Language: Python 3.x

Database: PostgreSQL

Core libs:

pandas, numpy

scikit-learn

joblib (for model persistence)

drf-spectacular or similar for API schema

Backend rules:

Apps separation

core/ for shared utilities

datasets/ for upload, validation, schema, storage

eda/ for automated analysis & summaries

ml/ for model training, selection & prediction

reports/ for report generation

users/ for auth & profiles

API design

RESTful, versioned via /api/v1/...

Use serializers for all input/output

Validate strictly (no blind assumptions about user data)

All heavy operations (training, big EDA) expose status endpoints (/jobs/<id>/).

Error handling

Never crash on user data errors; respond with clear, structured errors.

Return:

{
  "detail": "Human-readable message",
  "code": "ERROR_CODE",
  "meta": { ...optional context... }
}


Tests

Every new feature must have tests:

Model tests

Serializer tests

API endpoint tests

Prefer pytest or Django TestCase with clear naming:

test_<feature>_<behavior>_<expected>()

3.2 Frontend (React)

Framework: React (TypeScript strongly preferred if added later)

UI: Tailwind CSS or CSS Modules (keep it clean & minimal)

Charts: Recharts / Chart.js / similar

State management: React Query or basic context/hooks, no overengineering

Frontend rules:

Structure

src/components/ – presentational components

src/features/ – feature-based folders (datasets, eda, models, predictions, reports, assistant)

src/api/ – API clients

src/hooks/ – shared logic

src/types/ – shared types/interfaces

UX priorities

The user must always know:

What stage they are in: (Upload → EDA → Modeling → Prediction → Report)

What the system is doing: loading / running / finished / error

Always show:

Progress indicators during training

Clear messages when no data or no model is available

Styling

Simple, dashboard-like UI

Neutral background, strong contrast for charts

Use consistent spacing, font sizes, and component patterns

Errors & empty states

No blank screens.

Show friendly explanations:

“No dataset uploaded yet.”

“Model not trained yet. Train one from the Modeling tab.”

4. Core Features & Behavior Rules
4.1 Dataset Upload & Management

Goal: User uploads a CSV/XLSX, platform validates and stores it.

Agent rules:

Enforce file type, size limit, and basic schema checks.

Store:

Original file

Parsed schema (column names, data types)

Basic metadata: rows, columns, null ratios

If parsing fails: return a clear error with actionable suggestions.

4.2 Automated EDA

Goal: Quickly summarize and visualize the dataset.

What to compute:

Summary statistics (mean, std, min, max, percentiles)

Distributions (histograms / density)

Correlations (numeric columns)

Missing value profiles

Basic outlier detection (IQR / z-score)

Agent rules:

Always limit heavy operations for performance:

Sample if dataset is too large (and clearly label as sampled).

Return both:

Raw metrics (for charts)

Auto-generated “insights” (short text summaries)

Examples of insights:

“Column age has 18% missing values.”

“price strongly correlates with size (corr = 0.82).”

4.3 Machine Learning Engine

Goal: Auto-detect task type and select best model.

Agent behavior:

Task detection

If target column is:

Numeric with many distinct values → regression

Categorical with few distinct values → classification

Model set

Classification candidates:

Logistic Regression

Random Forest

Gradient Boosting / XGBoost

Regression candidates:

Linear Regression

Random Forest Regressor

Gradient Boosting / XGBoost Regressor

Training rules

Always split into train/validation sets.

Use cross-validation where reasonable.

Use simple hyperparameter search first (don’t overcomplicate).

Track metrics consistently per model.

Model selection

Choose best model by a clear scalar metric:

Classification: F1 or Accuracy

Regression: RMSE (lower is better)

Persist:

Trained model

Metrics

Feature list

4.4 Prediction Module

Goal: Use selected model to make predictions on new data.

Agent rules:

Validate new input schema against training schema.

Handle:

Missing columns → explicit errors

Extra columns → either ignore or warn, but be consistent.

Return:

Predictions array

Optionally, confidence / probability for classification

Allow user to download predictions as CSV.

4.5 Reporting

Goal: Generate a single, digestible report for a dataset + model.

Report contains:

Dataset overview (rows, cols, missingness)

Important EDA visualizations

Selected model summary + metrics

Feature importance (if available)

Short, human-readable insights

Agent rules:

Use structured templates (no chaotic paragraphs).

Keep language clear & neutral, not marketing-heavy.

Avoid math dumps; focus on decision-making insights.

4.6 AI Insights Assistant

Goal: Let the user ask questions in natural language about their data/models.

Behavior rules:

Never hallucinate:
Only answer based on:

Stored metrics

EDA summaries

Model results

If something is unknown: say it clearly and suggest how the user can get it.

Explain metrics in simple language:

“F1-score balances precision and recall…”

Focus on interpretation, not code.

5. Coding & Collaboration Standards

Changes must be local & safe

Do not refactor the entire app unless it’s explicitly requested.

Prefer small, focused changes.

Naming

Be explicit: DatasetSummary, ModelTrainingJob, PredictionResult.

Avoid abbreviations that are not obvious.

Documentation

Keep docstrings for core functions/classes.

API endpoints must be discoverable via auto-generated schema.

Logging

Log:

Dataset upload

Model training start/finish

Prediction runs

Don’t log sensitive raw data; log references/IDs instead.

Security

Never execute user-provided code.

Treat all uploaded files as untrusted input.

6. Non-Goals (What Agents Should Not Do)

Build a full multi-tenant SaaS system (just keep it single-tenant / simple for now).

Implement real-time streaming analytics (batch uploads only).

Add extremely complex AutoML frameworks unless explicitly requested.

Overcomplicate UI with too many pages or steps.

7. How to Approach Tasks as an AI Agent

When given a task in this repo, follow this flow:

Identify which layer is affected

Frontend UI / UX

Backend API / logic

Data/ML pipeline

Documentation

Check existing structure

Reuse existing patterns (folder structure, naming, API style).

Plan briefly

List the files to touch.

List the new components/models/endpoints.

Implement

Keep changes focused and consistent.

Add or update tests if backend logic changes.

Keep UI accessible and clear.

Summarize

Explain what you changed, why, and any follow-up work.