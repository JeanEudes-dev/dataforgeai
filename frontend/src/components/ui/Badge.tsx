import { type HTMLAttributes } from "react";
import { cn } from "@/utils";

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
  primary:
    "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30",
  success:
    "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-100 dark:border-green-800/30",
  warning:
    "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-800/30",
  error:
    "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800/30",
  info: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/30",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-gray-500",
  primary: "bg-blue-500",
  success: "bg-green-500",
  warning: "bg-orange-500",
  error: "bg-red-500",
  info: "bg-indigo-500",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-[10px] font-medium rounded-md",
  md: "px-2 py-0.5 text-xs font-medium rounded-md",
  lg: "px-2.5 py-1 text-sm font-medium rounded-md",
};

export function Badge({
  className,
  variant = "default",
  size = "md",
  dot = false,
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            dotColors[variant],
            pulse && "animate-pulse"
          )}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
