import { createContext, useContext, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

interface TabsProps {
  defaultValue: string;
  value?: string;
  onChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value,
  onChange,
  children,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeTab = value ?? internalValue;

  const setActiveTab = (id: string) => {
    setInternalValue(id);
    onChange?.(id);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex p-1 rounded-lg",
        "bg-white/5 border border-white/10 backdrop-blur-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TabsTrigger({
  value,
  children,
  className,
  disabled,
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => !disabled && setActiveTab(value)}
      disabled={disabled}
      className={cn(
        "relative px-3 py-1.5 text-sm font-medium rounded-md",
        "transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isActive ? "text-white" : "text-gray-400 hover:text-white",
        className
      )}
    >
      {isActive && (
        <motion.div
          layoutId="active-tab"
          className={cn(
            "absolute inset-0 rounded-md",
            "bg-white/10 shadow-sm border border-white/10 backdrop-blur-md"
          )}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn("mt-4", className)}
    >
      {children}
    </motion.div>
  );
}

export default Tabs;
