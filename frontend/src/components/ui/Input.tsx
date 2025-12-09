import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-primary mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-3 rounded-xl',
              'bg-surface/85 text-primary placeholder:text-muted',
              'border border-subtle',
              'shadow-[0_1px_2px_rgba(15,23,42,0.06)]',
              'transition-all duration-200',
              'focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              error && 'border-error-500 focus:border-error-500 focus:ring-error-500/20',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-error-500">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-muted">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
