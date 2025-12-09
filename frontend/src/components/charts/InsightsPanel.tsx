import { motion } from 'framer-motion'
import { cn } from '@/utils'
import type { Insight } from '@/types'

interface InsightsPanelProps {
  insights: Insight[]
  maxItems?: number
}

const typeConfig = {
  info: {
    bg: 'bg-info-50 border-info-200',
    icon: 'bg-info-100 text-info-600',
    iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  warning: {
    bg: 'bg-warning-50 border-warning-200',
    icon: 'bg-warning-100 text-warning-600',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  success: {
    bg: 'bg-success-50 border-success-200',
    icon: 'bg-success-100 text-success-600',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
}

const severityOrder = { high: 0, medium: 1, low: 2 }

export function InsightsPanel({ insights, maxItems = 10 }: InsightsPanelProps) {
  // Sort by severity
  const sortedInsights = [...insights]
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, maxItems)

  if (sortedInsights.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
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
        const config = typeConfig[insight.type]

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
              <p className="text-sm text-gray-800">{insight.message}</p>
              <div className="flex items-center gap-2 mt-2">
                {insight.column && (
                  <span className="text-xs px-2 py-0.5 rounded bg-white/60 text-gray-600">
                    {insight.column}
                  </span>
                )}
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded font-medium',
                    insight.severity === 'high'
                      ? 'bg-error-100 text-error-700'
                      : insight.severity === 'medium'
                      ? 'bg-warning-100 text-warning-700'
                      : 'bg-gray-100 text-gray-600'
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
        <p className="text-center text-sm text-gray-500 pt-2">
          +{insights.length - maxItems} more insights
        </p>
      )}
    </motion.div>
  )
}

export default InsightsPanel
