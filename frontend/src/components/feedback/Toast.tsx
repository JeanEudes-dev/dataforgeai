import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  useToast,
  type Toast as ToastType,
  type ToastType as ToastVariant,
} from "@/contexts";
import { cn } from "@/utils";

const iconMap: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircleIcon className="w-5 h-5 text-success-500" />,
  error: <ExclamationCircleIcon className="w-5 h-5 text-error-500" />,
  warning: <ExclamationTriangleIcon className="w-5 h-5 text-warning-500" />,
  info: <InformationCircleIcon className="w-5 h-5 text-info-500" />,
};

const variantStyles: Record<ToastVariant, string> = {
  success: "bg-white",
  error: "bg-white",
  warning: "bg-white",
  info: "bg-white",
};

interface ToastItemProps {
  toast: ToastType;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg",
        "bg-white border border-subtle",
        "shadow-lg",
        variantStyles[toast.type]
      )}
    >
      <div className="flex-shrink-0">{iconMap[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary">{toast.title}</p>
        {toast.message && (
          <p className="mt-1 text-sm text-secondary">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className={cn(
          "flex-shrink-0 p-1 rounded-lg text-muted",
          "hover:text-primary hover:bg-sunken",
          "transition-colors duration-200"
        )}
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastContainer;
