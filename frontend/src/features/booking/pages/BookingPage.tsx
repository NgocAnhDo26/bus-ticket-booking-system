import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTripById } from "@/features/catalog/hooks";
import { useAuthStore } from "@/store/auth-store";
import { useCreateBooking, useBookedSeats } from "../hooks";
import type { CreateBookingRequest } from "../types";
import type { SeatType } from "@/features/catalog/types";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, ArrowLeft, CreditCard, Calendar, Clock, MapPin, Bus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type SelectedSeat = {
  seatCode: string;
  seatType: SeatType;
  price: number;
};

// Temporary seat selection - will be replaced by teammate's interactive seat map
function TempSeatSelector({
  tripPricings,
  bookedSeats,
  selectedSeats,
  onSeatToggle,
}: {
  tripPricings: Array<{ seatType: SeatType; price: number }>;
  bookedSeats: string[];
  selectedSeats: string[];
  onSeatToggle: (seatCode: string, seatType: SeatType, price: number) => void;
}) {
  const seatRows = ["A", "B", "C", "D"];
  const seatsPerRow = 4;

  const getSeatType = (row: string): SeatType => {
    return row === "A" || row === "B" ? "VIP" : "NORMAL";
  };

  const getPrice = (seatType: SeatType) => {
    const pricing = tripPricings.find((p) => p.seatType === seatType);
    return pricing?.price ?? 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 border-gray-300 bg-white" />
          <span>Trống</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary" />
          <span>Đang chọn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gray-400" />
          <span>Đã đặt</span>
        </div>
      </div>
      <div className="grid gap-2">
        {seatRows.map((row) => (
          <div key={row} className="flex items-center gap-2">
            <span className="w-8 font-medium">{row}</span>
            <div className="flex gap-2">
              {Array.from({ length: seatsPerRow }, (_, i) => {
                const seatCode = `${row}${String(i + 1).padStart(2, "0")}`;
                const isBooked = bookedSeats.includes(seatCode);
                const isSelected = selectedSeats.includes(seatCode);
                const seatType = getSeatType(row);
                const price = getPrice(seatType);

                return (
                  <button
                    key={seatCode}
                    disabled={isBooked}
                    onClick={() => onSeatToggle(seatCode, seatType, price)}
                    className={`w-10 h-10 rounded text-xs font-medium transition-colors
                      ${
                        isBooked
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : isSelected
                          ? "bg-primary text-primary-foreground"
                          : seatType === "VIP"
                          ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300 hover:bg-yellow-200"
                          : "bg-white border-2 border-gray-300 hover:bg-gray-100"
                      }
                    `}
                  >
                    {seatCode}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-sm">
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300" />
          VIP: {getPrice("VIP").toLocaleString("vi-VN")}đ
        </span>
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white border-2 border-gray-300" />
          Thường: {getPrice("NORMAL").toLocaleString("vi-VN")}đ
        </span>
      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
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

export function BookingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: trip, isLoading: tripLoading } = useTripById(tripId);
  const { data: bookedSeats = [], isLoading: seatsLoading } = useBookedSeats(tripId);
  const createBookingMutation = useCreateBooking();

  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [contactName, setContactName] = useState(user?.fullName ?? "");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    if (user) {
      setContactName(user.fullName || "");
    }
  }, [user]);

  const handleSeatToggle = useCallback(
    (seatCode: string, seatType: SeatType, price: number) => {
      setSelectedSeats((prev) => {
        const existing = prev.find((s) => s.seatCode === seatCode);
        if (existing) {
          return prev.filter((s) => s.seatCode !== seatCode);
        }
        if (prev.length >= 5) {
          toast({
            title: "Tối đa 5 ghế",
            description: "Bạn chỉ có thể chọn tối đa 5 ghế trong một lần đặt.",
            variant: "destructive",
          });
          return prev;
        }
        return [...prev, { seatCode, seatType, price }];
      });
    },
    []
  );

  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const contactValid = contactName.trim().length >= 2 && /^(0|\+84)[3-9][0-9]{8}$/.test(contactPhone);
  const canSubmit = selectedSeats.length > 0 && contactValid && user;

  const handleSubmit = async () => {
    if (!user || !trip) return;

    const request: CreateBookingRequest = {
      tripId: trip.id,
      userId: user.id,
      passengerName: contactName,
      passengerPhone: contactPhone,
      totalPrice,
      tickets: selectedSeats.map((s) => ({
        seatCode: s.seatCode,
        passengerName: contactName,
        passengerPhone: contactPhone,
        price: s.price,
      })),
    };

    try {
      const booking = await createBookingMutation.mutateAsync(request);
      toast({
        title: "Đặt vé thành công!",
        description: "Đơn đặt vé của bạn đã được tạo.",
      });
      navigate(`/booking/confirmation/${booking.id}`);
    } catch {
      toast({
        title: "Đặt vé thất bại",
        description: "Có lỗi xảy ra, vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Yêu cầu đăng nhập</AlertTitle>
          <AlertDescription>
            Bạn cần đăng nhập để đặt vé.{" "}
            <Button variant="link" className="px-0" onClick={() => navigate("/login")}>
              Đăng nhập ngay
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (tripLoading || seatsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Không tìm thấy chuyến xe</AlertTitle>
          <AlertDescription>
            Chuyến xe không tồn tại hoặc đã bị hủy.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Đặt vé xe</h1>
          <p className="text-muted-foreground">
            {trip.route.originStation.name} → {trip.route.destinationStation.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Seat Selection & Contact Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seat Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Chọn ghế</CardTitle>
            </CardHeader>
            <CardContent>
              <TempSeatSelector
                tripPricings={trip.tripPricings}
                bookedSeats={bookedSeats}
                selectedSeats={selectedSeats.map((s) => s.seatCode)}
                onSeatToggle={handleSeatToggle}
              />
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin người đặt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Họ và tên <span className="text-destructive">*</span></Label>
                  <Input
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Số điện thoại <span className="text-destructive">*</span></Label>
                  <Input
                    id="contactPhone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="0901234567"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chuyến</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Route */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{trip.route.originStation.name}</p>
                  <p className="text-sm text-muted-foreground">→ {trip.route.destinationStation.name}</p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span>{formatDate(trip.departureTime)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <span>{formatTime(trip.departureTime)} - {formatTime(trip.arrivalTime)}</span>
              </div>

              {/* Bus */}
              <div className="flex items-center gap-3">
                <Bus className="h-5 w-5 text-primary" />
                <span>{trip.bus.operator.name}</span>
              </div>

              <Separator />

              {/* Selected Seats */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Ghế đã chọn</p>
                {selectedSeats.length === 0 ? (
                  <p className="text-sm italic text-muted-foreground">Chưa chọn ghế nào</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map((seat) => (
                      <Badge key={seat.seatCode} variant="outline" className="font-mono">
                        {seat.seatCode}
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({seat.seatType === "VIP" ? "VIP" : "Thường"})
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="font-medium">Tổng tiền</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            disabled={!canSubmit || createBookingMutation.isPending}
            onClick={handleSubmit}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            {createBookingMutation.isPending ? "Đang xử lý..." : "Đặt vé ngay"}
          </Button>

          {selectedSeats.length > 0 && !contactValid && (
            <p className="text-sm text-muted-foreground text-center">
              Vui lòng nhập họ tên và số điện thoại hợp lệ
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
