import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Calendar, Clock, Edit2, Eye, X } from 'lucide-react';

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
import { Card, CardContent } from '@/components/ui/card';

import { getRefundEstimate } from '../api';
import type { BookingResponse, RefundCalculation } from '../types';
import { BookingEditDialog } from './BookingEditDialog';

type BookingCardProps = {
  booking: BookingResponse;
  onCancel?: (id: string) => void;
  isCancelling?: boolean;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const statusConfig = {
  PENDING: {
    label: 'Chờ thanh toán',
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-700',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-700',
  },
  CANCELLED: {
    label: 'Đã hủy',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-700',
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    variant: 'destructive' as const,
    className: 'bg-purple-100 text-purple-700',
  },
};

export const BookingCard = ({ booking, onCancel, isCancelling }: BookingCardProps) => {
  const [showEdit, setShowEdit] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [refundData, setRefundData] = useState<RefundCalculation | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const status = statusConfig[booking.status];
  const canCancel =
    booking.status !== 'CANCELLED' && new Date(booking.trip.departureTime) > new Date();

  const canEdit = booking.status === 'PENDING';

  const handleCancelConfirm = () => {
    if (onCancel) {
      onCancel(booking.id);
      setShowCancelDialog(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow p-0">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Left: Trip Info */}
            <div className="flex-1 p-4 space-y-3">
              {/* Header with ID and status */}

              <div className="flex items-center gap-2">
                <p className="font-mono font-bold text-lg">#{booking.code}</p>
                <Badge className={status.className}>{status.label}</Badge>
              </div>

              {/* Route */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="w-0.5 h-6 bg-gray-200" />
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-sm">{booking.trip.route.originStation.name}</p>
                    <span className="text-sm text-muted-foreground">
                      {' '}
                      ({booking.pickupStation?.name})
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <p className="font-medium text-sm">
                      {booking.trip.route.destinationStation.name}
                    </p>
                    <span className="text-sm text-muted-foreground">
                      {' '}
                      ({booking.dropoffStation?.name})
                    </span>
                  </div>
                </div>
              </div>

              {/* Date and Time */}
              <div className="flex items-center gap-4 text-sm mt-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(booking.trip.departureTime)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatTime(booking.trip.departureTime)}</span>
                </div>
              </div>

              {/* Seats */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Ghế:</span>
                {booking.tickets.map((ticket) => (
                  <Badge key={ticket.id} variant="outline" className="font-mono">
                    {ticket.seatCode}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Right: Price and Actions */}
            <div className="p-4 flex flex-col justify-between md:w-48 border-t md:border-t-0 md:border-l">
              <div>
                <p className="text-sm text-muted-foreground">Tổng tiền</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(booking.totalPrice)}
                </p>
                <p className="text-xs text-muted-foreground">{booking.tickets.length} vé</p>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/booking/confirmation/${booking.id}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    Chi tiết
                  </Link>
                </Button>

                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
                    <Edit2 className="h-4 w-4 mr-1" />
                    Sửa
                  </Button>
                )}

                {onCancel && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={!canCancel || isCancelling}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {isCancelling ? 'Đang hủy...' : 'Hủy vé'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <BookingEditDialog booking={booking} open={showEdit} onOpenChange={setShowEdit} />

      {onCancel && (
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader className="space-y-4">
              <AlertDialogTitle>Xác nhận hủy vé</AlertDialogTitle>

              <AlertDialogDescription>
                Bạn có chắc chắn muốn hủy đặt vé{' '}
                <span className="font-mono font-bold">#{booking.code}</span>?
              </AlertDialogDescription>

              {!refundData && !loadingEstimate && (
                <div className="py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        setLoadingEstimate(true);
                        const est = await getRefundEstimate(booking.id);
                        setRefundData(est);
                      } catch (e) {
                        console.error('Failed to load estimate', e);
                      } finally {
                        setLoadingEstimate(false);
                      }
                    }}
                    className="p-0 h-auto text-blue-600 underline"
                  >
                    Xem chính sách hoàn tiền
                  </Button>
                </div>
              )}

              {loadingEstimate && (
                <p className="text-sm text-muted-foreground">Đang tính toán hoàn tiền...</p>
              )}

              {refundData && (
                <div className="bg-muted p-4 rounded-md text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Số tiền hoàn lại ({refundData.refundPercentage}%):</span>
                    <span className="font-bold">{formatCurrency(refundData.refundAmount)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                    {refundData.policyDescription}
                  </p>
                  {refundData.isRefundable && (
                    <p className="text-xs text-green-600 mt-1">
                      *Số tiền sẽ được hoàn về phương thức thanh toán ban đầu.
                    </p>
                  )}
                </div>
              )}

              <p className="text-sm text-muted-foreground mt-2">
                Hành động này không thể hoàn tác.
              </p>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCancelling}>Không</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleCancelConfirm}
                disabled={isCancelling}
              >
                {isCancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
