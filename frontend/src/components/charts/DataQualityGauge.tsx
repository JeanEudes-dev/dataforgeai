import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface DataQualityGaugeProps {
  score: number | null
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function DataQualityGauge({
  score,
  size = 'md',
  showLabel = true,
}: DataQualityGaugeProps) {
  const { displayScore, quality, color, bgColor, strokeWidth, radius, fontSize } = useMemo(() => {
    const normalizedScore = score !== null ? Math.min(100, Math.max(0, score)) : 0

    let quality = 'Unknown'
    let color = 'text-gray-400'
    let bgColor = 'stroke-gray-200 dark:stroke-gray-700'
    let progressColor = 'stroke-gray-400'

    if (score !== null) {
      if (normalizedScore >= 90) {
        quality = 'Excellent'
        color = 'text-green-500'
        progressColor = 'stroke-green-500'
      } else if (normalizedScore >= 75) {
        quality = 'Good'
        color = 'text-blue-500'
        progressColor = 'stroke-blue-500'
      } else if (normalizedScore >= 60) {
        quality = 'Fair'
        color = 'text-yellow-500'
        progressColor = 'stroke-yellow-500'
      } else if (normalizedScore >= 40) {
        quality = 'Poor'
        color = 'text-orange-500'
        progressColor = 'stroke-orange-500'
      } else {
        quality = 'Critical'
        color = 'text-red-500'
        progressColor = 'stroke-red-500'
      }
    }

    // Size configurations
    const sizeConfigs = {
      sm: { radius: 35, strokeWidth: 6, fontSize: { score: 'text-lg', label: 'text-xs' } },
      md: { radius: 50, strokeWidth: 8, fontSize: { score: 'text-2xl', label: 'text-sm' } },
      lg: { radius: 70, strokeWidth: 10, fontSize: { score: 'text-4xl', label: 'text-base' } },
    }

    const config = sizeConfigs[size]

    return {
      displayScore: normalizedScore,
      quality,
      color,
      bgColor,
      progressColor,
      strokeWidth: config.strokeWidth,
      radius: config.radius,
      fontSize: config.fontSize,
    }
  }, [score, size])

  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (displayScore / 100) * circumference

  const svgSize = (radius + strokeWidth) * 2

  if (score === null) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-gray-500 dark:text-gray-400">
        <span className="text-sm">Data quality score not available</span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center"
    >
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            className={bgColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            className={color.replace('text-', 'stroke-')}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`font-bold ${color} ${fontSize.score}`}
          >
            {displayScore.toFixed(0)}
          </motion.span>
          <span className="text-xs text-gray-500 dark:text-gray-400">/ 100</span>
        </div>
      </div>

      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-center"
        >
          <span className={`font-semibold ${color} ${fontSize.label}`}>{quality}</span>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Data Quality</p>
        </motion.div>
      )}
    </motion.div>
  )
}

export default DataQualityGauge
