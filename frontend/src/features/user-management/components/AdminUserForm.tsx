import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { useCreateAdmin, useUpdateAdmin } from '../api';
import type { AdminUser } from '../types';

const formSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  fullName: z.string().min(1, 'Họ tên là bắt buộc'),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, 'Số điện thoại không hợp lệ')
    .optional()
    .or(z.literal('')),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').optional(),
});

interface AdminUserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit: AdminUser | null;
}

export function AdminUserForm({ open, onOpenChange, userToEdit }: AdminUserFormProps) {
  const createMutation = useCreateAdmin();
  const updateMutation = useUpdateAdmin();

  const isEditing = !!userToEdit;

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      fullName: '',
      phone: '',
      password: '',
    },
  });

  useEffect(() => {
    if (userToEdit) {
      reset({
        email: userToEdit.email,
        fullName: userToEdit.fullName,
        phone: userToEdit.phone || '',
        password: '',
      });
    } else {
      reset({
        email: '',
        fullName: '',
        phone: '',
        password: '',
      });
    }
  }, [userToEdit, reset, open]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isEditing) {
      updateMutation.mutate(
        {
          id: userToEdit.id,
          data: {
            fullName: values.fullName,
            phone: values.phone || undefined,
          },
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            reset();
          },
        },
      );
    } else {
      if (!values.password) {
        setError('password', { message: 'Mật khẩu là bắt buộc khi tạo mới' });
        return;
      }
      createMutation.mutate(
        {
          email: values.email,
          fullName: values.fullName,
          phone: values.phone || undefined,
          password: values.password,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            reset();
          },
        },
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Cập nhật quản trị viên' : 'Thêm quản trị viên'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Chỉnh sửa thông tin quản trị viên. Email không thể thay đổi.'
              : 'Nhập thông tin để tạo tài khoản quản trị viên mới.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={!!errors.email}>
            <FieldLabel required>Email</FieldLabel>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input placeholder="example@domain.com" {...field} disabled={isEditing} />
              )}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.fullName}>
            <FieldLabel required>Họ tên</FieldLabel>
            <Controller
              control={control}
              name="fullName"
              render={({ field }) => <Input placeholder="Nguyễn Văn A" {...field} />}
            />
            <FieldError>{errors.fullName?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.phone}>
            <FieldLabel>Số điện thoại</FieldLabel>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => <Input placeholder="+84901234567" {...field} />}
            />
            <FieldError>{errors.phone?.message}</FieldError>
          </Field>

          {!isEditing && (
            <Field data-invalid={!!errors.password}>
              <FieldLabel required>Mật khẩu</FieldLabel>
              <Controller
                control={control}
                name="password"
                render={({ field }) => <Input type="password" placeholder="******" {...field} />}
              />
              <FieldError>{errors.password?.message}</FieldError>
            </Field>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
