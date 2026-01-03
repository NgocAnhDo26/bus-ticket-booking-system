import { useState } from 'react';

import { Edit2, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/features/api/users/users';

type AvatarViewProps = {
  onEdit: () => void;
  onRemove: () => void;
  isRemoving?: boolean;
};

export function AvatarView({ onEdit, onRemove, isRemoving = false }: AvatarViewProps) {
  const { data: userData, isLoading } = useMe();
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-32 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const user = userData?.data;
  const currentAvatarUrl = user?.avatarUrl;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ảnh đại diện</CardTitle>
            <CardDescription>Quản lý ảnh đại diện của bạn</CardDescription>
          </div>
          <div className="flex gap-2">
            {currentAvatarUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRemoveDialog(true)}
                disabled={isRemoving}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit2 className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <Avatar className="h-32 w-32">
            <AvatarImage src={currentAvatarUrl || ''} alt="Avatar" />
            <AvatarFallback className="text-2xl">{user?.fullName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <p className="text-sm text-muted-foreground">
              {currentAvatarUrl
                ? 'Bạn có thể thay đổi hoặc xóa ảnh đại diện của mình'
                : 'Bạn chưa có ảnh đại diện. Hãy tải lên một ảnh để hiển thị trên hồ sơ của bạn.'}
            </p>
          </div>
        </div>
      </CardContent>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa ảnh đại diện</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa ảnh đại diện? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isRemoving}
              onClick={() => {
                onRemove();
                setShowRemoveDialog(false);
              }}
            >
              {isRemoving ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
