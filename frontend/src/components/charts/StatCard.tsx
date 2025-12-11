import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  color?: "default" | "primary" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md" | "lg";
}

const colorStyles = {
  default: {
    bg: "bg-muted",
    icon: "bg-muted text-muted-foreground",
    accent: "text-foreground",
  },
  primary: {
    bg: "bg-primary-muted",
    icon: "bg-primary-muted text-primary",
    accent: "text-primary",
  },
  success: {
    bg: "bg-success-muted",
    icon: "bg-success-muted text-success",
    accent: "text-success",
  },
  warning: {
    bg: "bg-warning-muted",
    icon: "bg-warning-muted text-warning",
    accent: "text-warning",
  },
  error: {
    bg: "bg-error-muted",
    icon: "bg-error-muted text-error",
    accent: "text-error",
  },
  info: {
    bg: "bg-info-muted",
    icon: "bg-info-muted text-info",
    accent: "text-info",
  },
};

const sizeStyles = {
  sm: {
    padding: "p-4",
    title: "text-xs",
    value: "text-xl",
    icon: "w-8 h-8",
    iconInner: "w-4 h-4",
  },
  md: {
    padding: "p-5",
    title: "text-sm",
    value: "text-2xl",
    icon: "w-10 h-10",
    iconInner: "w-5 h-5",
  },
  lg: {
    padding: "p-6",
    title: "text-sm",
    value: "text-3xl",
    icon: "w-12 h-12",
    iconInner: "w-6 h-6",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "default",
  size = "md",
}: StatCardProps) {
  const colors = colorStyles[color];
  const sizes = sizeStyles[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 8px 25px -5px rgb(0 0 0 / 0.1)" }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-xl border border-subtle bg-surface",
        sizes.padding,
        "transition-all duration-200"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "font-medium text-muted-foreground mb-1",
              sizes.title
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              "font-bold text-foreground truncate",
              sizes.value
            )}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.value >= 0 ? "text-success" : "text-error"
                )}
              >
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              {trend.label && (
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "rounded-xl flex items-center justify-center shrink-0 ml-3",
              sizes.icon,
              colors.icon
            )}
          >
            <div className={sizes.iconInner}>{icon}</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default StatCard;
