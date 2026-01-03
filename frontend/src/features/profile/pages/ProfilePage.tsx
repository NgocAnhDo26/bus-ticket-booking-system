import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Separator } from '@/components/ui/separator';
import {
  type UpdateAvatarRequest,
  getMeQueryKey,
  updateAvatar,
  useMe,
} from '@/features/api/users/users';
import { AvatarEdit } from '@/features/profile/components/AvatarEdit';
import { AvatarView } from '@/features/profile/components/AvatarView';
import { PasswordChangeForm } from '@/features/profile/components/PasswordChangeForm';
import { ProfileForm } from '@/features/profile/components/ProfileForm';
import { ProfileView } from '@/features/profile/components/ProfileView';
import { getFriendlyErrorMessage } from '@/utils/error-utils';

export function ProfilePage() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const queryClient = useQueryClient();
  const { data: userData } = useMe();
  const authProvider = userData?.data?.authProvider;

  const removeAvatarMutation = useMutation({
    mutationFn: (data: UpdateAvatarRequest) => updateAvatar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getMeQueryKey() });
      toast.success('Xóa ảnh đại diện thành công');
    },
    onError: (error) => {
      toast.error('Xóa ảnh đại diện thất bại', {
        description: getFriendlyErrorMessage(error),
      });
    },
  });

  const handleRemoveAvatar = () => {
    removeAvatarMutation.mutate({ avatarUrl: null });
  };

  return (
    <div className="max-w-4xl space-y-8 flex-1 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Hồ sơ của tôi</h1>
        <p className="text-muted-foreground mt-2">Quản lý thông tin cá nhân và tài khoản</p>
      </div>
      {/* Profile Information Section */}
      <div>
        {isEditingProfile ? (
          <ProfileForm onCancel={() => setIsEditingProfile(false)} />
        ) : (
          <ProfileView onEdit={() => setIsEditingProfile(true)} />
        )}
      </div>

      <Separator />

      {/* Avatar Section */}
      <div>
        {isEditingAvatar ? (
          <AvatarEdit onCancel={() => setIsEditingAvatar(false)} />
        ) : (
          <AvatarView
            onEdit={() => setIsEditingAvatar(true)}
            onRemove={handleRemoveAvatar}
            isRemoving={removeAvatarMutation.isPending}
          />
        )}
      </div>

      {/* Password Change Section - Only show for LOCAL auth provider */}
      {authProvider === 'LOCAL' && (
        <>
          <Separator />
          <div>
            <PasswordChangeForm />
          </div>
        </>
      )}
    </div>
  );
}
