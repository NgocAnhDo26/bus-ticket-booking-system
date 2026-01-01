import { useCallback, useMemo, useState } from 'react';

import { format } from 'date-fns';
import { Eye, MoreHorizontal, RotateCcw, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { type ColumnDef, GenericTable } from '@/components/common/GenericTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCancelBooking } from '@/features/booking/hooks';

import { BookingDetailsDialog } from '../components/BookingDetailsDialog';
import { BookingFilter } from '../components/BookingFilter';
import { useAdminBookings, useRefundBooking } from '../hooks';
import { type AdminBookingFilters, type BookingResponse } from '../types';

export const BookingManagementPage = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<AdminBookingFilters>({});

  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // API expects 0-based page index
  const { data, isLoading } = useAdminBookings({ ...filters, page: page - 1, size: pageSize });
  const refundMutation = useRefundBooking();
  const cancelMutation = useCancelBooking();

  const handleFilterChange = (newFilters: AdminBookingFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page
  };

  const handleViewDetails = useCallback((booking: BookingResponse) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  }, []);

  const handleRefund = useCallback(
    async (booking: BookingResponse) => {
      if (
        confirm(`Bạn có chắc chắn muốn hoàn vé ${booking.code}? Thao tác này sẽ giải phóng ghế.`)
      ) {
        try {
          await refundMutation.mutateAsync(booking.id);
          toast.success('Hoàn vé thành công');
        } catch (error) {
          toast.error('Hoàn vé thất bại');
          console.error(error);
        }
      }
    },
    [refundMutation],
  );

  const handleCancel = useCallback(
    async (booking: BookingResponse) => {
      if (confirm(`Bạn có chắc chắn muốn hủy vé ${booking.code}?`)) {
        try {
          await cancelMutation.mutateAsync(booking.id);
          toast.success('Hủy vé thành công');
        } catch (error) {
          toast.error('Hủy vé thất bại');
          console.error(error);
        }
      }
    },
    [cancelMutation],
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-500 hover:bg-green-600';
      case 'PENDING':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'CANCELLED':
        return 'bg-red-500 hover:bg-red-600';
      case 'REFUNDED':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-primary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'PENDING':
        return 'Đang chờ';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'REFUNDED':
        return 'Đã hoàn tiền';
      default:
        return status;
    }
  };

  const columns: ColumnDef<BookingResponse>[] = useMemo(
    () => [
      {
        key: 'code',
        header: 'Mã vé',
        className: 'font-medium',
      },
      {
        key: 'passengerName',
        header: 'Hành khách',
        cell: (booking) => (
          <div>
            <div className="font-medium">{booking.passengerName}</div>
            <div className="text-xs text-muted-foreground">{booking.passengerPhone}</div>
          </div>
        ),
      },
      {
        key: 'trip', // This key doesn't matter much for cell rendering but needed specifically
        header: 'Chuyến đi',
        cell: (booking) => (
          <div>
            <div className="font-medium">
              {booking.trip.route.originStation.city} - {booking.trip.route.destinationStation.city}
            </div>
            <div className="text-xs text-muted-foreground">{booking.trip.bus.operatorName}</div>
          </div>
        ),
      },
      {
        key: 'createdAt',
        header: 'Ngày đặt',
        cell: (booking) => (
          <div>
            {format(new Date(booking.createdAt), 'dd/MM/yyyy')}
            <div className="text-xs text-muted-foreground">
              {format(new Date(booking.createdAt), 'HH:mm')}
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Trạng thái',
        cell: (booking) => (
          <Badge className={getStatusColor(booking.status)}>{getStatusLabel(booking.status)}</Badge>
        ),
      },
      {
        key: 'totalPrice',
        header: 'Tổng tiền',
        cell: (booking) => (
          <div className="font-medium">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(booking.totalPrice)}
          </div>
        ),
      },
      {
        key: 'actions',
        header: '',
        cell: (booking) => {
          const shouldDisableRefund = booking.status !== 'CONFIRMED' || refundMutation.isPending;
          const shouldDisableCancel = booking.status !== 'PENDING' || cancelMutation.isPending;

          return (
            <div className="flex justify-start">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[150px]">
                  <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleViewDetails(booking)}
                    className="cursor-pointer"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Xem chi tiết
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleRefund(booking)}
                    disabled={shouldDisableRefund}
                    className={
                      shouldDisableRefund
                        ? 'text-muted-foreground'
                        : 'text-orange-600 focus:text-orange-600 cursor-pointer'
                    }
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Hoàn vé
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleCancel(booking)}
                    disabled={shouldDisableCancel}
                    className={
                      shouldDisableCancel
                        ? 'text-muted-foreground'
                        : 'text-red-600 focus:text-red-600 cursor-pointer'
                    }
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Hủy vé
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [
      refundMutation.isPending,
      cancelMutation.isPending,
      handleRefund,
      handleCancel,
      handleViewDetails,
    ],
  );

  return (
    <div className="flex flex-col gap-8 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Đặt vé</h1>
          <p className="text-muted-foreground">
            Xem và quản lý tất cả các đơn đặt vé của khách hàng
          </p>
        </div>
      </div>

      <BookingFilter filters={filters} onFilterChange={handleFilterChange} />

      <div>
        <GenericTable
          data={data?.content || []}
          columns={columns}
          isLoading={isLoading}
          meta={{
            total: data?.totalElements || 0,
            page: page,
            pageSize: pageSize,
            totalPages: Math.max(1, data?.totalPages || 1),
          }}
          pageIndex={page}
          pageSize={pageSize}
          sorting={{ key: null, direction: 'asc' }}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onSort={() => {}}
          getRowId={(row) => row.id}
        />
      </div>

      <BookingDetailsDialog
        booking={selectedBooking}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
};
