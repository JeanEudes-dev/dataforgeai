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
} from "@heroicons/react/24/outline";
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

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 240 : 68 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed left-0 top-0 h-screen z-40",
        "glass-sidebar",
        "flex flex-col py-4 text-foreground"
      )}
    >
      {/* Logo */}
      <div className="h-12 flex items-center justify-between px-4 mb-6">
        <motion.div
          animate={{ opacity: isOpen ? 1 : 0 }}
          className="flex items-center gap-3 overflow-hidden"
        >
          <img src="/Icon.png" alt="DataForge AI" className="w-8 h-8" />
          {isOpen && (
            <div className="leading-none">
              <h1 className="font-bold text-lg tracking-tight text-gradient bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                DataForge
              </h1>
            </div>
          )}
        </motion.div>

        <button
          onClick={onToggle}
          className={cn(
            "p-1.5 rounded-md text-muted-foreground",
            "hover:text-muted-foreground hover:bg-accent/50",
            "transition-all duration-200",
            !isOpen && "mx-auto"
          )}
        >
          <motion.div
            animate={{ rotate: isOpen ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeftIcon className="w-4 h-4 text-muted-foreground" />
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
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl mx-2",
                "transition-all duration-300 outline-none overflow-hidden",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-blue-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-white/10 rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
              <item.icon
                className={cn(
                  "w-5 h-5 shrink-0 relative z-10 transition-colors duration-300"
                )}
              />
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-medium text-sm relative z-10"
                >
                  {item.label}
                </motion.span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </motion.aside>
  );
}

export default Sidebar;
