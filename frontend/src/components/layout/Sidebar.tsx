import React from "react";
import { NavLink, useSearchParams, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  BarChart3,
  Cpu,
  FileText,
  MessageSquare,
  Settings,
  Layers,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/app/dashboard" },
  { icon: Database, label: "Datasets", href: "/app/datasets" },
  { icon: BarChart3, label: "EDA", href: "/app/eda" },
  { icon: Cpu, label: "Modeling", href: "/app/modeling" },
  { icon: Layers, label: "Predictions", href: "/app/predictions" },
  { icon: FileText, label: "Reports", href: "/app/reports" },
  { icon: MessageSquare, label: "Assistant", href: "/app/assistant" },
];

export const Sidebar: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const datasetId = searchParams.get("datasetId");

  // Helper to preserve query params
  const getHref = (baseHref: string) => {
    const params = new URLSearchParams();
    if (projectId) params.set("projectId", projectId);
    if (datasetId) params.set("datasetId", datasetId);
    const queryString = params.toString();
    return queryString ? `${baseHref}?${queryString}` : baseHref;
  };

  return (
    <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col shrink-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-border/50">
        <Link to="/app/projects" className="flex items-center gap-2 group">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            DataForge AI
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Main Menu
          </p>
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={getHref(item.href)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                    isActive
                      ? ""
                      : "text-muted-foreground/70 group-hover:text-foreground"
                  )}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border/50 bg-muted/5">
        <NavLink
          to="/app/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>

        <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
            Pro Plan
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Unlimited models & datasets
          </p>
          <Button
            variant="link"
            className="h-auto p-0 text-[11px] font-bold text-primary mt-2"
          >
            Upgrade Now
          </Button>
        </div>
      </div>
    </aside>
  );
};
