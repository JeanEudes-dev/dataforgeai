import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-primary-500 via-primary-500 to-info-500 text-white
    shadow-[0_12px_30px_rgba(63,130,244,0.35)]
    hover:shadow-[0_16px_40px_rgba(63,130,244,0.28)]
    active:shadow-[0_10px_24px_rgba(63,130,244,0.25)]
  `,
  secondary: `
    bg-surface/80 text-primary border border-subtle
    shadow-[0_8px_24px_rgba(15,23,42,0.06)]
    hover:border-primary-200 hover:bg-primary-50/60
    hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]
    active:shadow-[0_8px_20px_rgba(15,23,42,0.05)]
  `,
  ghost: `
    bg-transparent text-secondary border border-transparent
    hover:text-primary hover:bg-primary-50/80 dark:hover:bg-primary-900/10
    active:bg-primary-100/80 dark:active:bg-primary-900/20
  `,
  danger: `
    bg-error-500 text-white
    hover:bg-error-600 active:bg-error-700
    shadow-[0_12px_30px_rgba(239,68,68,0.25)]
    hover:shadow-[0_14px_34px_rgba(239,68,68,0.3)]
  `,
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <motion.button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'font-medium tracking-tight transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={isDisabled}
        whileHover={isDisabled ? {} : { scale: 1.01, y: -1 }}
        whileTap={isDisabled ? {} : { scale: 0.98, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {isLoading ? (
          <svg
            className="w-4 h-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button
