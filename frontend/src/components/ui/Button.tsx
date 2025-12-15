import { forwardRef, type ButtonHTMLAttributes } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "glow";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onAnimationStart" | "onAnimationEnd" | "onDrag" | "onDragStart" | "onDragEnd"
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-transparent
    shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02]
    active:scale-[0.98] transition-all duration-200
  `,
  secondary: `
    glass text-white border border-white/10
    hover:bg-white/10 hover:border-white/20
    active:scale-[0.98] transition-all duration-200
  `,
  ghost: `
    bg-transparent text-gray-300
    hover:text-white hover:bg-white/5
    active:bg-white/10 active:scale-[0.98] transition-all duration-200
  `,
  danger: `
    bg-gradient-to-r from-red-600 to-rose-600 text-white border border-transparent
    shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.02]
    active:scale-[0.98] transition-all duration-200
  `,
  glow: `
    bg-white/10 text-white border border-white/20
    shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]
    hover:bg-white/20 hover:border-white/30
    active:scale-[0.98] transition-all duration-200
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs font-medium rounded-md",
  md: "px-4 py-2 text-sm font-medium rounded-lg",
  lg: "px-6 py-3 text-base font-medium rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 cursor-pointer",
          "font-medium tracking-tight transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={isDisabled}
        whileHover={isDisabled ? {} : { scale: 1.01 }}
        whileTap={isDisabled ? {} : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...(props as HTMLMotionProps<"button">)}
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
          <>
            {leftIcon && <span className="w-4 h-4">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="w-4 h-4">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
