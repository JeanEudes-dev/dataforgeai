import { motion } from 'framer-motion'
import { cn } from '@/utils'
import type { Insight } from '@/types'

interface InsightsPanelProps {
  insights: Insight[]
  maxItems?: number
}

const typeConfig: Record<string, { bg: string; icon: string; iconPath: string }> = {
  info: {
    bg: 'bg-info-50 border-info-200 dark:bg-info-900/30 dark:border-info-800',
    icon: 'bg-info-100 text-info-600 dark:bg-info-800 dark:text-info-300',
    iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  warning: {
    bg: 'bg-warning-50 border-warning-200 dark:bg-warning-900/30 dark:border-warning-800',
    icon: 'bg-warning-100 text-warning-600 dark:bg-warning-800 dark:text-warning-300',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  success: {
    bg: 'bg-success-50 border-success-200 dark:bg-success-900/30 dark:border-success-800',
    icon: 'bg-success-100 text-success-600 dark:bg-success-800 dark:text-success-300',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  error: {
    bg: 'bg-error-50 border-error-200 dark:bg-error-900/30 dark:border-error-800',
    icon: 'bg-error-100 text-error-600 dark:bg-error-800 dark:text-error-300',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
}

const defaultConfig = {
  bg: 'bg-gray-50 border-gray-200 dark:bg-gray-800/30 dark:border-gray-700',
  icon: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }

export function InsightsPanel({ insights, maxItems = 10 }: InsightsPanelProps) {
  // Sort by severity
  const sortedInsights = [...insights]
    .sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3))
    .slice(0, maxItems)

  if (sortedInsights.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No insights available yet
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {sortedInsights.map((insight, index) => {
        const config = typeConfig[insight.type] || defaultConfig

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border',
              config.bg
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                config.icon
              )}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={config.iconPath}
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{insight.message}</p>
              <div className="flex items-center gap-2 mt-2">
                {insight.column && (
                  <span className="text-xs px-2 py-0.5 rounded bg-surface text-muted-foreground">
                    {insight.column}
                  </span>
                )}
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded font-medium',
                    insight.severity === 'high'
                      ? 'bg-error-muted text-error'
                      : insight.severity === 'medium'
                      ? 'bg-warning-muted text-warning'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {insight.severity}
                </span>
              </div>
            </div>
          </motion.div>
        )
      })}

      {insights.length > maxItems && (
        <p className="text-center text-sm text-muted-foreground pt-2">
          +{insights.length - maxItems} more insights
        </p>
      )}
    </motion.div>
  )
}

export default InsightsPanel
