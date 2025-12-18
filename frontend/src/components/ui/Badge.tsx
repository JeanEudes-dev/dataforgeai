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
    "bg-muted text-muted-foreground border border-border backdrop-blur-sm",
  primary:
    "bg-primary/10 text-muted-foreground border border-primary/20 backdrop-blur-sm shadow-sm",
  success:
    "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 backdrop-blur-sm shadow-sm",
  warning:
    "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 backdrop-blur-sm shadow-sm",
  error:
    "bg-destructive/10 text-destructive border border-destructive/20 backdrop-blur-sm shadow-sm",
  info: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-sm shadow-sm",
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
