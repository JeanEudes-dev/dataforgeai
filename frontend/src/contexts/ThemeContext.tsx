import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { getTheme, setTheme as saveTheme, type Theme } from '@/utils/storage'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => getTheme())

  // Apply theme class/attributes to the document so tailwind dark: styles work everywhere
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    const appRoot = document.getElementById('root')
    const isDark = theme === 'dark'

    const targets = [root, body, appRoot].filter(Boolean) as HTMLElement[]

    targets.forEach((el) => {
      el.classList.remove('dark')
      el.dataset.theme = theme
      if (isDark) el.classList.add('dark')
    })

    // Also set color-scheme for native elements
    targets.forEach((el) => {
      el.style.colorScheme = theme
    })
  }, [theme])

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't explicitly set a preference
      const stored = localStorage.getItem('dataforge_theme')
      if (!stored) {
        setThemeState(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    saveTheme(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark',
  }

  return (
    <ThemeContext.Provider value={value}>
      {/* Ensure dark mode class exists in the React tree for tailwind dark: utilities */}
      <div
        className={theme === 'dark' ? 'dark theme-root' : 'theme-root'}
        data-theme={theme}
        style={{
          backgroundColor: 'var(--color-background-val)',
          color: 'var(--color-foreground-val)',
          minHeight: '100vh',
          transition: 'background-color 150ms ease, color 150ms ease',
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext
