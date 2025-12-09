import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline'
import { Button, Input } from '@/components/ui'
import { useAuth, useToastActions } from '@/contexts'
import { getErrorMessage } from '@/api'

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string(),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ['password_confirm'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const toast = useToastActions()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      await registerUser(data)
      toast.success('Account created!', 'Welcome to DataForge AI.')
      navigate('/', { replace: true })
    } catch (error) {
      toast.error('Registration failed', getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-primary">Create your account</h2>
        <p className="text-secondary mt-1">Start analyzing your data today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            placeholder="John"
            leftIcon={<UserIcon className="w-5 h-5" />}
            error={errors.first_name?.message}
            {...register('first_name')}
          />

          <Input
            label="Last name"
            placeholder="Doe"
            error={errors.last_name?.message}
            {...register('last_name')}
          />
        </div>

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
          placeholder="Create a password"
          leftIcon={<LockClosedIcon className="w-5 h-5" />}
          hint="Must be at least 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm password"
          type="password"
          placeholder="Confirm your password"
          leftIcon={<LockClosedIcon className="w-5 h-5" />}
          error={errors.password_confirm?.message}
          {...register('password_confirm')}
        />

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-secondary">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default RegisterPage
