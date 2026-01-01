import { useCallback, useMemo, useState } from 'react';

import { Check, Loader2, Search, X } from 'lucide-react';
import { toast } from 'sonner';

import { type ColumnDef, GenericTable } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCheckInPassenger } from '@/features/booking/hooks';
import type { Trip } from '@/features/catalog/types';
import { cn } from '@/lib/utils';

import { useTripPassengers, useUpdateTripStatus } from '../hooks';
import type { TripPassenger } from '../types';

interface TripPassengersDialogProps {
  trip: Trip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TripPassengersDialog = ({ trip, open, onOpenChange }: TripPassengersDialogProps) => {
  const { data: passengers, isLoading } = useTripPassengers(trip?.id);
  const checkInPassenger = useCheckInPassenger();
  const updateTripStatus = useUpdateTripStatus();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPassengers = useMemo(() => {
    if (!passengers) return [];

    // Filter out CANCELLED bookings and apply search
    let result = passengers.filter((p) => p.bookingStatus !== 'CANCELLED');

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.passengerName.toLowerCase().includes(lower) ||
          p.passengerPhone.includes(lower) ||
          p.bookingCode.toLowerCase().includes(lower) ||
          p.seatCode.toLowerCase().includes(lower),
      );
    }

    // Stable sort by Seat Code to prevent jumping when data refreshes
    return result.sort((a, b) =>
      a.seatCode.localeCompare(b.seatCode, undefined, { numeric: true }),
    );
  }, [passengers, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    if (!passengers) return { total: 0, boarded: 0, pending: 0 };
    const activePassengers = passengers.filter((p) => p.bookingStatus !== 'CANCELLED');
    return {
      total: activePassengers.length,
      boarded: activePassengers.filter((p) => p.isBoarded).length,
      pending: activePassengers.length - activePassengers.filter((p) => p.isBoarded).length,
    };
  }, [passengers]);

  const handleStatusChange = (newStatus: string) => {
    if (trip) {
      updateTripStatus.mutate({ id: trip.id, status: newStatus });
    }
  };

  const handleCheckIn = useCallback(
    (ticketId: string) => {
      toast.promise(checkInPassenger.mutateAsync(ticketId), {
        loading: 'Đang cập nhật trạng thái...',
        success: 'Cập nhật thành công!',
        error: 'Cập nhật thất bại. Vui lòng thử lại.',
      });
    },
    [checkInPassenger],
  );

  const columns: ColumnDef<TripPassenger>[] = useMemo(
    () => [
      {
        key: 'seatCode',
        header: 'Ghế',
        cell: (item) => <span className="font-bold">{item.seatCode}</span>,
      },
      {
        key: 'passengerName',
        header: 'Hành khách',
        cell: (item) => (
          <div className="flex flex-col">
            <span className="font-medium">{item.passengerName}</span>
            <span className="text-xs text-muted-foreground">{item.passengerPhone}</span>
          </div>
        ),
      },
      {
        key: 'bookingCode',
        header: 'Mã vé',
        cell: (item) => (
          <div className="flex flex-col">
            <span>{item.bookingCode}</span>
            <Badge variant="outline" className="w-fit text-[10px]">
              {item.bookingStatus}
            </Badge>
          </div>
        ),
      },
      {
        key: 'pickupStation',
        header: 'Đón/Trả',
        cell: (item) => (
          <div className="flex flex-col text-xs">
            <span className="text-green-600">Đón: {item.pickupStation}</span>
            <span className="text-red-600">Trả: {item.dropoffStation}</span>
          </div>
        ),
      },
      {
        key: 'isBoarded',
        header: 'Lên xe',
        cell: (item) => {
          const isBoarded = item.isBoarded;
          return (
            <Button
              size="sm"
              variant={isBoarded ? 'default' : 'outline'}
              className={cn(
                'h-8 w-24 gap-1',
                isBoarded ? 'bg-green-600 hover:bg-green-700' : 'text-muted-foreground',
              )}
              onClick={() => handleCheckIn(item.ticketId)}
              disabled={checkInPassenger.isPending}
            >
              {checkInPassenger.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isBoarded ? (
                <>
                  <Check className="h-3 w-3" /> Đã lên
                </>
              ) : (
                <>
                  <X className="h-3 w-3" /> Chưa lên
                </>
              )}
            </Button>
          );
        },
      },
    ],
    [checkInPassenger, handleCheckIn],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] min-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Quản lý Chuyến đi: {trip?.route.originStation.name} -{' '}
            {trip?.route.destinationStation.name}
          </DialogTitle>
          <DialogDescription>
            {trip?.bus.plateNumber} |{' '}
            {trip?.departureTime && new Date(trip.departureTime).toLocaleString('vi-VN')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-4 py-4 border-b">
          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-center p-2 bg-muted rounded-lg w-24">
              <span className="text-xs text-muted-foreground">Tổng khách</span>
              <span className="text-xl font-bold">{stats.total}</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-green-100 dark:bg-green-900 rounded-lg w-24">
              <span className="text-xs text-green-700 dark:text-green-300">Đã lên xe</span>
              <span className="text-xl font-bold text-green-700 dark:text-green-300">
                {stats.boarded}
              </span>
            </div>
            <div className="flex flex-col items-center p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg w-24">
              <span className="text-xs text-yellow-700 dark:text-yellow-300">Chưa lên</span>
              <span className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
                {stats.pending}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Trạng thái chuyến:</span>
            <Select
              value={trip?.status}
              onValueChange={handleStatusChange}
              disabled={updateTripStatus.isPending}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SCHEDULED">Sắp diễn ra</SelectItem>
                <SelectItem value="RUNNING">Đang chạy</SelectItem>
                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                <SelectItem value="DELAYED">Hoãn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center py-2 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm hành khách (Tên, SĐT, Mã vé, Ghế)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-auto min-h-[300px]">
          <GenericTable
            data={filteredPassengers}
            columns={columns}
            isLoading={isLoading}
            meta={{
              total: filteredPassengers.length,
              page: 1,
              pageSize: 1000,
              totalPages: 1,
            }}
            pageIndex={1}
            pageSize={1000}
            sorting={{ key: null, direction: 'asc' }}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            onSort={() => {}}
            getRowId={(item) => item.ticketId}
            hidePagination={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
