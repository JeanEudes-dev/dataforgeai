import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { Button, Input } from '@/components/ui'
import { useAuth, useToastActions } from '@/contexts'
import { getErrorMessage } from '@/api'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const toast = useToastActions()
  const [isLoading, setIsLoading] = useState(false)

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      await login(data)
      toast.success('Welcome back!', 'You have been logged in successfully.')
      navigate(from, { replace: true })
    } catch (error) {
      toast.error('Login failed', getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-primary">Welcome back</h2>
        <p className="text-secondary mt-1">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<EnvelopeIcon className="w-5 h-5" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          leftIcon={<LockClosedIcon className="w-5 h-5" />}
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-secondary">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}

export default LoginPage
