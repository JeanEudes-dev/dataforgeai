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
        'bg-surface',
        'shadow-[5px_0_10px_var(--shadow-dark)]',
        'flex flex-col'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-subtle">
        <motion.div
          animate={{ opacity: isOpen ? 1 : 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          {isOpen && (
            <div>
              <h1 className="font-bold text-primary leading-tight">DataForge</h1>
              <span className="text-xs text-primary-500">AI</span>
            </div>
          )}
        </motion.div>

        <button
          onClick={onToggle}
          className={cn(
            'p-2 rounded-lg text-muted',
            'hover:text-primary hover:bg-sunken',
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
                'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                'transition-all duration-200',
                'group relative',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-secondary hover:text-primary'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className={cn(
                    'absolute inset-0 rounded-xl',
                    'bg-primary-50 dark:bg-primary-900/20',
                    'shadow-[inset_2px_2px_4px_var(--shadow-dark),inset_-2px_-2px_4px_var(--shadow-light)]'
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
                  'absolute left-full ml-2 px-2 py-1 rounded-lg',
                  'bg-surface shadow-lg',
                  'text-sm font-medium whitespace-nowrap',
                  'opacity-0 group-hover:opacity-100',
                  'pointer-events-none transition-opacity duration-200',
                  'z-50'
                )}>
                  {item.label}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="p-3 border-t border-subtle">
        <button
          onClick={toggleTheme}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
            'text-secondary hover:text-primary',
            'hover:bg-sunken transition-all duration-200'
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
