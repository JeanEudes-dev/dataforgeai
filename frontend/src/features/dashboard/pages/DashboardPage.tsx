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
    color: 'from-primary-400 to-primary-600',
  },
  {
    id: 2,
    title: 'Analyze Data',
    description: 'Get automated EDA insights',
    icon: ChartBarIcon,
    path: '/datasets',
    color: 'from-blue-400 to-blue-600',
  },
  {
    id: 3,
    title: 'Train Models',
    description: 'Auto-train ML models',
    icon: CpuChipIcon,
    path: '/training/jobs',
    color: 'from-purple-400 to-purple-600',
  },
  {
    id: 4,
    title: 'Generate Reports',
    description: 'Create analysis reports',
    icon: DocumentTextIcon,
    path: '/reports',
    color: 'from-green-400 to-green-600',
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
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-primary">
          Welcome back, {user?.first_name || 'there'}!
        </h1>
        <p className="text-secondary mt-1">
          Let's analyze some data and build models.
        </p>
      </motion.div>

      {/* Workflow Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold text-primary mb-4">Getting Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowSteps.map((step) => (
            <Link key={step.id} to={step.path}>
              <Card hoverable className="h-full">
                <CardContent className="flex flex-col items-center text-center p-6">
                  <div
                    className={cn(
                      'w-14 h-14 rounded-2xl flex items-center justify-center mb-4',
                      'bg-gradient-to-br shadow-lg',
                      step.color
                    )}
                  >
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-sm font-medium text-muted mb-2">Step {step.id}</div>
                  <h3 className="font-semibold text-primary mb-1">{step.title}</h3>
                  <p className="text-sm text-secondary">{step.description}</p>
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
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted uppercase tracking-wide">Total Datasets</p>
            <p className="text-3xl font-bold text-primary mt-1">-</p>
            <p className="text-sm text-secondary mt-1">Upload to get started</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted uppercase tracking-wide">Trained Models</p>
            <p className="text-3xl font-bold text-primary mt-1">-</p>
            <p className="text-sm text-secondary mt-1">Train your first model</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted uppercase tracking-wide">Reports Generated</p>
            <p className="text-3xl font-bold text-primary mt-1">-</p>
            <p className="text-sm text-secondary mt-1">Generate a report</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default DashboardPage
