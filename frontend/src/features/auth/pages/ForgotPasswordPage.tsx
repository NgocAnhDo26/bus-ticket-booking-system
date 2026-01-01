import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

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

import { forgotPassword } from '../api';

const forgotPasswordSchema = z.object({
  email: z.email('Email không hợp lệ'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      toast.success('Đã gửi email khôi phục', {
        description: 'Vui lòng kiểm tra hộp thư đến của bạn.',
      });
      form.reset();
    },
    onError: () => {
      toast.error('Gửi yêu cầu thất bại', {
        description: 'Vui lòng thử lại sau.',
      });
    },
  });

  const onSubmit = (values: ForgotPasswordFormValues) => {
    mutation.mutate(values);
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Khôi phục mật khẩu</CardTitle>
          <CardDescription>Nhập email của bạn để nhận liên kết đặt lại mật khẩu.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang gửi...' : 'Gửi liên kết'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="link" asChild>
            <Link to="/login">Quay lại đăng nhập</Link>
          </Button>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
};
