import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { cn } from '@/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        'rounded-2xl border border-dashed border-subtle/80 bg-surface/80',
        'shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm',
        className
      )}
    >
      {icon && (
        <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-primary-50 to-info-50 dark:from-primary-900/30 dark:to-info-900/20 flex items-center justify-center text-primary shadow-[0_12px_30px_rgba(63,130,244,0.12)]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
      <p className="text-secondary max-w-sm mb-6">{description}</p>
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default EmptyState
