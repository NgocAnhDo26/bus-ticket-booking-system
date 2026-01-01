import { type UseFormReturn } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { type RegisterFormValues } from '@/features/auth/schema';
import { cn } from '@/lib/utils';

type Props = {
  form: UseFormReturn<RegisterFormValues>;
  onSubmit: (values: RegisterFormValues) => void;
  isSubmitting?: boolean;
  error?: string;
  className?: string;
};

export function RegisterForm({
  form,
  onSubmit,
  isSubmitting,
  error,
  className,
  ...props
}: Props & Omit<React.ComponentPropsWithoutRef<'form'>, keyof Props>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form className={cn('space-y-6', className)} onSubmit={handleSubmit(onSubmit)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Tạo tài khoản</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Nhập thông tin bên dưới để bắt đầu
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      <Field data-invalid={!!errors.fullName}>
        <FieldLabel>Họ và tên</FieldLabel>
        <Input placeholder="Jane Doe" {...register('fullName')} />
        <FieldError>{errors.fullName?.message}</FieldError>
      </Field>
      <Field data-invalid={!!errors.email}>
        <FieldLabel>Email</FieldLabel>
        <Input
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register('email')}
        />
        <FieldError>{errors.email?.message}</FieldError>
      </Field>
      <Field data-invalid={!!errors.password}>
        <FieldLabel>Mật khẩu</FieldLabel>
        <Input
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...register('password')}
        />
        <FieldError>{errors.password?.message}</FieldError>
      </Field>
      <Field data-invalid={!!errors.confirmPassword}>
        <FieldLabel>Xác nhận mật khẩu</FieldLabel>
        <Input
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
        <FieldError>{errors.confirmPassword?.message}</FieldError>
      </Field>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Đang tạo tài khoản…' : 'Đăng ký'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
