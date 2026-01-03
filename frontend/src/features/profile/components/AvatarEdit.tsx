import { useRef, useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type UpdateAvatarRequest, updateAvatar } from '@/features/api/users/users';
import { getMeQueryKey } from '@/features/api/users/users';

import { AvatarImageUpload, type AvatarImageUploadRef } from './AvatarImageUpload';

type AvatarEditProps = {
  onCancel: () => void;
};

export function AvatarEdit({ onCancel }: AvatarEditProps) {
  const queryClient = useQueryClient();
  const uploadRef = useRef<AvatarImageUploadRef>(null);
  const [isSaving, setIsSaving] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: UpdateAvatarRequest) => updateAvatar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getMeQueryKey() });
      toast.success('Cập nhật ảnh đại diện thành công');
      setIsSaving(false);
      onCancel(); // Return to preview mode after successful save
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra';
      toast.error('Cập nhật ảnh đại diện thất bại', {
        description: message,
      });
      setIsSaving(false);
    },
  });

  const handleSave = async () => {
    if (!uploadRef.current?.hasPendingFile) {
      toast.error('Vui lòng chọn ảnh trước khi lưu');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Đang tải ảnh lên...');

    try {
      const secureUrl = await uploadRef.current.uploadPendingFile();
      if (secureUrl) {
        toast.loading('Đang cập nhật ảnh đại diện...', { id: toastId });
        mutation.mutate(
          { avatarUrl: secureUrl },
          {
            onSettled: () => {
              toast.dismiss(toastId);
            },
          },
        );
      } else {
        toast.error('Tải ảnh lên thất bại', { id: toastId });
        setIsSaving(false);
      }
    } catch (error) {
      toast.error('Tải ảnh lên thất bại', {
        id: toastId,
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
      });
      setIsSaving(false);
    }
  };

  const isProcessing = isSaving || mutation.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Chỉnh sửa ảnh đại diện</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={isProcessing}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AvatarImageUpload ref={uploadRef} />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
            Hủy
          </Button>
          <Button variant="secondary" type="button" onClick={handleSave} disabled={isProcessing}>
            Lưu
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
