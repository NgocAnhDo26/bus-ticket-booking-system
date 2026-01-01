import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { type ChangePasswordRequest, changePassword } from '@/features/api/users/users';
import type { ChangePasswordFormValues } from '@/features/profile/schema';
import { changePasswordSchema } from '@/features/profile/schema';

export function PasswordChangeForm() {
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = form;

  const mutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => changePassword(data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công');
      reset();
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra';
      toast.error('Đổi mật khẩu thất bại', {
        description: message,
      });
    },
  });

  const onSubmit = (values: ChangePasswordFormValues) => {
    mutation.mutate({
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đổi mật khẩu</CardTitle>
        <CardDescription>Cập nhật mật khẩu của bạn để bảo mật tài khoản</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Field data-invalid={!!errors.oldPassword}>
            <FieldLabel>Mật khẩu cũ</FieldLabel>
            <Input type="password" placeholder="••••••••" {...register('oldPassword')} />
            <FieldError>{errors.oldPassword?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.newPassword}>
            <FieldLabel>Mật khẩu mới</FieldLabel>
            <Input type="password" placeholder="••••••••" {...register('newPassword')} />
            <FieldError>{errors.newPassword?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel>Xác nhận mật khẩu mới</FieldLabel>
            <Input type="password" placeholder="••••••••" {...register('confirmPassword')} />
            <FieldError>{errors.confirmPassword?.message}</FieldError>
          </Field>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
