// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// File upload limits
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const ALLOWED_FILE_TYPES = ['.csv', '.xlsx', '.xls']
export const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

// Pagination
export const DEFAULT_PAGE_SIZE = 20

// Polling intervals (in milliseconds)
export const JOB_POLLING_INTERVAL = 2000 // 2 seconds
export const FAST_POLLING_INTERVAL = 1000 // 1 second
export const SLOW_POLLING_INTERVAL = 5000 // 5 seconds

// Toast durations (in milliseconds)
export const TOAST_DURATION = {
  short: 3000,
  normal: 5000,
  long: 8000,
}

// Status colors
export const STATUS_COLORS = {
  pending: 'primary',
  uploading: 'primary',
  processing: 'primary',
  running: 'primary',
  generating: 'primary',
  ready: 'success',
  completed: 'success',
  error: 'error',
  cancelled: 'neutral',
} as const

// Chart colors
export const CHART_COLORS = {
  primary: '#f59e0b', // Amber-500
  secondary: '#d97706', // Amber-600
  tertiary: '#fbbf24', // Amber-400
  success: '#22c55e',
  error: '#ef4444',
  neutral: '#64748b',
  grid: '#e5e5e5',
  gridDark: '#374151',
}

// Task types
export const TASK_TYPES = {
  classification: 'Classification',
  regression: 'Regression',
} as const

// Algorithm display names
export const ALGORITHMS = {
  logistic_regression: 'Logistic Regression',
  linear_regression: 'Linear Regression',
  random_forest: 'Random Forest',
  gradient_boosting: 'Gradient Boosting',
  svm: 'Support Vector Machine',
} as const

// Metric display names
export const METRICS = {
  accuracy: 'Accuracy',
  precision: 'Precision',
  recall: 'Recall',
  f1_score: 'F1 Score',
  f1_weighted: 'F1 (Weighted)',
  roc_auc: 'ROC AUC',
  rmse: 'RMSE',
  mae: 'MAE',
  mse: 'MSE',
  r2: 'R2 Score',
} as const

// Navigation items
export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'home' },
  { path: '/datasets', label: 'Datasets', icon: 'database' },
  { path: '/training/jobs', label: 'Training', icon: 'cpu' },
  { path: '/models', label: 'Models', icon: 'cube' },
  { path: '/reports', label: 'Reports', icon: 'document' },
  { path: '/assistant', label: 'AI Assistant', icon: 'chat' },
] as const

// Workflow steps
export const WORKFLOW_STEPS = [
  { id: 'upload', label: 'Upload', description: 'Upload your dataset' },
  { id: 'eda', label: 'Analyze', description: 'Explore your data' },
  { id: 'train', label: 'Train', description: 'Train ML models' },
  { id: 'predict', label: 'Predict', description: 'Make predictions' },
  { id: 'report', label: 'Report', description: 'Generate reports' },
] as const
