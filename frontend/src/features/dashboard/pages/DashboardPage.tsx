import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CloudArrowUpIcon,
  ChartBarIcon,
  CpuChipIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "@/components/ui";
import { useAuth } from "@/contexts";
import { dashboardApi } from "@/api";
import { cn } from "@/utils";

const workflowSteps = [
  {
    id: 1,
    title: "Upload dataset",
    description: "Bring your CSV or Excel file into the workspace.",
    icon: CloudArrowUpIcon,
    path: "/datasets",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    id: 2,
    title: "Analyze data",
    description: "Run automated EDA for fast profiling.",
    icon: ChartBarIcon,
    path: "/datasets",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    id: 3,
    title: "Train models",
    description: "AutoML searches and benchmarks candidates.",
    icon: CpuChipIcon,
    path: "/training/jobs",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    id: 4,
    title: "Generate reports",
    description: "Share insights with stakeholders.",
    icon: DocumentTextIcon,
    path: "/reports",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
];

const quickActions = [
  { label: "Upload dataset", path: "/datasets", primary: true },
  { label: "View models", path: "/models", primary: false },
  { label: "Generate report", path: "/reports", primary: false },
  { label: "AI assistant", path: "/assistant", primary: false },
];

export function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardApi.getStats,
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Hero */}
      <motion.div variants={item}>
        <Card variant="premium" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

          <div className="relative px-8 py-10 flex flex-wrap items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-blue-300 uppercase tracking-wider">
                  DataForge Cockpit
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Welcome back,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  {user?.first_name || "there"}
                </span>
              </h1>

              <p className="text-lg text-gray-300 leading-relaxed">
                Launch analysis, automate training, and ship reports from one
                unified workspace. Your data journey starts here.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link to="/datasets">
                  <Button
                    size="lg"
                    leftIcon={<CloudArrowUpIcon className="w-5 h-5" />}
                    className="shadow-blue-500/25"
                  >
                    Upload Data
                  </Button>
                </Link>
                <Link to="/assistant">
                  <Button
                    variant="secondary"
                    size="lg"
                    rightIcon={
                      <SparklesIcon className="w-5 h-5 text-yellow-400" />
                    }
                  >
                    Ask AI Assistant
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Grid in Hero */}
            <div className="grid grid-cols-2 gap-4 min-w-[280px]">
              {[
                {
                  label: "Datasets",
                  value: isLoading ? "-" : (stats?.datasets_count ?? 0),
                  hint: "Ready for ingestion",
                  color: "text-blue-400",
                },
                {
                  label: "Models",
                  value: isLoading ? "-" : (stats?.models_count ?? 0),
                  hint: "Train to unlock",
                  color: "text-purple-400",
                },
                {
                  label: "Reports",
                  value: isLoading ? "-" : (stats?.reports_count ?? 0),
                  hint: "Share insights",
                  color: "text-pink-400",
                },
                {
                  label: "Automation",
                  value: "Live",
                  hint: "Pipelines healthy",
                  color: "text-green-400",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md p-4 hover:bg-white/5 transition-colors"
                >
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                    {stat.label}
                  </p>
                  <p className={cn("text-2xl font-bold mt-1", stat.color)}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Workflow Steps */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Getting Started</h2>
            <p className="text-gray-400 mt-1">
              A guided flow to ship analysis faster
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((step) => (
            <Link key={step.id} to={step.path} className="block h-full">
              <Card
                hoverable
                variant="elevated"
                className="h-full border-white/5 bg-white/5 hover:bg-white/10"
              >
                <CardContent className="flex flex-col items-start p-6 space-y-4">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center mb-2",
                      step.bg,
                      step.color
                    )}
                  >
                    <step.icon className="w-7 h-7" />
                  </div>

                  <div>
                    <div className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-1">
                      Step {step.id}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <Card variant="flat" className="bg-white/5 border-white/5">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-white text-lg m-0">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              {quickActions.map((action) => (
                <Link key={action.path} to={action.path}>
                  <Button
                    variant={action.primary ? "glow" : "secondary"}
                    rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                    className={
                      action.primary
                        ? "bg-blue-500/20 border-blue-500/30 text-blue-100"
                        : ""
                    }
                  >
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default DashboardPage;
