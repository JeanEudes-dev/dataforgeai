import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import { cn } from "@/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        "rounded-xl border border-dashed border-subtle bg-surface/50",
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 mb-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
      <p className="text-secondary max-w-sm mb-6">{description}</p>
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && <Button onClick={action.onClick}>{action.label}</Button>}
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default EmptyState;
