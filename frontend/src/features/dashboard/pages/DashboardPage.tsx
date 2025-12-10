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
    title: 'Upload dataset',
    description: 'Bring your CSV or Excel file into the workspace.',
    icon: CloudArrowUpIcon,
    path: '/datasets',
  },
  {
    id: 2,
    title: 'Analyze data',
    description: 'Run automated EDA for fast profiling.',
    icon: ChartBarIcon,
    path: '/datasets',
  },
  {
    id: 3,
    title: 'Train models',
    description: 'AutoML searches and benchmarks candidates.',
    icon: CpuChipIcon,
    path: '/training/jobs',
  },
  {
    id: 4,
    title: 'Generate reports',
    description: 'Share insights with stakeholders.',
    icon: DocumentTextIcon,
    path: '/reports',
  },
]

const quickActions = [
  { label: 'Upload dataset', path: '/datasets', primary: true },
  { label: 'View models', path: '/models', primary: false },
  { label: 'Generate report', path: '/reports', primary: false },
  { label: 'AI assistant', path: '/assistant', primary: false },
]

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-white to-gray-50" />
          <div className="relative px-6 py-6 flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.08em] text-gray-500">DataForge cockpit</p>
              <h1 className="text-3xl font-semibold text-gray-900">
                Welcome back, {user?.first_name || 'there'}.
              </h1>
              <p className="text-sm text-gray-500 max-w-2xl">
                Launch analysis, automate training, and ship reports from one calm workspace.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/datasets">
                  <Button
                    leftIcon={<CloudArrowUpIcon className="w-4 h-4" />}
                  >
                    Upload data
                  </Button>
                </Link>
                <Link to="/assistant">
                  <Button
                    variant="secondary"
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
                { label: 'Reports', value: '-', hint: 'Share insights' },
                { label: 'Automation', value: 'Live', hint: 'Pipelines healthy' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-gray-200 bg-white/80 p-3 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.12)]"
                >
                  <p className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</p>
                  <p className="text-xl font-semibold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Workflow Steps */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Getting started</h2>
          <p className="text-sm text-gray-500">A guided flow to ship analysis faster</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowSteps.map((step) => (
            <Link key={step.id} to={step.path}>
              <Card hoverable className="h-full border border-gray-200 shadow-sm">
                <CardContent className="flex flex-col items-start p-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-700">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-semibold text-gray-500 tracking-wide uppercase">Step {step.id}</div>
                  <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-gray-50">
            <CardTitle>Quick actions</CardTitle>
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          { label: 'Total datasets', value: '-', hint: 'Upload to get started' },
          { label: 'Trained models', value: '-', hint: 'Train your first model' },
          { label: 'Reports generated', value: '-', hint: 'Share a report' },
        ].map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden border border-gray-200 shadow-sm">
            <CardContent className="p-6 space-y-2">
              <p className="text-sm text-gray-500 uppercase tracking-wide">{stat.label}</p>
              <p className="text-3xl font-semibold text-gray-900 mt-1">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.hint}</p>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className={cn('h-full rounded-full bg-primary-500 w-1/5')} />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  )
}

export default DashboardPage
