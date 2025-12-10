import { format, formatDistanceToNow, parseISO } from 'date-fns'

// Date formatting
export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy')
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy h:mm a')
  } catch {
    return dateString
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
  } catch {
    return dateString
  }
}

// Number formatting
export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return '-'
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toString()
}

// File size formatting
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// Duration formatting
export function formatDuration(seconds: number): string {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`
  }
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

// Long duration formatting (human-readable)
export function formatDurationLong(seconds: number): string {
  if (seconds < 60) {
    const roundedSeconds = Math.round(seconds)
    return `${roundedSeconds} second${roundedSeconds !== 1 ? 's' : ''}`
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }

  if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min`
}

// Metric formatting
export function formatMetric(value: number | null | undefined, metricName: string): string {
  if (value === null || value === undefined) {
    return '-'
  }

  // Percentage metrics
  if (['accuracy', 'precision', 'recall', 'f1_score', 'f1_weighted', 'roc_auc', 'r2'].includes(metricName)) {
    return formatPercent(value)
  }

  // Error metrics (show more decimal places)
  if (['rmse', 'mae', 'mse'].includes(metricName)) {
    return formatNumber(value, 4)
  }

  return formatNumber(value)
}

// Status label formatting
export function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Algorithm name formatting
export function formatAlgorithm(algorithm: string): string {
  const names: Record<string, string> = {
    logistic_regression: 'Logistic Regression',
    linear_regression: 'Linear Regression',
    random_forest: 'Random Forest',
    gradient_boosting: 'Gradient Boosting',
    svm: 'Support Vector Machine',
  }
  return names[algorithm] || formatStatus(algorithm)
}

// Task type formatting
export function formatTaskType(taskType: string): string {
  return taskType.charAt(0).toUpperCase() + taskType.slice(1)
}

// Column type formatting
export function formatColumnType(dtype: string): string {
  const types: Record<string, string> = {
    numeric: 'Numeric',
    categorical: 'Categorical',
    datetime: 'Date/Time',
    text: 'Text',
    boolean: 'Boolean',
  }
  return types[dtype] || dtype
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

// Pluralize
export function pluralize(count: number, singular: string, plural?: string): string {
  const pluralForm = plural || `${singular}s`
  return count === 1 ? singular : pluralForm
}
