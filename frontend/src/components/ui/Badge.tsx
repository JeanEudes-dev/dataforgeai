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
  default: "bg-white/10 text-gray-300 border border-white/10 backdrop-blur-sm",
  primary:
    "bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-sm shadow-[0_0_10px_rgba(59,130,246,0.2)]",
  success:
    "bg-green-500/20 text-green-300 border border-green-500/30 backdrop-blur-sm shadow-[0_0_10px_rgba(34,197,94,0.2)]",
  warning:
    "bg-orange-500/20 text-orange-300 border border-orange-500/30 backdrop-blur-sm shadow-[0_0_10px_rgba(249,115,22,0.2)]",
  error:
    "bg-red-500/20 text-red-300 border border-red-500/30 backdrop-blur-sm shadow-[0_0_10px_rgba(239,68,68,0.2)]",
  info: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-sm shadow-[0_0_10px_rgba(99,102,241,0.2)]",
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
