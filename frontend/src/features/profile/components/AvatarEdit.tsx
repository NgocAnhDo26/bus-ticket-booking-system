import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { X } from 'lucide-react';
import { toast } from 'sonner';

import { ImageUpload } from '@/components/common/ImageUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type UpdateAvatarRequest, updateAvatar } from '@/features/api/users/users';
import { getMeQueryKey } from '@/features/api/users/users';
import type { ImageUploadResponse } from '@/lib/image-upload';

type AvatarEditProps = {
  onCancel: () => void;
};

export function AvatarEdit({ onCancel }: AvatarEditProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: UpdateAvatarRequest) => updateAvatar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getMeQueryKey() });
      toast.success('Cập nhật ảnh đại diện thành công');
      onCancel(); // Return to preview mode after successful save
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra';
      toast.error('Cập nhật ảnh đại diện thất bại', {
        description: message,
      });
    },
  });

  const handleUploadSuccess = (images: ImageUploadResponse[]) => {
    if (images.length > 0) {
      const image = images[0];
      mutation.mutate({ avatarUrl: image.secureUrl });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Chỉnh sửa ảnh đại diện</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={mutation.isPending}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ImageUpload
          multiple={false}
          folder="avatars"
          onUploadSuccess={handleUploadSuccess}
          onUploadError={(error) => {
            toast.error('Tải ảnh lên thất bại', {
              description: error.message,
            });
          }}
          showPreview={false}
        />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>
            Hủy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
