# DataForge AI – Functional Documentation

## 1. What the app is
DataForge AI is a no-code analytics and ML platform. Users upload tabular datasets (CSV/XLSX), get automated EDA, run AutoML to pick the best model, generate predictions on new data, and download reports, with an AI assistant explaining results.

## 2. User journey at a glance
1) **Sign in** (JWT-backed auth).  
2) **Upload dataset** (CSV/XLSX) and name the project.  
3) **EDA page** auto-renders stats, distributions, missingness, correlations, and textual insights.  
4) **Modeling page** runs AutoML (task detection: classification/regression) and ranks models.  
5) **Prediction page** accepts new rows matching the schema and returns a downloadable CSV.  
6) **Report page** generates PDF/HTML with EDA + model results.  
7) **AI assistant** answers “why/what-if/how” questions across the flow.

## 3. Core features
- **Dataset ingestion**: CSV/XLSX upload, schema detection, numeric vs categorical inference, missing-value scan, safe parsing, row/column validation.  
- **Automated EDA**: Summary stats, distributions, correlation heatmaps, outlier and missingness analysis, natural-language highlights.  
- **AutoML**: Task detection, model selection (linear/logistic, random forest, gradient boosting/XGBoost, SVM), hyperparameter tuning, metrics (accuracy/precision/recall/F1, RMSE/MAE), ROC and confusion matrix, best-model selection and storage.  
- **Prediction service**: Schema validation on new data, batch scoring, downloadable results.  
- **Reporting**: PDF/HTML report with dataset overview, charts, model leaderboard, feature importance, recommendations.  
- **AI assistant**: Insight explanations, metric breakdowns, feature-importance rationale, Q&A on charts/models/data quality.  
- **Security & logging**: File-type validation, auth, audit trails, isolation by user/project.  
- **Sample data**: Curated CSVs in `backend/` for demos and testing.

## 4. Page-by-page outline
### 4.1 Authentication / Landing
- **Sign in / sign up**: JWT-based; shows recent projects and “New project” CTA.

### 4.2 Dataset Upload
- **Inputs**: File picker (CSV/XLSX), project name, optional target selection (or auto-detected).  
- **Validations**: File type/size, schema parsing, row/column limits, duplicate column detection.  
- **Outputs**: Parsed schema, inferred dtypes, basic stats, missingness counts.  
- **Actions**: Proceed to EDA, replace file, delete dataset.

### 4.3 EDA Dashboard
- **Summary**: Row/column counts, target/type detection, missingness table.  
- **Distributions**: Histograms for numeric, bar charts for categorical.  
- **Correlation**: Heatmap; top positive/negative pairs.  
- **Outliers**: Simple rule-based outlier counts per numeric column.  
- **Missingness**: Per-column % and patterns.  
- **Insights**: AI-generated bullet points on notable relationships and data quality.  
- **Actions**: Refresh EDA, export EDA summary, continue to Modeling.

### 4.4 Modeling (AutoML)
- **Task detection**: Classification vs regression based on target dtype/cardinality.  
- **Model candidates**: Linear/Logistic Regression, Random Forest, Gradient Boosting/XGBoost, SVM.  
- **Tuning**: Light hyperparameter sweeps; cross-validation.  
- **Metrics**: Classification (accuracy, precision, recall, F1, ROC AUC, confusion matrix); Regression (RMSE, MAE, R^2).  
- **Leaderboard**: Ranked models with metric table.  
- **Model card**: Selected best model, feature importance, training summary.  
- **Actions**: Rerun with constraints, pick a different model, proceed to Predictions.

### 4.5 Predictions
- **Inputs**: Upload new CSV matching the training schema (no target).  
- **Validation**: Column alignment, dtype checks, missing handling.  
- **Outputs**: Predictions with optional probabilities; downloadable CSV.  
- **Actions**: View sample scored rows, download results, regenerate with another model if selected.

### 4.6 Reports
- **Formats**: PDF/HTML.  
- **Contents**: Dataset overview, EDA visuals, model leaderboard, selected model details, feature importance, recommendations, and a change log (run metadata).  
- **Actions**: Generate, download, re-run after new training.

### 4.7 AI Assistant
- **Scope**: Explains metrics, charts, feature importance, and EDA findings; supports “what-if” and “why this model” questions.  
- **Context**: Uses project metadata, EDA outputs, and model summaries to answer.  
- **Actions**: Ask follow-ups, request summaries, clarify data quality issues.

## 5. Backend capabilities (overview)
- **Framework**: Django REST + DRF; JWT auth (SimpleJWT).  
- **Data/ML stack**: pandas, numpy, scikit-learn; AutoML orchestration per PRD.  
- **Persistence**: PostgreSQL (prod) or SQLite (dev); local/S3-like storage for datasets/models.  
- **APIs** (representative): dataset upload, EDA run/read, AutoML train, model list/select, prediction run, report generation, assistant chat.  
- **Logging**: Requests, dataset metadata, model runs, report generation events.

## 6. Frontend capabilities (overview)
- **Flows**: Upload, EDA dashboard, modeling leaderboard, prediction upload/results, reports, AI chat.  
- **Visuals**: Distributions, correlation heatmaps, ROC/confusion for classification, regression metrics cards, feature-importance chart.  
- **State**: Project-based navigation; links to regenerate EDA, rerun AutoML, switch models.  
- **Config**: Points to backend API base URL; respects auth tokens.

## 7. Sample data (for demos)
- `backend/house_prices.csv`: Home prices with sqft/bedrooms/price/year_built/zip.  
- `backend/customer_churn.csv`: Churn modeling sample.  
- `backend/employee_salary.csv`: Salary regression sample.  
- `backend/sample_data*.csv`, `backend/national-month.csv`, others for EDA/ML flows.  
- Additional synthetic domain datasets: rentals, commercial properties, short-term rentals, mortgages, construction, energy (all numeric-friendly).

## 8. Operational notes
- **Performance targets** (per PRD): EDA < 5s (medium data), training < 30s, predictions < 2s.  
- **Security**: File-type validation, safe parsing (no code exec), JWT auth, audit logging.  
- **Scalability**: Horizontal scaling for ML jobs, cached EDA, efficient storage for datasets/models.  
- **Env**: Python 3.11+, Docker-compose available; configure `.env` for secrets/DB/Gemini.

## 9. How to extend
- Add connectors (SQL/external sources).  
- Add time-series forecasting module.  
- Add collaboration (multi-user projects, roles).  
- Add experiment tracking and dataset/model versioning.  
- Expand explainability (SHAP/LIME visual outputs).

## 10. Appendix – Key terms
- **EDA**: Automated summary of distributions, correlations, outliers, missingness.  
- **AutoML**: Automated model selection/tuning for a detected task.  
- **ROC/Confusion Matrix**: Classification diagnostics.  
- **Feature Importance**: Relative influence of features on model predictions.  
- **JWT**: JSON Web Token used for auth in the backend API.
