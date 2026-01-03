import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Bus as BusIcon, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { type ColumnDef, GenericTable } from '@/components/common';
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

import { useBuses, useDeleteBus } from '../hooks';
import type { Bus } from '../types';

export const BusManagementPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: buses, isLoading: isLoadingBuses } = useBuses();
  const deleteBus = useDeleteBus();
  const [deletingBus, setDeletingBus] = useState<Bus | null>(null);
  const [forceDeleteId, setForceDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deletingBus) {
      deleteBus.mutate(
        { id: deletingBus.id },
        {
          onSuccess: () => {
            setDeletingBus(null);
            toast.success('Đã xóa xe thành công');
          },
          onError: (error: Error) => {
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 409) {
              setForceDeleteId(deletingBus.id);
              setDeletingBus(null);
            } else {
              toast.error('Xóa thất bại', {
                description: getFriendlyErrorMessage(error),
              });
            }
          },
        },
      );
    }
  };

  const handleForceDelete = () => {
    if (forceDeleteId) {
      deleteBus.mutate(
        { id: forceDeleteId, force: true },
        {
          onSuccess: () => {
            setForceDeleteId(null);
            queryClient.invalidateQueries({ queryKey: ['buses'] });
          },
        },
      );
    }
  };

  const handleEdit = useCallback(
    (bus: Bus) => {
      navigate(`/admin/catalog/buses/edit/${bus.id}`);
    },
    [navigate],
  );

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({ key: 'plateNumber', direction: 'asc' });

  const sortedPaged = useMemo(() => {
    if (!buses) return { data: [], total: 0, totalPages: 1, page: 1 };
    const arr = [...buses];

    if (sorting.key) {
      const key = sorting.key as keyof Bus;
      arr.sort((a, b) => {
        const aVal = a[key] as unknown;
        const bVal = b[key] as unknown;
        if (aVal == null || bVal == null) return 0;
        if (aVal < bVal) return sorting.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sorting.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = arr.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(pageIndex, totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;

    return {
      data: arr.slice(start, end),
      total,
      totalPages,
      page: safePage,
    };
  }, [buses, pageIndex, pageSize, sorting]);

  const meta = {
    total: sortedPaged.total,
    page: sortedPaged.page,
    pageSize,
    totalPages: sortedPaged.totalPages,
  };

  const columns: ColumnDef<Bus>[] = useMemo(
    () => [
      {
        key: 'plateNumber',
        header: 'Biển số',
        sortable: true,
        cell: (bus) => (
          <div className="flex items-center gap-2 flex-wrap">
            <BusIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">{bus.plateNumber}</span>
          </div>
        ),
      },
      {
        key: 'operator',
        header: 'Nhà xe',
        cell: (bus) => bus.operator?.name ?? '-',
      },
      {
        key: 'busLayout',
        header: 'Số ghế',
        sortable: true,
        cell: (bus) => <span>{bus.busLayout?.totalSeats ?? '-'} ghế</span>,
      },
      {
        key: 'amenities',
        header: 'Tiện ích',
        cell: (bus) => (
          <div className="flex flex-wrap gap-1">
            {bus.amenities?.map((amenity, index) => (
              <Badge key={index} className="text-xs" variant="outline">
                {amenity}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        key: 'isActive',
        header: 'Trạng thái',
        sortable: true,
        cell: (bus) => (
          <Badge variant={bus.isActive ? 'default' : 'secondary'}>
            {bus.isActive ? 'Hoạt động' : 'Bảo trì'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: '',
        cell: (bus) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleEdit(bus)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Sửa
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeletingBus(bus)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [handleEdit],
  );

  return (
    <div className="flex flex-col gap-8 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Xe</h1>
          <p className="text-sm text-muted-foreground">
            Danh sách các xe được cấu hình trong hệ thống.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/catalog/buses/create')}>
          <Plus className="mr-2 h-4 w-4" /> Thêm Xe
        </Button>
      </div>

      <GenericTable<Bus>
        data={sortedPaged.data}
        columns={columns}
        isLoading={isLoadingBuses}
        meta={meta}
        pageIndex={meta.page}
        pageSize={pageSize}
        sorting={sorting}
        onPageChange={setPageIndex}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPageIndex(1);
        }}
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
        getRowId={(bus) => bus.id}
      />

      <AlertDialog
        open={!!deletingBus}
        onOpenChange={(open: boolean) => !open && setDeletingBus(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Xe này sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {deleteBus.isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!forceDeleteId}
        onOpenChange={(open: boolean) => !open && setForceDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cảnh báo: Dữ liệu liên quan</AlertDialogTitle>
            <AlertDialogDescription>
              Xe này đang được sử dụng trong các chuyến đi. Bạn có muốn xóa BẮT BUỘC không? Hành
              động này sẽ xóa tất cả các dữ liệu liên quan (chuyến đi, vé).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleForceDelete}
            >
              {deleteBus.isPending ? 'Đang xóa...' : 'Xóa bắt buộc'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
