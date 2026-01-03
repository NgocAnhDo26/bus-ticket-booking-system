import { useMemo, useState } from 'react';

import { MoreHorizontal, Pencil, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';

import { type ColumnDef, GenericTable } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getFriendlyErrorMessage } from '@/utils/error-utils';

import { useSetUserStatus, useUsers } from '../api';
import { AdminUserForm } from '../components/AdminUserForm';
import type { AdminUser } from '../types';

export const AdminManagementPage = () => {
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({ key: 'fullName', direction: 'asc' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const setStatusMutation = useSetUserStatus();

  const { data: usersData, isLoading } = useUsers({
    page: pageIndex - 1, // API is 0-indexed
    size: pageSize,
    role: 'ADMIN',
  });

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleToggleStatus = (user: AdminUser) => {
    const newStatus = !user.enabled;
    setStatusMutation.mutate(
      { id: user.id, enabled: newStatus },
      {
        onSuccess: () => {
          toast.success(`Đã ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản ${user.email}`);
        },
        onError: (error) => {
          toast.error(`${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} thất bại`, {
            description: getFriendlyErrorMessage(error),
          });
        },
      },
    );
  };

  const columns: ColumnDef<AdminUser>[] = useMemo(
    () => [
      {
        key: 'fullName',
        header: 'Họ tên',
        sortable: true,
      },
      {
        key: 'email',
        header: 'Email',
        sortable: true,
      },
      {
        key: 'phone',
        header: 'Số điện thoại',
      },
      {
        key: 'enabled',
        header: 'Trạng thái',
        cell: (user) => (
          <Badge variant={user.enabled ? 'default' : 'secondary'}>
            {user.enabled ? 'Hoạt động' : 'Đã khóa'}
          </Badge>
        ),
      },
      {
        key: 'createdAt',
        header: 'Ngày tạo',
        cell: (user) => new Date(user.createdAt).toLocaleDateString('vi-VN'),
      },
      {
        key: 'actions',
        header: '',
        cell: (user) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-fit">
                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleEdit(user)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Sửa thông tin
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleToggleStatus(user)}
                  className={user.enabled ? 'text-destructive focus:text-destructive' : ''}
                >
                  {user.enabled ? (
                    <>
                      <PowerOff className="mr-2 h-4 w-4" />
                      Vô hiệu hóa
                    </>
                  ) : (
                    <>
                      <Power className="mr-2 h-4 w-4" />
                      Kích hoạt
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const meta = {
    total: usersData?.page.totalElements || 0,
    page: (usersData?.page.number || 0) + 1,
    pageSize: usersData?.page.size || 10,
    totalPages: usersData?.page.totalPages || 1,
  };

  return (
    <div className="flex flex-col gap-8 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Nhân viên</h1>
          <p className="text-sm text-muted-foreground">
            Danh sách tài khoản quản trị viên và nhân viên.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null);
            setIsFormOpen(true);
          }}
        >
          Thêm quản trị viên
        </Button>
      </div>

      <GenericTable<AdminUser>
        data={usersData?.content || []}
        columns={columns}
        isLoading={isLoading}
        meta={meta}
        pageIndex={pageIndex}
        pageSize={pageSize}
        sorting={sorting}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onSort={(key) =>
          setSorting((prev) =>
            prev.key === key
              ? {
                  key,
                  direction: prev.direction === 'asc' ? 'desc' : 'asc',
                }
              : { key, direction: 'asc' },
          )
        }
        getRowId={(user) => user.id}
      />

      <AdminUserForm open={isFormOpen} onOpenChange={setIsFormOpen} userToEdit={editingUser} />
    </div>
  );
};
