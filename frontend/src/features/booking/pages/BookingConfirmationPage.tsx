import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useBookingById, useConfirmBooking, useCancelBooking } from "../hooks";
import { generateETicketPDF } from "../utils/generate-eticket";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Bus,
  Download,
  ArrowLeft,
  Home,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

const statusConfig = {
  PENDING: {
    label: "Chờ xác nhận",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    iconClassName: "text-yellow-600",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-700 border-green-200",
    iconClassName: "text-green-600",
  },
  CANCELLED: {
    label: "Đã hủy",
    icon: XCircle,
    className: "bg-red-100 text-red-700 border-red-200",
    iconClassName: "text-red-600",
  },
};

export function BookingConfirmationPage() {
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
        title: "Xác nhận thành công",
        description: "Đặt vé của bạn đã được xác nhận.",
      });
    } catch {
      toast({
        title: "Xác nhận thất bại",
        description: "Có lỗi xảy ra, vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async () => {
    if (!bookingId) return;
    try {
      await cancelMutation.mutateAsync(bookingId);
      toast({
        title: "Hủy vé thành công",
        description: "Đặt vé của bạn đã được hủy.",
      });
    } catch {
      toast({
        title: "Hủy vé thất bại",
        description: "Có lỗi xảy ra, vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy đặt vé</h1>
        <p className="text-muted-foreground mb-6">
          Đặt vé không tồn tại hoặc đã bị xóa.
        </p>
        <Button onClick={() => navigate("/")}>
          <Home className="mr-2 h-4 w-4" />
          Về trang chủ
        </Button>
      </div>
    );
  }

  const status = statusConfig[booking.status];
  const StatusIcon = status.icon;
  const canConfirm = booking.status === "PENDING";
  const canCancel =
    booking.status !== "CANCELLED" &&
    new Date(booking.trip.departureTime) > new Date();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại
      </Button>

      {/* Status Card */}
      <Card className={`mb-6 border-2 ${status.className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <StatusIcon className={`h-12 w-12 ${status.iconClassName}`} />
            <div>
              <p className="text-sm font-medium">Trạng thái đặt vé</p>
              <h2 className="text-2xl font-bold">{status.label}</h2>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking ID */}
      <Card className="mb-6">
        <CardHeader className="text-center pb-2">
          <p className="text-sm text-muted-foreground">Mã đặt vé</p>
          <CardTitle className="text-3xl font-mono tracking-wider">
            #{booking.id.slice(0, 8).toUpperCase()}
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-4">
          {/* Trip Info */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center pt-1">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-0.5 h-10 bg-gray-200" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="font-semibold">{booking.trip.route.originStation.name}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.trip.route.originStation.city}
                </p>
              </div>
              <div>
                <p className="font-semibold">{booking.trip.route.destinationStation.name}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.trip.route.destinationStation.city}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Ngày đi</p>
                <p className="font-medium">{formatDate(booking.trip.departureTime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Giờ khởi hành</p>
                <p className="font-medium">{formatTime(booking.trip.departureTime)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Bus Info */}
          <div className="flex items-center gap-2">
            <Bus className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Nhà xe</p>
              <p className="font-medium">{booking.trip.bus.operatorName}</p>
            </div>
          </div>

          <Separator />

          {/* Tickets */}
          <div>
            <p className="font-medium mb-3">Vé ({booking.tickets.length})</p>
            <div className="space-y-2">
              {booking.tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex justify-between items-center p-3 bg-muted rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {ticket.seatCode}
                      </Badge>
                      <span className="font-medium">{ticket.passengerName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{ticket.passengerPhone}</p>
                  </div>
                  <span className="font-semibold">{formatCurrency(ticket.price)}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-lg font-semibold">Tổng tiền</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(booking.totalPrice)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {canConfirm && (
          <Button
            className="w-full"
            size="lg"
            onClick={handleConfirm}
            disabled={confirmMutation.isPending}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            {confirmMutation.isPending ? "Đang xác nhận..." : "Xác nhận thanh toán"}
          </Button>
        )}

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => generateETicketPDF(booking)}
        >
          <Download className="mr-2 h-4 w-4" />
          Tải vé điện tử (PDF)
        </Button>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <Link to="/dashboard">Lịch sử đặt vé</Link>
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link to="/">Trang chủ</Link>
          </Button>
        </div>

        {canCancel && (
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
          >
            <XCircle className="mr-2 h-4 w-4" />
            {cancelMutation.isPending ? "Đang hủy..." : "Hủy đặt vé"}
          </Button>
        )}
      </div>
    </div>
  );
}
