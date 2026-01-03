import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { type UpdateProfileRequest, updateProfile, useMe } from '@/features/api/users/users';
import { getMeQueryKey } from '@/features/api/users/users';
import type { UpdateProfileFormValues } from '@/features/profile/schema';
import { updateProfileSchema } from '@/features/profile/schema';
import { getFriendlyErrorMessage } from '@/utils/error-utils';

type ProfileFormProps = {
  onCancel: () => void;
};

export function ProfileForm({ onCancel }: ProfileFormProps) {
  const { data: userData, isLoading } = useMe();
  const queryClient = useQueryClient();

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: '',
      phone: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = form;

  useEffect(() => {
    if (userData?.data) {
      const user = userData.data;
      reset({
        fullName: user.fullName || '',
        phone: user.phone || '',
      });
    }
  }, [userData, reset]);

  const mutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfile(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: getMeQueryKey() });
      toast.success('Cập nhật thông tin thành công');
      if (response.data) {
        reset({
          fullName: response.data.fullName || '',
          phone: response.data.phone || '',
        });
      }
      onCancel(); // Return to preview mode after successful save
    },
    onError: (error) => {
      toast.error('Cập nhật thông tin thất bại', {
        description: getFriendlyErrorMessage(error),
      });
    },
  });

  const onSubmit = (values: UpdateProfileFormValues) => {
    mutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Chỉnh sửa thông tin</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={mutation.isPending}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Field data-invalid={!!errors.fullName}>
            <FieldLabel>Họ và tên</FieldLabel>
            <Input placeholder="Nguyễn Văn A" {...register('fullName')} />
            <FieldError>{errors.fullName?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.phone}>
            <FieldLabel>Số điện thoại</FieldLabel>
            <Input placeholder="0123456789" {...register('phone')} />
            <FieldError>{errors.phone?.message}</FieldError>
          </Field>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={mutation.isPending}
            >
              Hủy
            </Button>
            <Button variant="secondary" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang cập nhật...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
