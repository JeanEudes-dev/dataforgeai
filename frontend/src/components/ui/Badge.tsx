import { type HTMLAttributes } from 'react'
import { cn } from '@/utils'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  pulse?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface/70 text-secondary border border-subtle shadow-[0_1px_2px_rgba(15,23,42,0.05)]',
  primary: 'bg-primary-50 text-primary-700 border border-primary-100 dark:bg-primary-900/25 dark:text-primary-200 dark:border-primary-900/40',
  success: 'bg-success-50 text-success-700 border border-success-100 dark:bg-success-900/25 dark:text-success-200 dark:border-success-900/40',
  warning: 'bg-warning-50 text-warning-700 border border-warning-100 dark:bg-warning-900/25 dark:text-warning-200 dark:border-warning-900/40',
  error: 'bg-error-50 text-error-700 border border-error-100 dark:bg-error-900/25 dark:text-error-200 dark:border-error-900/40',
  info: 'bg-info-50 text-info-700 border border-info-100 dark:bg-info-900/25 dark:text-info-200 dark:border-info-900/40',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-neutral-500',
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  info: 'bg-info-500',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-xs',
  lg: 'px-2.5 py-1 text-sm',
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            dotColors[variant],
            pulse && 'animate-pulse'
          )}
        />
      )}
      {children}
    </span>
  )
}

export default Badge
