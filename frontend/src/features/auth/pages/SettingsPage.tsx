import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui'
import { useAuth, useTheme, useToastActions } from '@/contexts'
import { getErrorMessage } from '@/api'
import { cn } from '@/utils'

const profileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
})

const passwordSchema = z.object({
  old_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  new_password_confirm: z.string(),
}).refine((data) => data.new_password === data.new_password_confirm, {
  message: "Passwords don't match",
  path: ['new_password_confirm'],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export function SettingsPage() {
  const { user, updateProfile } = useAuth()
  const { theme, setTheme } = useTheme()
  const toast = useToastActions()
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const handleProfileUpdate = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true)
    try {
      await updateProfile(data)
      toast.success('Profile updated', 'Your profile has been updated successfully.')
    } catch (error) {
      toast.error('Update failed', getErrorMessage(error))
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handlePasswordChange = async () => {
    setIsChangingPassword(true)
    try {
      // TODO: Call changePassword API
      toast.success('Password changed', 'Your password has been updated.')
      passwordForm.reset()
    } catch (error) {
      toast.error('Change failed', getErrorMessage(error))
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">Settings</h1>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                error={profileForm.formState.errors.first_name?.message}
                {...profileForm.register('first_name')}
              />
              <Input
                label="Last name"
                error={profileForm.formState.errors.last_name?.message}
                {...profileForm.register('last_name')}
              />
            </div>
            <Input
              label="Email"
              value={user?.email || ''}
              disabled
              hint="Email cannot be changed"
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={isUpdatingProfile}>
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                'flex-1 p-4 rounded-xl border-2 transition-all',
                theme === 'light'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-subtle hover:border-primary-300'
              )}
            >
              <div className="w-full h-20 rounded-lg bg-white dark:bg-gray-800 shadow-sm mb-3" />
              <p className="text-sm font-medium text-primary">Light</p>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                'flex-1 p-4 rounded-xl border-2 transition-all',
                theme === 'dark'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-subtle hover:border-primary-300'
              )}
            >
              <div className="w-full h-20 rounded-lg bg-neutral-800 mb-3" />
              <p className="text-sm font-medium text-primary">Dark</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
            <Input
              label="Current password"
              type="password"
              error={passwordForm.formState.errors.old_password?.message}
              {...passwordForm.register('old_password')}
            />
            <Input
              label="New password"
              type="password"
              error={passwordForm.formState.errors.new_password?.message}
              {...passwordForm.register('new_password')}
            />
            <Input
              label="Confirm new password"
              type="password"
              error={passwordForm.formState.errors.new_password_confirm?.message}
              {...passwordForm.register('new_password_confirm')}
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={isChangingPassword}>
                Change password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsPage
