import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { AuthLayout } from '../components/auth-layout'
import { login, loginWithGoogle } from '../api'
import { loginSchema, type LoginFormValues } from '../schema'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth-store'
import { GoogleLogin } from '@react-oauth/google'
import { Link } from 'react-router-dom'

export const LoginPage = () => {
  const setAuth = useAuthStore((state) => state.setAuth)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: setAuth,
  })

  const googleMutation = useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: setAuth,
  })

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values)
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Manage routes, bookings, and more with ease.">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <FormField label="Email address" error={errors.email?.message}>
            <Input type="email" placeholder="you@example.com" {...register('email')} />
          </FormField>
          <FormField label="Password" error={errors.password?.message}>
            <Input type="password" placeholder="••••••••" {...register('password')} />
          </FormField>
        </div>
        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>

        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-muted">
          <span className="flex-1 border-b border-border/60" />
          or
          <span className="flex-1 border-b border-border/60" />
        </div>

        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              googleMutation.mutate({ credential: credentialResponse.credential })
            }
          }}
          onError={() => {
            // no-op; error toast can be added later
          }}
        />

        <p className="text-center text-sm text-text-muted">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

