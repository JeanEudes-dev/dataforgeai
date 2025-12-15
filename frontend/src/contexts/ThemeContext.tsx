import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getTheme, setTheme as saveTheme, type Theme } from "@/utils/storage";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Force dark mode
  const theme: Theme = "dark";

  // Apply theme class/attributes to the document so tailwind dark: styles work everywhere
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const appRoot = document.getElementById("root");

    const targets = [root, body, appRoot].filter(Boolean) as HTMLElement[];

    targets.forEach((el) => {
      el.classList.remove("light");
      el.classList.add("dark");
      el.dataset.theme = "dark";
      el.style.colorScheme = "dark";
    });
  }, []);

  const toggleTheme = useCallback(() => {
    // No-op
  }, []);

  const setTheme = useCallback((_theme: Theme) => {
    // No-op
  }, []);

  const value: ThemeContextType = {
    theme: "dark",
    toggleTheme,
    setTheme,
    isDark: true,
  };

  return (
    <ThemeContext.Provider value={value}>
      {/* Ensure dark mode class exists in the React tree for tailwind dark: utilities */}
      <div
        className="dark theme-root"
        data-theme="dark"
        style={{
          backgroundColor: "transparent", // Allow Aurora to show through if placed behind
          color: "var(--color-foreground-val)",
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeContext;
