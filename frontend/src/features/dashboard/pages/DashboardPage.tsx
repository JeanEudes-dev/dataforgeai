import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CloudArrowUpIcon,
  ChartBarIcon,
  CpuChipIcon,
  DocumentTextIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import { useAuth } from '@/contexts'
import { cn } from '@/utils'

const workflowSteps = [
  {
    id: 1,
    title: 'Upload Dataset',
    description: 'Upload your CSV or Excel file',
    icon: CloudArrowUpIcon,
    path: '/datasets',
    color: 'from-primary-500 to-info-500',
  },
  {
    id: 2,
    title: 'Analyze Data',
    description: 'Get automated EDA insights',
    icon: ChartBarIcon,
    path: '/datasets',
    color: 'from-info-400 to-info-600',
  },
  {
    id: 3,
    title: 'Train Models',
    description: 'Auto-train ML models',
    icon: CpuChipIcon,
    path: '/training/jobs',
    color: 'from-primary-600 to-primary-800',
  },
  {
    id: 4,
    title: 'Generate Reports',
    description: 'Create analysis reports',
    icon: DocumentTextIcon,
    path: '/reports',
    color: 'from-success-500 to-success-600',
  },
]

const quickActions = [
  { label: 'Upload Dataset', path: '/datasets', primary: true },
  { label: 'View Models', path: '/models', primary: false },
  { label: 'Generate Report', path: '/reports', primary: false },
  { label: 'AI Assistant', path: '/assistant', primary: false },
]

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          variant="elevated"
          className="relative overflow-hidden border-none bg-gradient-to-r from-primary-500 via-primary-500 to-info-500 text-white shadow-[0_28px_90px_rgba(63,130,244,0.35)]"
        >
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 relative z-10">
              <div className="space-y-3">
                <p className="text-white/70 text-sm">DataForge cockpit</p>
                <h1 className="text-3xl font-semibold">
                  Welcome back, {user?.first_name || 'there'}.
                </h1>
                <p className="text-white/80 max-w-2xl">
                  Spin up analysis, train models, and generate reports without leaving this calm workspace.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Link to="/datasets">
                    <Button
                      variant="secondary"
                      className="bg-white/90 text-primary-700 hover:text-primary-800 border-none shadow-[0_14px_40px_rgba(255,255,255,0.25)]"
                      leftIcon={<CloudArrowUpIcon className="w-4 h-4" />}
                    >
                      Upload data
                    </Button>
                  </Link>
                  <Link to="/assistant">
                    <Button
                      variant="ghost"
                      className="text-white hover:bg-white/10 border-white/10"
                      rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                    >
                      Open assistant
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 min-w-[240px]">
                {[
                  { label: 'Datasets', value: '-', hint: 'Ready for ingestion' },
                  { label: 'Models', value: '-', hint: 'Train to unlock' },
                  { label: 'Reports', value: '-', hint: 'Share with stakeholders' },
                  { label: 'Automation', value: 'Live', hint: 'Pipelines healthy' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl bg-white/15 backdrop-blur-md p-3 border border-white/25 text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
                  >
                    <p className="text-xs uppercase tracking-wide text-white/70">{stat.label}</p>
                    <p className="text-xl font-semibold mt-1">{stat.value}</p>
                    <p className="text-xs text-white/70">{stat.hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -right-6 -top-10 w-64 h-64 bg-white/15 rounded-full blur-3xl" />
            <div className="absolute -left-10 bottom-0 w-60 h-60 bg-black/10 rounded-full blur-3xl" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Workflow Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary">Getting Started</h2>
          <p className="text-sm text-muted">A guided flow to ship analysis faster</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowSteps.map((step) => (
            <Link key={step.id} to={step.path}>
              <Card hoverable className="h-full border border-subtle hover:border-primary-100/90 transition-colors duration-200">
                <CardContent className="flex flex-col items-center text-center p-6 space-y-3">
                  <div
                    className={cn(
                      'w-14 h-14 rounded-2xl flex items-center justify-center',
                      'bg-gradient-to-br shadow-[0_12px_30px_rgba(63,130,244,0.16)]',
                      step.color
                    )}
                  >
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-xs font-medium text-muted tracking-wide uppercase">Step {step.id}</div>
                  <h3 className="font-semibold text-primary">{step.title}</h3>
                  <p className="text-sm text-secondary max-w-[200px]">{step.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {quickActions.map((action) => (
                <Link key={action.path} to={action.path}>
                  <Button
                    variant={action.primary ? 'primary' : 'secondary'}
                    rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                  >
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          { label: 'Total Datasets', value: '-', hint: 'Upload to get started' },
          { label: 'Trained Models', value: '-', hint: 'Train your first model' },
          { label: 'Reports Generated', value: '-', hint: 'Generate a report' },
        ].map((stat, index) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <CardContent className="p-6 space-y-2">
              <p className="text-sm text-muted uppercase tracking-wide">{stat.label}</p>
              <p className="text-3xl font-semibold text-primary mt-1">{stat.value}</p>
              <p className="text-sm text-secondary">{stat.hint}</p>
              <div className="h-2 rounded-full bg-sunken overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    index === 0 && 'bg-gradient-to-r from-primary-500 to-info-500 w-1/3',
                    index === 1 && 'bg-gradient-to-r from-info-500 to-primary-700 w-1/4',
                    index === 2 && 'bg-gradient-to-r from-success-500 to-success-600 w-1/5'
                  )}
                />
              </div>
            </CardContent>
            <div className="absolute -right-6 -bottom-10 w-32 h-32 bg-primary-50/60 dark:bg-primary-900/15 rounded-full blur-3xl" />
          </Card>
        ))}
      </motion.div>
    </div>
  )
}

export default DashboardPage
