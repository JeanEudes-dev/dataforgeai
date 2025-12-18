import { motion } from "framer-motion";
import {
  DocumentTextIcon,
  ChartBarIcon,
  CpuChipIcon,
  ScaleIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/utils";
import type { ReportSection, EnhancedReport } from "@/types";

interface ReportNavigationProps {
  activeSection: ReportSection;
  onSectionChange: (section: ReportSection) => void;
  report: EnhancedReport;
}

interface NavItem {
  id: ReportSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
}

export function ReportNavigation({
  activeSection,
  onSectionChange,
  report,
}: ReportNavigationProps) {
  const hasEDA = !!report.content?.eda || !!report.report_metadata?.has_eda;
  const hasModel =
    !!report.content?.model || !!report.report_metadata?.has_model;
  const hasComparison = (report.model_comparison?.length ?? 0) > 1;
  const hasInsights =
    (report.content?.eda?.insights?.length ?? 0) > 0 || !!report.ai_summary;

  const navItems: NavItem[] = [
    {
      id: "overview",
      label: "Overview",
      icon: DocumentTextIcon,
      available: true,
    },
    {
      id: "eda",
      label: "EDA",
      icon: ChartBarIcon,
      available: hasEDA,
    },
    {
      id: "model",
      label: "Model",
      icon: CpuChipIcon,
      available: hasModel,
    },
    {
      id: "comparison",
      label: "Compare",
      icon: ScaleIcon,
      available: hasComparison,
    },
    {
      id: "insights",
      label: "Insights",
      icon: LightBulbIcon,
      available: hasInsights,
    },
  ];

  const availableItems = navItems.filter((item) => item.available);

  return (
    <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3 -mx-1 px-1 border-b border-border rounded-2xl">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {availableItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors",
                isActive
                  ? "text-muted-foreground backdrop-blur-md  shadow-sm"
                  : "text-muted-foreground border border-transparent hover:border-border hover:bg-muted"
              )}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}

export default ReportNavigation;
