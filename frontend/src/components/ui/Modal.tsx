import { type ReactNode } from "react";
import { Dialog } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "@/utils";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  showClose?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-4xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  showClose = true,
  children,
  footer,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          as="div"
          static
          open={isOpen}
          onClose={onClose}
          className="relative z-50"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Full-screen container to center the panel */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Dialog.Panel
                className={cn(
                  "w-full rounded-3xl glass-card",
                  "border border-border shadow-2xl",
                  "overflow-hidden relative",
                  sizeStyles[size]
                )}
              >
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -right-12 -top-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl" />
                  <div className="absolute -left-16 bottom-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
                </div>

                {/* Header */}
                {(title || showClose) && (
                  <div className="flex items-start justify-between px-8 py-6 border-b border-border bg-accent/5 relative">
                    <div>
                      {title && (
                        <Dialog.Title className="text-xl font-semibold text-foreground">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="mt-2 text-sm text-muted-foreground leading-relaxed">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    {showClose && (
                      <button
                        onClick={onClose}
                        className={cn(
                          "p-2 rounded-full text-muted-foreground",
                          "hover:text-foreground hover:bg-accent",
                          "transition-colors duration-200",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        )}
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="px-8 py-6 max-h-[65vh] overflow-y-auto scrollbar-thin text-foreground relative">
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="px-8 py-5 border-t border-border bg-accent/5">
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

export default Modal;
