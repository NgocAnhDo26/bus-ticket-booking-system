import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '@/features/auth/components/AuthLayout';

import { resetPassword } from '../api';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ResetPasswordFormValues) =>
      resetPassword({ token: token || '', newPassword: values.password }),
    onSuccess: () => {
      toast.success('Đặt lại mật khẩu thành công', {
        description: 'Bạn có thể đăng nhập bằng mật khẩu mới.',
      });
      navigate('/login');
    },
    onError: () => {
      toast.error('Đặt lại mật khẩu thất bại', {
        description: 'Liên kết có thể đã hết hạn hoặc không hợp lệ.',
      });
    },
  });

  const onSubmit = (values: ResetPasswordFormValues) => {
    if (!token) {
      toast.error('Token không hợp lệ');
      return;
    }
    mutation.mutate(values);
  };

  if (!token) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Lỗi liên kết</CardTitle>
            <CardDescription>
              Liên kết đặt lại mật khẩu không hợp lệ hoặc bị thiếu token.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="link" asChild>
              <Link to="/auth/forgot-password">Yêu cầu liên kết mới</Link>
            </Button>
          </CardFooter>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Mật khẩu mới</CardTitle>
          <CardDescription>Nhập mật khẩu mới cho tài khoản của bạn.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Mật khẩu mới</Label>
              <Input
                id="password"
                type="password"
                placeholder="******"
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="******"
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};
