import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ArrowRight, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';

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

import { useDeleteRoute, useRoutes } from '../hooks';
import type { Route } from '../types';

export const RouteManagementPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: routes, isLoading: isLoadingRoutes } = useRoutes();
  const deleteRoute = useDeleteRoute();
  
  const [deletingRoute, setDeletingRoute] = useState<Route | null>(null);

  const [forceDeleteId, setForceDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deletingRoute) {
      deleteRoute.mutate(
        { id: deletingRoute.id },
        {
          onSuccess: () => {
            setDeletingRoute(null);
          },
          onError: (error: Error) => {
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 409) {
              setForceDeleteId(deletingRoute.id);
              setDeletingRoute(null);
            }
          },
        },
      );
    }
  };

  const handleForceDelete = () => {
    if (forceDeleteId) {
      deleteRoute.mutate(
        { id: forceDeleteId, force: true },
        {
          onSuccess: () => {
            setForceDeleteId(null);
            queryClient.invalidateQueries({ queryKey: ['routes'] });
          },
        },
      );
    }
  };

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  const sortedPaged = useMemo(() => {
    if (!routes) return { data: [], total: 0, totalPages: 1, page: 1 };
    const arr = [...routes];

    if (sorting.key) {
      const key = sorting.key as keyof Route;
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
  }, [routes, pageIndex, pageSize, sorting]);

  const meta = {
    total: sortedPaged.total,
    page: sortedPaged.page,
    pageSize,
    totalPages: sortedPaged.totalPages,
  };

  const columns: ColumnDef<Route>[] = useMemo(
    () => [
      {
        key: 'originStation',
        header: 'Tuyến đường',
        cell: (route) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{route.originStation.name}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium">{route.destinationStation.name}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {route.originStation.city} - {route.destinationStation.city}
            </div>
          </div>
        ),
      },
      {
        key: 'durationMinutes',
        header: 'Thời gian',
        sortable: true,
        cell: (route) => <span>{route.durationMinutes} phút</span>,
      },
      {
        key: 'distanceKm',
        header: 'Khoảng cách',
        sortable: true,
        cell: (route) => <span>{route.distanceKm} km</span>,
      },
      {
        key: 'isActive',
        header: 'Trạng thái',
        sortable: true,
        cell: (route) => (
          <Badge variant={route.isActive ? 'default' : 'secondary'}>
            {route.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: '',
        cell: (route) => (
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
                <DropdownMenuItem onClick={() => navigate(`/admin/catalog/routes/edit/${route.id}`)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Sửa
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setDeletingRoute(route)}
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
    [navigate],
  );

  return (
    <div className="flex flex-col gap-8 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Tuyến đường</h1>
          <p className="text-sm text-muted-foreground">
            Danh sách các tuyến đường được cấu hình trong hệ thống.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/catalog/routes/create')}>
          <Plus className="mr-2 h-4 w-4" /> Thêm Tuyến đường
        </Button>
      </div>

      <GenericTable<Route>
        data={sortedPaged.data}
        columns={columns}
        isLoading={isLoadingRoutes}
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
        getRowId={(route) => route.id}
      />

      <AlertDialog open={!!deletingRoute} onOpenChange={(open) => !open && setDeletingRoute(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Tuyến đường này sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {deleteRoute.isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!forceDeleteId} onOpenChange={(open) => !open && setForceDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cảnh báo: Dữ liệu liên quan</AlertDialogTitle>
            <AlertDialogDescription>
              Tuyến đường này đang được sử dụng trong các chuyến đi. Bạn có muốn xóa BẮT BUỘC không?
              Hành động này sẽ xóa tất cả các dữ liệu liên quan (chuyến đi, vé).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleForceDelete}
            >
              {deleteRoute.isPending ? 'Đang xóa...' : 'Xóa bắt buộc'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
