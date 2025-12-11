import { useState, useRef, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-200 dark:border-t-gray-700 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-200 dark:border-b-gray-700 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-200 dark:border-l-gray-700 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-200 dark:border-r-gray-700 border-y-transparent border-l-transparent',
  }

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 ${positionClasses[position]}`}
          >
            <div className="relative bg-white dark:bg-gray-800 text-gray-700 dark:text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-xs whitespace-normal border border-gray-200 dark:border-gray-700">
              {content}
              <div
                className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Specialized tooltip for metrics with title and description
interface MetricTooltipProps {
  title: string
  description: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function MetricTooltip({
  title,
  description,
  children,
  position = 'top',
}: MetricTooltipProps) {
  return (
    <Tooltip
      position={position}
      content={
        <div className="min-w-[150px]">
          <div className="font-semibold mb-1">{title}</div>
          <div className="text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed">
            {description}
          </div>
        </div>
      }
    >
      {children}
    </Tooltip>
  )
}

// Pre-defined metric descriptions for common ML metrics
export const METRIC_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  accuracy: {
    title: 'Accuracy',
    description: 'The proportion of correct predictions out of all predictions. Best used when classes are balanced.',
  },
  precision: {
    title: 'Precision',
    description: 'Of all positive predictions, how many were actually positive. High precision = fewer false positives.',
  },
  recall: {
    title: 'Recall',
    description: 'Of all actual positives, how many were correctly predicted. High recall = fewer false negatives.',
  },
  f1: {
    title: 'F1 Score',
    description: 'Harmonic mean of precision and recall. Balances both metrics, useful for imbalanced classes.',
  },
  f1_score: {
    title: 'F1 Score',
    description: 'Harmonic mean of precision and recall. Balances both metrics, useful for imbalanced classes.',
  },
  roc_auc: {
    title: 'ROC AUC',
    description: 'Area under the ROC curve. Measures model\'s ability to distinguish classes. 1.0 is perfect, 0.5 is random.',
  },
  r2: {
    title: 'R-squared (R²)',
    description: 'Proportion of variance in the target explained by the model. 1.0 is perfect, 0 means model is no better than mean.',
  },
  r2_score: {
    title: 'R-squared (R²)',
    description: 'Proportion of variance in the target explained by the model. 1.0 is perfect, 0 means model is no better than mean.',
  },
  rmse: {
    title: 'RMSE',
    description: 'Root Mean Squared Error. Average prediction error in the same units as the target. Lower is better.',
  },
  mae: {
    title: 'MAE',
    description: 'Mean Absolute Error. Average absolute prediction error. Less sensitive to outliers than RMSE.',
  },
  mse: {
    title: 'MSE',
    description: 'Mean Squared Error. Average of squared prediction errors. Penalizes large errors more heavily.',
  },
  cv_mean: {
    title: 'CV Mean',
    description: 'Average score across all cross-validation folds. Indicates expected model performance on unseen data.',
  },
  cv_std: {
    title: 'CV Std',
    description: 'Standard deviation of cross-validation scores. Lower values indicate more stable/consistent model performance.',
  },
}

export default Tooltip
