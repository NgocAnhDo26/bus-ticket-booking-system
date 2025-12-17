import { Link, useNavigate, useParams } from 'react-router-dom';

import { CheckCircle2, Clock, Download, Home, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

import { useBookingById, useCancelBooking, useConfirmBooking } from '../hooks';
import { generateETicketPDF } from '../utils/generate-eticket';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
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
    label: 'Chờ xác nhận',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    iconClassName: 'text-yellow-600',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-700 border-green-200',
    iconClassName: 'text-green-600',
  },
  CANCELLED: {
    label: 'Đã hủy',
    icon: XCircle,
    className: 'bg-red-100 text-red-700 border-red-200',
    iconClassName: 'text-red-600',
  },
};

export const BookingConfirmationPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { data: booking, isLoading, error } = useBookingById(bookingId);
  const confirmMutation = useConfirmBooking();
  const cancelMutation = useCancelBooking();

  const handleConfirm = async () => {
    if (!bookingId) return;
    try {
      await confirmMutation.mutateAsync(bookingId);
      toast({
        title: 'Xác nhận thành công',
        description: 'Đặt vé của bạn đã được xác nhận.',
      });
    } catch {
      toast({
        title: 'Xác nhận thất bại',
        description: 'Có lỗi xảy ra, vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async () => {
    if (!bookingId) return;
    try {
      await cancelMutation.mutateAsync(bookingId);
      toast({
        title: 'Hủy vé thành công',
        description: 'Đặt vé của bạn đã được hủy.',
      });
    } catch {
      toast({
        title: 'Hủy vé thất bại',
        description: 'Có lỗi xảy ra, vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 max-w-2xl space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto p-8 max-w-2xl text-center space-y-6">
        <XCircle className="h-16 w-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">Không tìm thấy đặt vé</h1>
        <p className="text-muted-foreground">Đặt vé không tồn tại hoặc đã bị xóa.</p>
        <Button onClick={() => navigate('/')}>
          <Home className="mr-2 h-4 w-4" />
          Về trang chủ
        </Button>
      </div>
    );
  }

  const status = statusConfig[booking.status];
  const StatusIcon = status.icon;
  const canConfirm = booking.status === 'PENDING';
  const isConfirmed = booking.status === 'CONFIRMED';
  const canCancel =
    booking.status !== 'CANCELLED' && new Date(booking.trip.departureTime) > new Date();

  return (
    <div className="container mx-auto p-4 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center pb-2">
          <div
            className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${status.className}`}
          >
            <StatusIcon className={`h-6 w-6 ${status.iconClassName}`} />
          </div>
          <CardTitle className="text-xl font-bold">{status.label}</CardTitle>
          <p className="text-lg font-mono font-bold text-primary mt-1">{booking.code}</p>
          <p className="text-xs text-muted-foreground">Mã đặt vé</p>
        </CardHeader>

        <div className="px-6">
          <div className="border-b-2 border-dashed my-2" />
        </div>

        <CardContent className="space-y-4 pt-2">
          {/* Amount */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Tổng thanh toán</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(booking.totalPrice)}</p>
          </div>

          {/* Trip Brief */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nhà xe</span>
              <span className="font-medium">{booking.trip.bus.operatorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tuyến</span>
              <span className="font-medium text-right max-w-[200px]">
                {booking.trip.route.originStation.city} -{' '}
                {booking.trip.route.destinationStation.city}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Khởi hành</span>
              <span className="font-medium">
                {formatTime(booking.trip.departureTime)}, {formatDate(booking.trip.departureTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ghế ({booking.tickets.length})</span>
              <span className="font-medium">
                {booking.tickets.map((t) => t.seatCode).join(', ')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            {canConfirm && (
              <>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleConfirm}
                  disabled={confirmMutation.isPending}
                >
                  {confirmMutation.isPending ? 'Đang xử lý...' : 'Thanh toán ngay'}
                </Button>
                <p className="text-xs text-center text-muted-foreground px-4">
                  *Đây là giả lập thanh toán. Vé sẽ được gửi qua email sau khi thanh toán thành
                  công.
                </p>
              </>
            )}

            {isConfirmed && (
              <>
                <Button className="w-full" onClick={() => generateETicketPDF(booking)}>
                  <Download className="mr-2 h-4 w-4" />
                  Tải vé điện tử
                </Button>
                <p className="text-xs text-center text-green-600 font-medium">
                  Đã gửi vé về email của bạn!
                </p>
              </>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/">Trang chủ</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/bookings">Lịch sử</Link>
              </Button>
            </div>

            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:text-destructive h-8"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
              >
                Hủy đặt vé
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
