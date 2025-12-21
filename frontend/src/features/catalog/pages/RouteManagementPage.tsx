import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ArrowRight, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import * as z from 'zod';

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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { RouteStopsManager } from '../components/RouteStopsManager';
import { useCreateRoute, useDeleteRoute, useRoutes, useStations, useUpdateRoute } from '../hooks';
import type { Route } from '../types';

const formSchema = z.object({
  originStationId: z.string().min(1, 'Vui lòng chọn điểm đi'),
  destinationStationId: z.string().min(1, 'Vui lòng chọn điểm đến'),
  durationMinutes: z.number().min(1, 'Thời gian di chuyển phải lớn hơn 0'),
  distanceKm: z.number().min(1, 'Khoảng cách phải lớn hơn 0'),
});

export const RouteManagementPage = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const { data: routes, isLoading: isLoadingRoutes } = useRoutes();
  const { data: stations } = useStations();
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const deleteRoute = useDeleteRoute();
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<Route | null>(null);

  const [managingStopsRoute, setManagingStopsRoute] = useState<Route | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originStationId: '',
      destinationStationId: '',
      durationMinutes: 0,
      distanceKm: 0,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingRoute) {
      updateRoute.mutate(
        { id: editingRoute.id, data: values },
        {
          onSuccess: () => {
            setIsOpen(false);
            setEditingRoute(null);
            reset();
          },
        },
      );
    } else {
      createRoute.mutate(values, {
        onSuccess: () => {
          setIsOpen(false);
          reset();
        },
      });
    }
  };

  const handleEdit = useCallback(
    (route: Route) => {
      setEditingRoute(route);
      reset({
        originStationId: route.originStation.id,
        destinationStationId: route.destinationStation.id,
        durationMinutes: route.durationMinutes,
        distanceKm: route.distanceKm,
      });
      setIsOpen(true);
    },
    [reset],
  );

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
                <DropdownMenuItem onClick={() => handleEdit(route)}>
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
    [handleEdit],
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
        <Sheet
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setEditingRoute(null);
              reset({
                originStationId: '',
                destinationStationId: '',
                durationMinutes: 0,
                distanceKm: 0,
              });
            }
          }}
        >
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Thêm Tuyến đường
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                {editingRoute ? 'Cập nhật Tuyến đường' : 'Thêm Tuyến đường mới'}
              </SheetTitle>
              <SheetDescription>Nhập thông tin chi tiết về tuyến đường mới.</SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Field data-invalid={!!errors.originStationId}>
                  <FieldLabel>Điểm đi</FieldLabel>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register('originStationId')}
                  >
                    <option value="">Chọn điểm đi...</option>
                    {stations?.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name} ({station.city})
                      </option>
                    ))}
                  </select>
                  <FieldError>{errors.originStationId?.message}</FieldError>
                </Field>
                <Field data-invalid={!!errors.destinationStationId}>
                  <FieldLabel>Điểm đến</FieldLabel>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register('destinationStationId')}
                  >
                    <option value="">Chọn điểm đến...</option>
                    {stations?.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name} ({station.city})
                      </option>
                    ))}
                  </select>
                  <FieldError>{errors.destinationStationId?.message}</FieldError>
                </Field>
                <Field data-invalid={!!errors.durationMinutes}>
                  <FieldLabel>Thời gian di chuyển (phút)</FieldLabel>
                  <Input type="number" {...register('durationMinutes', { valueAsNumber: true })} />
                  <FieldError>{errors.durationMinutes?.message}</FieldError>
                </Field>
                <Field data-invalid={!!errors.distanceKm}>
                  <FieldLabel>Khoảng cách (km)</FieldLabel>
                  <Input
                    type="number"
                    step="0.1"
                    {...register('distanceKm', { valueAsNumber: true })}
                  />
                  <FieldError>{errors.distanceKm?.message}</FieldError>
                </Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createRoute.isPending || updateRoute.isPending}
                >
                  {createRoute.isPending || updateRoute.isPending
                    ? 'Đang xử lý...'
                    : editingRoute
                      ? 'Cập nhật'
                      : 'Tạo Tuyến đường'}
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
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

      {/* Route Stops Management Sheet */}
      <Sheet
        open={!!managingStopsRoute}
        onOpenChange={(open) => !open && setManagingStopsRoute(null)}
      >
        <SheetContent className="overflow-y-auto sm:max-w-xl w-full">
          <SheetHeader>
            <SheetTitle>Quản lý trạm dừng</SheetTitle>
            <SheetDescription>
              Tuyến: {managingStopsRoute?.originStation.name} -{' '}
              {managingStopsRoute?.destinationStation.name}
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            {managingStopsRoute && <RouteStopsManager route={managingStopsRoute} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
