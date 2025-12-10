import type {
  BenchmarkData,
  BenchmarkCalculationParams,
  ManualStep,
} from '@/types/benchmark.types'

/**
 * Calculate estimated manual effort for ML workflow
 *
 * Formula breakdown:
 * - Base time per step (varies by complexity)
 * - Per 10K rows: +5 min per step
 * - Per 10 features: +4 min per step
 * - Classification bonus: +10% (more complex evaluation)
 */
export function calculateManualEffort(
  params: BenchmarkCalculationParams
): BenchmarkData {
  const { rowCount, columnCount, taskType, featureCount } = params
  const features = featureCount || Math.max(1, columnCount - 1) // Assume 1 target column

  // Base times in minutes for each step
  const BASE_DATA_PREP = 60 // 1 hour
  const BASE_EDA = 90 // 1.5 hours
  const BASE_FEATURE_ENG = 45 // 45 minutes
  const BASE_MODEL_SELECTION = 60 // 1 hour
  const BASE_HYPERPARAM = 90 // 1.5 hours
  const BASE_VALIDATION = 45 // 45 minutes

  // Scaling factors based on data size
  const rowScaling = Math.floor(rowCount / 10000) * 5 // +5 min per 10K rows
  const featureScaling = Math.floor(features / 10) * 4 // +4 min per 10 features
  const classificationBonus = taskType === 'classification' ? 1.1 : 1 // 10% more for classification

  // Calculate each step with scaling
  const breakdown: ManualStep[] = [
    {
      name: 'Data Preparation & Cleaning',
      description:
        'Loading data, handling missing values, data type conversions, duplicate removal',
      baseMinutes: BASE_DATA_PREP,
      estimatedMinutes: Math.round(
        (BASE_DATA_PREP + rowScaling * 2 + featureScaling * 2) *
          classificationBonus
      ),
    },
    {
      name: 'Exploratory Data Analysis',
      description:
        'Statistical summaries, distributions, correlations, outlier detection, visualization',
      baseMinutes: BASE_EDA,
      estimatedMinutes: Math.round(
        (BASE_EDA + rowScaling + featureScaling * 3) * classificationBonus
      ),
    },
    {
      name: 'Feature Engineering',
      description:
        'Feature selection, encoding categorical variables, scaling, transformation',
      baseMinutes: BASE_FEATURE_ENG,
      estimatedMinutes: Math.round(
        (BASE_FEATURE_ENG + featureScaling * 4) * classificationBonus
      ),
    },
    {
      name: 'Model Selection & Training',
      description:
        'Comparing algorithms, training multiple models, initial parameter selection',
      baseMinutes: BASE_MODEL_SELECTION,
      estimatedMinutes: Math.round(
        (BASE_MODEL_SELECTION + rowScaling * 2 + featureScaling) *
          classificationBonus
      ),
    },
    {
      name: 'Hyperparameter Tuning',
      description:
        'Grid search, cross-validation, parameter optimization, model refinement',
      baseMinutes: BASE_HYPERPARAM,
      estimatedMinutes: Math.round(
        (BASE_HYPERPARAM + rowScaling * 3) * classificationBonus
      ),
    },
    {
      name: 'Validation & Testing',
      description:
        'Evaluating metrics, confusion matrices, ROC curves, final model assessment',
      baseMinutes: BASE_VALIDATION,
      estimatedMinutes: Math.round(
        (BASE_VALIDATION + featureScaling) * classificationBonus
      ),
    },
  ]

  const totalMinutes = breakdown.reduce(
    (sum, step) => sum + step.estimatedMinutes,
    0
  )
  const manualEstimateSeconds = totalMinutes * 60

  return {
    actualDuration: null, // Will be set by caller
    manualEstimate: manualEstimateSeconds,
    timeSaved: 0, // Will be calculated by caller
    efficiencyGain: 0, // Will be calculated by caller
    breakdown,
  }
}

/**
 * Compute benchmark data with actual training duration
 */
export function computeBenchmarkWithActual(
  params: BenchmarkCalculationParams,
  actualDurationSeconds: number | null
): BenchmarkData {
  const benchmark = calculateManualEffort(params)
  benchmark.actualDuration = actualDurationSeconds

  if (actualDurationSeconds !== null && actualDurationSeconds > 0) {
    benchmark.timeSaved = benchmark.manualEstimate - actualDurationSeconds
    benchmark.efficiencyGain =
      (benchmark.timeSaved / benchmark.manualEstimate) * 100
  }

  return benchmark
}
