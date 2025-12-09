import { type ReactNode } from 'react'
import { Dialog } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: ModalSize
  showClose?: boolean
  children: ReactNode
  footer?: ReactNode
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Full-screen container to center the panel */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
            <Dialog.Panel
              className={cn(
                'w-full rounded-2xl bg-surface',
                'border border-subtle shadow-[0_20px_70px_rgba(15,23,42,0.16)]',
                'overflow-hidden',
                sizeStyles[size]
              )}
            >
              {/* Header */}
              {(title || showClose) && (
                <div className="flex items-start justify-between px-6 py-4 border-b border-subtle">
                  <div>
                    {title && (
                      <Dialog.Title className="text-lg font-semibold text-primary">
                        {title}
                      </Dialog.Title>
                    )}
                    {description && (
                      <Dialog.Description className="mt-1 text-sm text-secondary">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  {showClose && (
                    <button
                      onClick={onClose}
                      className={cn(
                        'p-2 rounded-xl text-muted border border-transparent',
                        'hover:text-primary hover:bg-primary-50/70 hover:border-primary-100/60',
                        'transition-colors duration-200',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
                      )}
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="px-6 py-4 border-t border-subtle bg-sunken/50">
                  {footer}
                </div>
              )}
            </Dialog.Panel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}

export default Modal
