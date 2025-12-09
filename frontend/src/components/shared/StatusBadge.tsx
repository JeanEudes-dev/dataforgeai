import { Badge } from '@/components/ui'

type Status =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'running'
  | 'generating'
  | 'ready'
  | 'completed'
  | 'error'
  | 'cancelled'

interface StatusBadgeProps {
  status: Status
  showIcon?: boolean
  className?: string
}

const statusConfig: Record<Status, {
  label: string
  variant: 'default' | 'primary' | 'success' | 'warning' | 'error'
  pulse: boolean
}> = {
  pending: { label: 'Pending', variant: 'primary', pulse: false },
  uploading: { label: 'Uploading', variant: 'primary', pulse: true },
  processing: { label: 'Processing', variant: 'primary', pulse: true },
  running: { label: 'Running', variant: 'primary', pulse: true },
  generating: { label: 'Generating', variant: 'primary', pulse: true },
  ready: { label: 'Ready', variant: 'success', pulse: false },
  completed: { label: 'Completed', variant: 'success', pulse: false },
  error: { label: 'Error', variant: 'error', pulse: false },
  cancelled: { label: 'Cancelled', variant: 'default', pulse: false },
}

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending

  return (
    <Badge
      variant={config.variant}
      dot={showIcon}
      pulse={config.pulse}
      className={className}
    >
      {config.label}
    </Badge>
  )
}

export default StatusBadge
