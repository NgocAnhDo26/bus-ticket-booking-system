import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { format } from 'date-fns';
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

import { TripStopsDialog } from '../components/TripStopsDialog';
import {
  useBuses,
  useCreateTrip,
  useDeleteTrip,
  useRoutes,
  useTrips,
  useUpdateTrip,
} from '../hooks';
import { SeatType, type Trip } from '../types';

const formSchema = z.object({
  routeId: z.string().min(1, 'Vui lòng chọn tuyến đường'),
  busId: z.string().min(1, 'Vui lòng chọn xe'),
  departureTime: z.string().min(1, 'Thời gian đi là bắt buộc'),
  arrivalTime: z.string().min(1, 'Thời gian đến là bắt buộc'),
  pricings: z.array(
    z.object({
      seatType: z.enum([SeatType.NORMAL, SeatType.VIP]),
      price: z.number().min(0, 'Giá vé phải lớn hơn hoặc bằng 0'),
    }),
  ),
});

export const TripManagementPage = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const { data: trips, isLoading: isLoadingTrips } = useTrips();
  const { data: routes } = useRoutes();
  const { data: buses } = useBuses();
  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();
  const deleteTrip = useDeleteTrip();
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null);
  const [managingStopsTrip, setManagingStopsTrip] = useState<Trip | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      routeId: '',
      busId: '',
      departureTime: '',
      arrivalTime: '',
      pricings: [
        { seatType: SeatType.NORMAL, price: 0 },
        { seatType: SeatType.VIP, price: 0 },
      ],
    },
  });
  const { fields } = useFieldArray({
    control,
    name: 'pricings',
  });

  const routeId = useWatch({ control, name: 'routeId' });
  const departureTime = useWatch({ control, name: 'departureTime' });

  useEffect(() => {
    if (routeId && departureTime && routes) {
      const selectedRoute = routes.find((r) => r.id === routeId);
      if (selectedRoute) {
        const start = new Date(departureTime);
        const end = new Date(start.getTime() + selectedRoute.durationMinutes * 60000);

        const offset = end.getTimezoneOffset() * 60000;
        const localISOTime = new Date(end.getTime() - offset).toISOString().slice(0, 16);

        setValue('arrivalTime', localISOTime);
      }
    }
  }, [routeId, departureTime, routes, setValue]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const departureDate = new Date(values.departureTime);
    const arrivalDate = new Date(values.arrivalTime);

    const payload = {
      ...values,
      departureTime: departureDate.toISOString(),
      arrivalTime: arrivalDate.toISOString(),
    };

    if (editingTrip) {
      updateTrip.mutate(
        { id: editingTrip.id, data: payload },
        {
          onSuccess: () => {
            setIsOpen(false);
            setEditingTrip(null);
            reset();
          },
          onError: (error: Error) => {
            const axiosError = error as AxiosError<string>;
            const message = axiosError.response?.data || error.message || 'Có lỗi xảy ra';
            alert('Lỗi cập nhật: ' + message);
          },
        },
      );
    } else {
      createTrip.mutate(payload, {
        onSuccess: () => {
          setIsOpen(false);
          reset();
        },
        onError: (error: Error) => {
          const axiosError = error as AxiosError<string>;
          const message = axiosError.response?.data || error.message || 'Có lỗi xảy ra';
          alert('Lỗi tạo chuyến đi: ' + message);
        },
      });
    }
  };

  const handleEdit = useCallback(
    (trip: Trip) => {
      setEditingTrip(trip);

      // Helper to convert UTC string to Local ISO string for datetime-local input
      const toLocalISO = (dateStr: string) => {
        const date = new Date(dateStr);
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
      };

      reset({
        routeId: trip.route.id,
        busId: trip.bus.id,
        departureTime: toLocalISO(trip.departureTime),
        arrivalTime: toLocalISO(trip.arrivalTime),
        pricings: trip.tripPricings.map((p) => ({
          seatType: p.seatType,
          price: p.price,
        })),
      });
      setIsOpen(true);
    },
    [reset],
  );

  const [forceDeleteId, setForceDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deletingTrip) {
      deleteTrip.mutate(
        { id: deletingTrip.id },
        {
          onSuccess: () => {
            setDeletingTrip(null);
          },
          onError: (error: Error) => {
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 409) {
              setForceDeleteId(deletingTrip.id);
              setDeletingTrip(null);
            }
          },
        },
      );
    }
  };

  const handleForceDelete = () => {
    if (forceDeleteId) {
      deleteTrip.mutate(
        { id: forceDeleteId, force: true },
        {
          onSuccess: () => {
            setForceDeleteId(null);
            queryClient.invalidateQueries({ queryKey: ['trips'] });
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
    if (!trips) return { data: [], total: 0, totalPages: 1, page: 1 };
    const arr = [...trips];

    if (sorting.key) {
      const key = sorting.key as keyof Trip;
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
  }, [trips, pageIndex, pageSize, sorting]);

  const meta = {
    total: sortedPaged.total,
    page: sortedPaged.page,
    pageSize,
    totalPages: sortedPaged.totalPages,
  };

  const columns: ColumnDef<Trip>[] = useMemo(
    () => [
      {
        key: 'route',
        header: 'Tuyến đường',
        cell: (trip) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{trip.route.originStation.name}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium">{trip.route.destinationStation.name}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'bus',
        header: 'Xe',
        cell: (trip) => (
          <>
            <div>{trip.bus.plateNumber}</div>
            <div className="text-xs text-muted-foreground">{trip.bus.operator.name}</div>
          </>
        ),
      },
      {
        key: 'departureTime',
        header: 'Thời gian',
        sortable: true,
        cell: (trip) => (
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              {format(new Date(trip.departureTime), 'dd/MM/yyyy')}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {format(new Date(trip.departureTime), 'HH:mm')} -{' '}
              {format(new Date(trip.arrivalTime), 'HH:mm')}
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Trạng thái',
        sortable: true,
        cell: (trip) => {
          const statusMap: Record<
            string,
            { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
          > = {
            SCHEDULED: { label: 'Sắp diễn ra', variant: 'outline' },
            COMPLETED: { label: 'Hoàn thành', variant: 'default' },
            CANCELLED: { label: 'Đã hủy', variant: 'destructive' },
            DELAYED: { label: 'Hoãn', variant: 'secondary' },
          };
          const config = statusMap[trip.status] || {
            label: trip.status,
            variant: 'default',
          };
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        key: 'actions',
        header: '',
        cell: (trip) => (
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
                <DropdownMenuItem onClick={() => handleEdit(trip)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setManagingStopsTrip(trip)}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Quản lý trạm
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeletingTrip(trip)}
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
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Chuyến đi</h1>
        <Sheet
          open={isOpen}
          onOpenChange={(open: boolean) => {
            setIsOpen(open);
            if (!open) {
              setEditingTrip(null);
              reset({
                routeId: '',
                busId: '',
                departureTime: '',
                arrivalTime: '',
                pricings: [
                  { seatType: SeatType.NORMAL, price: 0 },
                  { seatType: SeatType.VIP, price: 0 },
                ],
              });
            }
          }}
        >
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Thêm Chuyến đi
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto max-h-screen">
            <SheetHeader>
              <SheetTitle>{editingTrip ? 'Cập nhật Chuyến đi' : 'Thêm Chuyến đi mới'}</SheetTitle>
              <SheetDescription>Nhập thông tin chi tiết về chuyến đi mới.</SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Field>
                  <FieldLabel>Tuyến đường</FieldLabel>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register('routeId')}
                  >
                    <option value="">Chọn tuyến đường...</option>
                    {routes?.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.originStation.name} - {route.destinationStation.name}
                      </option>
                    ))}
                  </select>
                  <FieldError>{errors.routeId?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel>Xe</FieldLabel>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register('busId')}
                  >
                    <option value="">Chọn xe...</option>
                    {buses?.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.plateNumber} ({bus.operator.name})
                      </option>
                    ))}
                  </select>
                  <FieldError>{errors.busId?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel>Thời gian đi</FieldLabel>
                  <Input type="datetime-local" {...register('departureTime')} />
                  <FieldError>{errors.departureTime?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel>Thời gian đến (Tự động tính)</FieldLabel>
                  <Input
                    type="datetime-local"
                    {...register('arrivalTime')}
                    readOnly
                    className="bg-muted"
                  />
                  <FieldError>{errors.arrivalTime?.message}</FieldError>
                </Field>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Giá vé</h3>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-end">
                      <Field className="flex-1">
                        <FieldLabel>{`Loại ghế: ${field.seatType}`}</FieldLabel>
                        <Input
                          type="number"
                          {...register(`pricings.${index}.price`, {
                            valueAsNumber: true,
                          })}
                        />
                        <FieldError>{errors.pricings?.[index]?.price?.message}</FieldError>
                      </Field>
                      <input type="hidden" {...register(`pricings.${index}.seatType`)} />
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createTrip.isPending || updateTrip.isPending}
                >
                  {createTrip.isPending || updateTrip.isPending
                    ? 'Đang xử lý...'
                    : editingTrip
                      ? 'Cập nhật'
                      : 'Tạo Chuyến đi'}
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Chuyến đi</CardTitle>
        </CardHeader>
        <CardContent>
          <GenericTable<Trip>
            data={sortedPaged.data}
            columns={columns}
            isLoading={isLoadingTrips}
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
            getRowId={(trip) => trip.id}
          />
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deletingTrip}
        onOpenChange={(open: boolean) => !open && setDeletingTrip(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Chuyến đi này sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {deleteTrip.isPending ? 'Đang xóa...' : 'Xóa'}
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
              Chuyến đi này đang có các vé đã đặt. Bạn có muốn xóa BẮT BUỘC không? Hành động này sẽ
              xóa tất cả các vé liên quan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleForceDelete}
            >
              {deleteTrip.isPending ? 'Đang xóa...' : 'Xóa bắt buộc'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TripStopsDialog
        trip={managingStopsTrip}
        open={!!managingStopsTrip}
        onOpenChange={(open: boolean) => !open && setManagingStopsTrip(null)}
      />
    </div>
  );
};
