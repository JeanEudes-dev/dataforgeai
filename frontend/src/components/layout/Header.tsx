import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Transition } from '@headlessui/react'
import {
  Bars3Icon,
  PlusIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts'
import { cn } from '@/utils'

interface HeaderProps {
  onMenuClick: () => void
  title?: string
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 px-6 md:px-10 pt-6">
      <div className={cn(
        'h-16 px-4 md:px-6 flex items-center justify-between gap-4',
        'rounded-2xl bg-surface/85 backdrop-blur-xl',
        'border border-subtle',
        'shadow-[0_18px_70px_rgba(15,23,42,0.08)]'
      )}>
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className={cn(
              'p-2 rounded-xl text-muted lg:hidden border border-subtle',
              'hover:text-primary hover:border-primary-200 hover:bg-primary-50/70 dark:hover:bg-primary-900/15',
              'transition-colors duration-200'
            )}
          >
            <Bars3Icon className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-base md:text-lg font-semibold text-primary">
              {title || 'DataForge OS'}
            </h1>
            <p className="text-xs text-muted hidden sm:block">
              Calm, fast workspace for data, models, and reports
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Quick Upload Button */}
          <button
            onClick={() => navigate('/datasets')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl',
              'bg-gradient-to-r from-primary-500 via-primary-500 to-info-500 text-white',
              'shadow-[0_12px_30px_rgba(63,130,244,0.35)]',
              'hover:translate-y-[-1px] active:translate-y-0',
              'transition-all duration-200'
            )}
          >
            <PlusIcon className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Upload Dataset</span>
          </button>

          {/* User Menu */}
          <Menu as="div" className="relative">
            <Menu.Button
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl',
                'text-secondary hover:text-primary',
                'border border-subtle bg-surface',
                'hover:border-primary-200 hover:bg-primary-50/90 dark:hover:bg-primary-900/15',
                'transition-colors duration-200'
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                  {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-sm font-medium hidden md:inline">
                {user?.full_name || user?.email || 'User'}
              </span>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                className={cn(
                  'absolute right-0 mt-2 w-60 origin-top-right',
                  'rounded-2xl bg-surface',
                  'border border-subtle',
                  'shadow-[0_18px_60px_rgba(15,23,42,0.14)]',
                  'divide-y divide-subtle',
                  'focus:outline-none z-50'
                )}
              >
                {/* User info */}
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-primary">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {user?.email}
                  </p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => navigate('/settings')}
                        className={cn(
                          'flex items-center gap-3 w-full px-4 py-2 text-sm rounded-lg',
                          active ? 'bg-primary-50/70 dark:bg-primary-900/10 text-primary' : 'text-secondary'
                        )}
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                        Settings
                      </button>
                    )}
                  </Menu.Item>
                </div>

                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={cn(
                          'flex items-center gap-3 w-full px-4 py-2 text-sm rounded-lg',
                          active ? 'bg-error-50 text-error-600 dark:bg-error-500/10' : 'text-secondary'
                        )}
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  )
}

export default Header
