import { format } from 'date-fns';
import { Eye, RotateCcw, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { type BookingResponse } from '../types';

interface BookingTableProps {
  bookings: BookingResponse[];
  onViewDetails: (booking: BookingResponse) => void;
  onRefund: (booking: BookingResponse) => void;
  onCancel: (booking: BookingResponse) => void;
  isRefunding?: boolean;
  isCancelling?: boolean;
}

export const BookingTable = ({
  bookings,
  onViewDetails,
  onRefund,
  onCancel,
  isRefunding,
  isCancelling,
}: BookingTableProps) => {
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
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="h-12 px-4 text-left font-medium text-muted-foreground">Code</th>
            <th className="h-12 px-4 text-left font-medium text-muted-foreground">Passenger</th>
            <th className="h-12 px-4 text-left font-medium text-muted-foreground">Trip</th>
            <th className="h-12 px-4 text-left font-medium text-muted-foreground">Date</th>
            <th className="h-12 px-4 text-left font-medium text-muted-foreground">Status</th>
            <th className="h-12 px-4 text-right font-medium text-muted-foreground">Amount</th>
            <th className="h-12 px-4 text-right font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-8 text-center text-muted-foreground">
                No bookings found.
              </td>
            </tr>
          ) : (
            bookings.map((booking) => (
              <tr key={booking.id} className="border-b hover:bg-muted/50 transition-colors">
                <td className="p-4 font-medium">{booking.code}</td>
                <td className="p-4">
                  <div className="font-medium">{booking.passengerName}</div>
                  <div className="text-xs text-muted-foreground">{booking.passengerPhone}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium">
                    {booking.trip.route.originStation.city} -{' '}
                    {booking.trip.route.destinationStation.city}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {booking.trip.bus.operatorName}
                  </div>
                </td>
                <td className="p-4">
                  {format(new Date(booking.createdAt), 'dd/MM/yyyy')}
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(booking.createdAt), 'HH:mm')}
                  </div>
                </td>
                <td className="p-4">
                  <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                </td>
                <td className="p-4 text-right font-medium">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(booking.totalPrice)}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewDetails(booking)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View Details</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {booking.status === 'CONFIRMED' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRefund(booking)}
                              disabled={isRefunding}
                              className="text-orange-500 hover:text-orange-600 hover:bg-orange-100"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Refund Booking</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {booking.status === 'PENDING' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onCancel(booking)}
                              disabled={isCancelling}
                              className="text-red-500 hover:text-red-600 hover:bg-red-100"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Cancel Booking</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
