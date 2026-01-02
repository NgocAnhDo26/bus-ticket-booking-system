import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, Clock, Download, Home, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewForm } from '@/features/reviews/components/ReviewForm';
import { StarRating } from '@/features/reviews/components/StarRating';
import { useReviewByBookingId } from '@/features/reviews/hooks';
import { useAuthStore } from '@/store/auth-store';

import { verifyPayment } from '../api';
import { useBookingById, useCancelBooking, useCreatePayment } from '../hooks';
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
    label: 'Chờ thanh toán',
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
  REFUNDED: {
    label: 'Đã hoàn tiền',
    icon: AlertCircle,
    className: 'bg-purple-100 text-purple-700 border-purple-200',
    iconClassName: 'text-purple-600',
  },
};

export const BookingConfirmationPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: booking, isLoading, error } = useBookingById(bookingId);
  const paymentMutation = useCreatePayment();
  const cancelMutation = useCancelBooking();
  const [isVerifying, setIsVerifying] = useState(false);

  // Check if user is authenticated
  const user = useAuthStore((state) => state.user);

  // Check if review already exists
  const { data: existingReview } = useReviewByBookingId(bookingId);

  // Check if review form should be shown
  // Note: We check if trip departure time has passed as a heuristic for completed trips
  // The backend will validate that trip is actually COMPLETED
  const tripDepartureTime = booking?.trip?.departureTime
    ? new Date(booking.trip.departureTime)
    : null;
  const isTripLikelyCompleted = tripDepartureTime ? tripDepartureTime < new Date() : false;

  const shouldShowReviewForm =
    user && booking && booking.status === 'CONFIRMED' && isTripLikelyCompleted && !existingReview;

  // Auto-verify payment when returning from PayOS (localhost webhook workaround)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const status = searchParams.get('status');
    const code = searchParams.get('code');

    // If returning from PayOS with PAID status, verify and update
    if (bookingId && (status === 'PAID' || code === '00')) {
      const verify = async () => {
        setIsVerifying(true);
        try {
          const res = await verifyPayment(bookingId);
          // Refetch booking
          queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });

          if (res.status === 'SUCCESS') {
            toast.success('Thanh toán thành công!', {
              description: 'Đặt vé của bạn đã được xác nhận.',
              id: 'payment-success',
            });
          } else {
            // Handle cancelled/failed returned from verification
            toast.error('Thanh toán không thành công', {
              description: 'Giao dịch đã bị hủy hoặc thất bại.',
              id: 'payment-verify-failed',
            });
          }
          // Clean URL params
          window.history.replaceState({}, '', window.location.pathname);
        } catch (err: unknown) {
          console.error('Verify payment failed:', err);
          toast.error('Lỗi xác nhận thanh toán', {
            description: 'Không thể xác nhận thanh toán. Vui lòng liên hệ hỗ trợ.',
            id: 'payment-verify-error',
          });
        } finally {
          setIsVerifying(false);
        }
      };

      // Execute async verification
      verify();
    } else if (status === 'CANCELLED' || searchParams.get('cancel') === 'true') {
      toast.error('Thanh toán bị hủy', {
        description: 'Bạn đã hủy thanh toán. Vui lòng thử lại nếu muốn tiếp tục đặt vé.',
        id: 'payment-cancelled',
      });
      // Clean URL params
      window.history.replaceState({}, '', window.location.pathname);
    } else if (status === 'EXPIRED') {
      toast.error('Thanh toán hết hạn', {
        description: 'Phiên thanh toán đã hết hạn. Vui lòng tạo thanh toán mới.',
        id: 'payment-expired',
      });
      // Clean URL params
      window.history.replaceState({}, '', window.location.pathname);
    } else if (code && code !== '00') {
      // Other error codes from PayOS
      const errorMessages: Record<string, string> = {
        '01': 'Số dư tài khoản không đủ',
        '02': 'Giao dịch bị từ chối bởi ngân hàng',
        '03': 'Thẻ đã hết hạn hoặc bị khóa',
        '04': 'Lỗi kết nối ngân hàng',
      };
      toast.error('Thanh toán thất bại', {
        description: errorMessages[code] || `Lỗi thanh toán (mã: ${code}). Vui lòng thử lại.`,
        id: 'payment-failed',
      });
      // Clean URL params
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [bookingId, queryClient]);

  const handlePayment = async () => {
    if (!bookingId) return;
    try {
      const payment = await paymentMutation.mutateAsync({
        bookingId,
        returnUrl: `${window.location.origin}/booking/confirmation/${bookingId}`,
        cancelUrl: `${window.location.origin}/booking/confirmation/${bookingId}`,
      });

      // Redirect to PayOS checkout page
      if (payment.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
      }
    } catch {
      toast.error('Tạo thanh toán thất bại', {
        description: 'Có lỗi xảy ra, vui lòng thử lại.',
        id: 'payment-create-error',
      });
    }
  };

  const handleCancel = async () => {
    if (!bookingId) return;
    try {
      await cancelMutation.mutateAsync(bookingId);
      toast.success('Hủy vé thành công', {
        description: 'Đặt vé của bạn đã được hủy.',
        id: 'booking-cancel-success',
      });
    } catch {
      toast.error('Hủy vé thất bại', {
        description: 'Có lỗi xảy ra, vui lòng thử lại.',
        id: 'booking-cancel-error',
      });
    }
  };

  if (isLoading || isVerifying) {
    return (
      <div className="container mx-auto p-8 max-w-2xl space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !booking) {
    console.error('Booking load error:', error);
    return (
      <div className="container mx-auto p-8 max-w-2xl text-center space-y-6">
        <XCircle className="h-16 w-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">Không tìm thấy đặt vé</h1>
        <p className="text-muted-foreground">Đặt vé không tồn tại hoặc đã bị xóa.</p>
        {error && <p className="text-xs text-red-500">Lỗi: {(error as Error).message}</p>}
        <Button onClick={() => navigate('/')}>
          <Home className="mr-2 h-4 w-4" />
          Về trang chủ
        </Button>
      </div>
    );
  }

  const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.PENDING;
  const StatusIcon = status.icon;
  const canPay = booking.status === 'PENDING';
  const isPaid = booking.status === 'CONFIRMED';

  const canCancel =
    booking.status !== 'CANCELLED' && new Date(booking.trip.departureTime) > new Date();

  return (
    <div className="container mx-auto p-4 lg:p-8">
      <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto items-start">
        {/* Booking Card - Left/Top */}
        <Card className="w-full shadow-lg border-t-4 border-t-primary">
          <CardHeader className="text-center pb-2">
            <div
              className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${status.className}`}
            >
              <StatusIcon className={`h-6 w-6 ${status.iconClassName}`} />
            </div>
            <CardTitle className="text-xl font-bold">{status.label}</CardTitle>
            <p className="text-lg font-mono font-bold text-primary mt-1">{booking.code}</p>
            <p className="text-xs text-muted-foreground">Mã đặt vé</p>

            <div className="mt-4 flex justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.code}`}
                alt="QR Code"
                className="border p-2 rounded-lg"
              />
            </div>
          </CardHeader>

          <div className="px-6">
            <div className="border-b-2 border-dashed my-2" />
          </div>

          <CardContent className="space-y-4 pt-2">
            {/* Amount */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Tổng thanh toán</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(booking.totalPrice)}
              </p>
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
              {booking.pickupStation && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Điểm đón</span>
                  <span className="font-medium text-right">{booking.pickupStation.name}</span>
                </div>
              )}
              {booking.dropoffStation && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Điểm trả</span>
                  <span className="font-medium text-right">{booking.dropoffStation.name}</span>
                </div>
              )}
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
              {canPay && (
                <>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handlePayment}
                    disabled={paymentMutation.isPending}
                  >
                    {paymentMutation.isPending ? 'Đang tạo thanh toán...' : 'Thanh toán qua PayOS'}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground px-4">
                    *Bạn sẽ được chuyển đến cổng thanh toán PayOS để hoàn tất.
                  </p>
                </>
              )}

              {isPaid && (
                <>
                  <Button className="w-full" onClick={() => generateETicketPDF(booking)}>
                    <Download className="mr-2 h-4 w-4" />
                    Tải vé điện tử
                  </Button>
                  <p className="text-xs text-center text-green-600 font-medium">
                    Thanh toán thành công! Đã gửi vé về email của bạn.
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

        <Separator />

        {/* Review Section - Right/Bottom */}
        {user &&
          booking &&
          booking.status === 'CONFIRMED' &&
          (existingReview || isTripLikelyCompleted) && (
            <div className="w-full">
              {existingReview ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <CardTitle>Đánh giá của bạn</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <StarRating rating={existingReview.rating} size="md" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(existingReview.createdAt), 'dd/MM/yyyy')}
                        </span>
                      </div>
                      {existingReview.comment && (
                        <p className="text-sm text-foreground leading-relaxed">
                          {existingReview.comment}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        <span className="font-medium">{existingReview.route.originCity}</span>
                        <span className="mx-2">→</span>
                        <span className="font-medium">{existingReview.route.destinationCity}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : shouldShowReviewForm ? (
                <ReviewForm
                  bookingId={bookingId!}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['review', 'booking', bookingId] });
                  }}
                />
              ) : null}
            </div>
          )}
      </div>
    </div>
  );
};
