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
  default: "bg-gray-100 text-gray-700 border border-gray-200",
  primary: "bg-blue-50 text-blue-700 border border-blue-100",
  success: "bg-green-50 text-green-700 border border-green-100",
  warning: "bg-orange-50 text-orange-700 border border-orange-100",
  error: "bg-red-50 text-red-700 border border-red-100",
  info: "bg-indigo-50 text-indigo-700 border border-indigo-100",
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
