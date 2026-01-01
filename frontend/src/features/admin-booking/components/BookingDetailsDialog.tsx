import { format } from 'date-fns';
import { Bus, Calendar, CreditCard, MapPin, Phone, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type BookingResponse } from '@/features/booking/types';

interface BookingDetailsDialogProps {
  booking: BookingResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BookingDetailsDialog = ({
  booking,
  open,
  onOpenChange,
}: BookingDetailsDialogProps) => {
  if (!booking) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Chi tiết đặt vé</span>
            <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 border-b pb-4">
            <div>
              <p className="text-sm text-muted-foreground">Mã vé</p>
              <p className="text-xl font-bold">{booking.code}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Ngày tạo</p>
              <p className="font-medium">
                {format(new Date(booking.createdAt), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
          </div>

          {/* Passenger Info */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" /> Thông tin Hành khách
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Tên</p>
                <p className="font-medium">{booking.passengerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số điện thoại</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <p className="font-medium">{booking.passengerPhone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trip Info */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Bus className="h-4 w-4" /> Chi tiết Chuyến đi
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tuyến đường</p>
                  <p className="font-medium">
                    {booking.trip.route.originStation.city} -{' '}
                    {booking.trip.route.destinationStation.city}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Ngày đi</p>
                  <div className="flex items-center gap-1 justify-end">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <p className="font-medium">
                      {format(new Date(booking.trip.departureTime), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>
                  {booking.trip.route.originStation.name} ➔{' '}
                  {booking.trip.route.destinationStation.name}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Xe: </span>
                <span className="font-medium">
                  {booking.trip.bus.plateNumber} ({booking.trip.bus.operatorName})
                </span>
              </div>
            </div>
          </div>

          {/* Ticket Info */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Vé & Thanh toán
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left">Ghế</th>
                    <th className="p-2 text-left">Hành khách</th>
                    <th className="p-2 text-right">Giá</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-t">
                      <td className="p-2 font-medium">{ticket.seatCode}</td>
                      <td className="p-2">
                        {ticket.passengerName}
                        {ticket.passengerPhone && (
                          <span className="text-muted-foreground text-xs block">
                            {ticket.passengerPhone}
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(ticket.price)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/20 font-bold">
                    <td className="p-2 text-right" colSpan={2}>
                      Tổng tiền
                    </td>
                    <td className="p-2 text-right">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(booking.totalPrice)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
