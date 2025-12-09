import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HomeIcon,
  CircleStackIcon,
  CpuChipIcon,
  CubeIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline'
import { useTheme } from '@/contexts'
import { cn } from '@/utils'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: HomeIcon },
  { path: '/datasets', label: 'Datasets', icon: CircleStackIcon },
  { path: '/training/jobs', label: 'Training', icon: CpuChipIcon },
  { path: '/models', label: 'Models', icon: CubeIcon },
  { path: '/reports', label: 'Reports', icon: DocumentTextIcon },
  { path: '/assistant', label: 'AI Assistant', icon: ChatBubbleLeftRightIcon },
]

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 256 : 72 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'fixed left-0 top-0 h-screen z-40',
        'bg-surface/85 backdrop-blur-xl',
        'border-r border-subtle',
        'shadow-[0_20px_80px_rgba(15,23,42,0.12)]',
        'flex flex-col px-2'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-subtle/80">
        <motion.div
          animate={{ opacity: isOpen ? 1 : 0 }}
          className="flex items-center gap-3 overflow-hidden"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-500 to-info-500 flex items-center justify-center text-white font-semibold shadow-[0_12px_30px_rgba(63,130,244,0.35)]">
            <span className="text-lg">D</span>
          </div>
          {isOpen && (
            <div className="leading-tight">
              <h1 className="font-semibold text-primary text-lg">DataForge</h1>
              <span className="text-xs text-muted">Cortex Workspace</span>
            </div>
          )}
        </motion.div>

        <button
          onClick={onToggle}
          className={cn(
            'p-2 rounded-xl text-muted',
            'hover:text-primary hover:bg-primary-50/70 dark:hover:bg-primary-900/10',
            'transition-all duration-200',
            !isOpen && 'mx-auto'
          )}
        >
          <motion.div
            animate={{ rotate: isOpen ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </motion.div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl overflow-hidden',
                'transition-all duration-200',
                isActive
                  ? 'text-white'
                  : 'text-secondary hover:text-primary'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className={cn(
                    'absolute inset-0 rounded-xl',
                    'bg-gradient-to-r from-primary-500/95 via-primary-500/85 to-info-500/85',
                    'shadow-[0_10px_30px_rgba(63,130,244,0.25)]'
                  )}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className="w-5 h-5 flex-shrink-0 relative z-10" />
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-medium relative z-10"
                >
                  {item.label}
                </motion.span>
              )}
              {!isOpen && (
                <div className={cn(
                  'absolute left-full ml-2 px-2.5 py-1.5 rounded-lg',
                  'bg-surface/95 border border-subtle shadow-[0_12px_30px_rgba(15,23,42,0.15)] backdrop-blur-md',
                  'text-sm font-medium whitespace-nowrap text-primary',
                  'opacity-0 group-hover:opacity-100',
                  'pointer-events-none transition-opacity duration-200',
                  'z-50'
                )}
                >
                  {item.label}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="p-3 border-t border-subtle/80">
        <button
          onClick={toggleTheme}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
            'text-secondary hover:text-primary',
            'hover:bg-primary-50/80 dark:hover:bg-primary-900/15',
            'border border-transparent hover:border-primary-100/80',
            'transition-all duration-200'
          )}
        >
          {theme === 'dark' ? (
            <SunIcon className="w-5 h-5" />
          ) : (
            <MoonIcon className="w-5 h-5" />
          )}
          {isOpen && (
            <span className="text-sm font-medium">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>
      </div>
    </motion.aside>
  )
}

export default Sidebar
