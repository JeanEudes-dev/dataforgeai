import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/utils'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-base app-shell flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, type: 'spring', stiffness: 320, damping: 28 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-500 to-info-500 flex items-center justify-center text-white font-semibold">
              D
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-semibold text-primary leading-tight">DataForge</h1>
              <span className="text-sm text-muted font-medium">Calm AI workspace</span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className={cn(
          'rounded-2xl p-8 glass',
          'border border-subtle shadow-[0_20px_70px_rgba(15,23,42,0.12)]'
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
