import { forwardRef, type HTMLAttributes } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'flat' | 'pressed'
  hoverable?: boolean
  clickable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const variantStyles = {
  elevated: 'border border-subtle bg-surface/95 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm',
  flat: 'border border-subtle bg-surface/90',
  pressed: 'border border-default bg-sunken shadow-[inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(15,23,42,0.06)]',
}

const paddingStyles = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'elevated',
      hoverable = false,
      clickable = false,
      padding = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const baseClassName = cn(
      'rounded-2xl',
      'transition-all duration-300',
      variantStyles[variant],
      paddingStyles[padding],
      hoverable && variant === 'elevated' && 'hover:shadow-[0_22px_70px_rgba(15,23,42,0.12)] hover:-translate-y-1',
      clickable && 'cursor-pointer',
      className
    )

    if (hoverable || clickable) {
      return (
        <motion.div
          ref={ref}
          className={baseClassName}
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={clickable ? { scale: 0.99 } : undefined}
          transition={{ type: 'spring' as const, stiffness: 400, damping: 17 }}
          {...(props as HTMLMotionProps<'div'>)}
        >
          {children}
        </motion.div>
      )
    }

    return (
      <div ref={ref} className={baseClassName} {...props}>
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Card sub-components
type CardHeaderProps = HTMLAttributes<HTMLDivElement>

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pb-4 border-b border-subtle', className)}
      {...props}
    />
  )
)

CardHeader.displayName = 'CardHeader'

type CardTitleProps = HTMLAttributes<HTMLHeadingElement>

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-primary', className)}
      {...props}
    />
  )
)

CardTitle.displayName = 'CardTitle'

type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-secondary mt-1', className)}
      {...props}
    />
  )
)

CardDescription.displayName = 'CardDescription'

type CardContentProps = HTMLAttributes<HTMLDivElement>

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
)

CardContent.displayName = 'CardContent'

type CardFooterProps = HTMLAttributes<HTMLDivElement>

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pt-4 mt-4 border-t border-subtle flex items-center gap-3', className)}
      {...props}
    />
  )
)

CardFooter.displayName = 'CardFooter'

export default Card
