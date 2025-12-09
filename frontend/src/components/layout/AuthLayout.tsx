import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/utils'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-primary-200/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-primary-300/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 25 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-primary">DataForge</h1>
              <span className="text-sm text-primary-500 font-medium">AI</span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className={cn(
          'rounded-2xl p-8',
          'bg-surface',
          'shadow-[8px_8px_16px_var(--shadow-dark),-8px_-8px_16px_var(--shadow-light)]'
        )}>
          <Outlet />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted mt-6">
          Automated data analytics and machine learning
        </p>
      </motion.div>
    </div>
  )
}

export default AuthLayout
