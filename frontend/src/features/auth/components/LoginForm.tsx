import { type UseFormReturn } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { GoogleLogin } from '@react-oauth/google';

import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type LoginFormValues } from '@/features/auth/schema';
import { cn } from '@/lib/utils';

type Props = {
  form: UseFormReturn<LoginFormValues>;
  error?: string;
  isSubmitting?: boolean;
  onSubmit: (values: LoginFormValues) => void;
  onGoogleLogin: (credential: string) => void;
  onGoogleError?: () => void;
  className?: string;
};

export function LoginForm({
  form,
  error,
  isSubmitting,
  onSubmit,
  onGoogleLogin,
  onGoogleError,
  className,
  ...props
}: Props & Omit<React.ComponentPropsWithoutRef<'form'>, keyof Props>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form
      className={cn('flex flex-col gap-6', className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center mb-8">
        <h1 className="text-2xl font-bold">Đăng nhập vào tài khoản</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Mật khẩu</Label>
            <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
              Quên mật khẩu?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </Button>
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            Hoặc đăng nhập bằng
          </span>
        </div>
        <div className="flex justify-center items-center flex-1">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (credentialResponse.credential) {
                onGoogleLogin(credentialResponse.credential);
              }
            }}
            onError={onGoogleError}
            width="100%"
          />
        </div>
      </div>
      <div className="text-center text-sm">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="underline underline-offset-4">
          Đăng ký
        </Link>
      </div>
    </form>
  );
}
