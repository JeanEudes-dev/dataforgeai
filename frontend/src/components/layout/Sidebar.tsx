import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "@heroicons/react/24/outline";
import { useTheme } from "@/contexts";
import { cn } from "@/utils";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: "/", label: "Dashboard", icon: HomeIcon },
  { path: "/datasets", label: "Datasets", icon: CircleStackIcon },
  { path: "/training/jobs", label: "Training", icon: CpuChipIcon },
  { path: "/models", label: "Models", icon: CubeIcon },
  { path: "/reports", label: "Reports", icon: DocumentTextIcon },
  { path: "/assistant", label: "AI Assistant", icon: ChatBubbleLeftRightIcon },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 240 : 68 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed left-0 top-0 h-screen z-40",
        "bg-surface/95 backdrop-blur-xl",
        "border-r border-subtle",
        "flex flex-col py-4"
      )}
    >
      {/* Logo */}
      <div className="h-12 flex items-center justify-between px-4 mb-6">
        <motion.div
          animate={{ opacity: isOpen ? 1 : 0 }}
          className="flex items-center gap-3 overflow-hidden"
        >
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-semibold shadow-sm">
            <span className="text-sm">D</span>
          </div>
          {isOpen && (
            <div className="leading-none">
              <h1 className="font-semibold text-primary text-sm tracking-tight">
                DataForge
              </h1>
            </div>
          )}
        </motion.div>

        <button
          onClick={onToggle}
          className={cn(
            "p-1.5 rounded-md text-muted",
            "hover:text-primary hover:bg-sunken",
            "transition-all duration-200",
            !isOpen && "mx-auto"
          )}
        >
          <motion.div
            animate={{ rotate: isOpen ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </motion.div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2 rounded-lg",
                "transition-all duration-200 outline-none",
                "focus-visible:ring-2 focus-visible:ring-primary-500/50",
                isActive
                  ? "text-white font-medium"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/60"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-primary-500 rounded-lg shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 relative z-10 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm relative z-10"
                >
                  {item.label}
                </motion.span>
              )}
              {!isOpen && (
                <div
                  className={cn(
                    "absolute left-full ml-2 px-2 py-1 rounded-md",
                    "bg-primary-950 text-white text-xs font-medium shadow-lg",
                    "opacity-0 group-hover:opacity-100",
                    "pointer-events-none transition-opacity duration-200",
                    "z-50 whitespace-nowrap"
                  )}
                >
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="px-2 mt-auto pt-4 border-t border-subtle">
        <button
          onClick={toggleTheme}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md",
            "text-secondary hover:text-primary",
            "hover:bg-sunken",
            "transition-all duration-200"
          )}
        >
          {theme === "dark" ? (
            <SunIcon className="w-5 h-5" />
          ) : (
            <MoonIcon className="w-5 h-5" />
          )}
          {isOpen && (
            <span className="text-sm">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}

export default Sidebar;
