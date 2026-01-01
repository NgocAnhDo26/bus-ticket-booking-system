import { Edit2, Mail, Phone, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/features/api/users/users';

type ProfileViewProps = {
  onEdit: () => void;
};

export function ProfileView({ onEdit }: ProfileViewProps) {
  const { data: userData, isLoading } = useMe();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const user = userData?.data;

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Thông tin cá nhân</CardTitle>
            <CardDescription>Xem và quản lý thông tin tài khoản của bạn</CardDescription>
          </div>
          <Button onClick={onEdit} variant="outline">
            <Edit2 className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-muted p-3">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Họ và tên</p>
            <p className="text-base">{user.fullName || 'Chưa cập nhật'}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="rounded-full bg-muted p-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-base">{user.email || 'Chưa cập nhật'}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="rounded-full bg-muted p-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Số điện thoại</p>
            <p className="text-base">{user.phone || 'Chưa cập nhật'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
