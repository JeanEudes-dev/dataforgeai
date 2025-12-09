import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts'
import { Spinner } from '@/components/ui'
import { cn } from '@/utils'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className={cn(
        'min-h-screen flex items-center justify-center',
        'bg-base'
      )}>
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login while saving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
