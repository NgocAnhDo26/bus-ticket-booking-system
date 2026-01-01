import { useCallback, useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { format } from 'date-fns';
import {
  ArrowRight,
  Calendar,
  Clock,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { TripPassengersDialog } from '../components/TripPassengersDialog';
import {
  useDeleteTrip,
  useTrips,
 // Added useStations hook
} from '../hooks';
import { type Trip } from '../types';

export const TripManagementPage = () => {
  const queryClient = useQueryClient();
  const { data: trips, isLoading: isLoadingTrips } = useTrips();
  const deleteTrip = useDeleteTrip();
  const navigate = useNavigate();

  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Other dialog states
  const [viewingPassengersTrip, setViewingPassengersTrip] = useState<Trip | null>(null);
  const [forceDeleteId, setForceDeleteId] = useState<string | null>(null);

  // Handlers


  const handleEdit = useCallback((trip: Trip) => {
    navigate(`/admin/catalog/trips/edit/${trip.id}`);
  }, [navigate]);



  const handleDelete = () => {
    if (selectedTrip) {
      deleteTrip.mutate(
        { id: selectedTrip.id },
        {
          onSuccess: () => {
            setSelectedTrip(null);
            setIsDeleteDialogOpen(false);
            toast.success('Chuyến đi đã được xóa thành công!');
          },
          onError: (error: Error) => {
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 409) {
              setForceDeleteId(selectedTrip.id);
              setSelectedTrip(null);
              setIsDeleteDialogOpen(false);
            } else {
              toast.error('Xóa chuyến đi thất bại.', {
                description: axiosError.response?.data
                  ? (axiosError.response.data as { message: string }).message
                  : axiosError.message,
              });
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
            toast.success('Chuyến đi và các vé liên quan đã được xóa thành công!');
          },
          onError: (error: Error) => {
            const axiosError = error as AxiosError;
            toast.error('Xóa bắt buộc chuyến đi thất bại.', {
              description: axiosError.response?.data
                ? (axiosError.response.data as { message: string }).message
                : axiosError.message,
            });
          },
        },
      );
    }
  };

  // Pagination & Sorting logic
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

                <DropdownMenuItem onClick={() => setViewingPassengersTrip(trip)}>
                  <Users className="mr-2 h-4 w-4" />
                  Danh sách hành khách
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(trip)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Sửa thông tin
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedTrip(trip);
                    setIsDeleteDialogOpen(true);
                  }}
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Chuyến xe</h1>
          <p className="text-muted-foreground">
            Quản lý lịch trình, giá vé và thông tin chuyến xe.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/catalog/trips/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm Chuyến xe
        </Button>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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

      {/* Force Delete Confirmation */}
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

      {/* Passengers List Dialog */}
      <TripPassengersDialog
        trip={viewingPassengersTrip}
        open={!!viewingPassengersTrip}
        onOpenChange={(open: boolean) => !open && setViewingPassengersTrip(null)}
      />
    </div>
  );
};
