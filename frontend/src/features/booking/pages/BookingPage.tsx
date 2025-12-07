import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { Loader2, ArrowLeft, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useBookingStore } from "../store";
import { bookingApi } from "../api";
import { BookingSeatMap } from "../components/BookingSeatMap";
import { format } from "date-fns";
import { useAuthStore } from "@/store/auth-store";

export const BookingPage = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const { initialize, cleanup, seatStatusMap } = useBookingStore(
    useShallow((state) => ({
      initialize: state.initialize,
      cleanup: state.cleanup,
      seatStatusMap: state.seatStatusMap,
    }))
  );

  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => bookingApi.getTrip(tripId!),
    enabled: !!tripId,
  });

  useEffect(() => {
    if (tripId) {
      initialize(tripId);
    }
    return () => cleanup();
  }, [tripId, initialize, cleanup]);

  if (isLoading || !trip) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Calculate selected seats and price
  const mySelectedSeats = Object.entries(seatStatusMap)
    .filter(([, status]) => status === `LOCKED:${user?.id}`)
    .map(([seatCode]) => seatCode);

  const handleContinue = () => {
    // Navigate to payment or confirmation
    // navigate(`/booking/${tripId}/payment`);
    alert(`Booking ${mySelectedSeats.join(", ")}`);
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 pl-0">
        <ArrowLeft className="h-4 w-4" />
        Quay lại tìm kiếm
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chọn ghế</CardTitle>
            </CardHeader>
            <CardContent>
              {trip.bus.busLayoutId ? (
                <BookingSeatMap busLayoutId={trip.bus.busLayoutId} />
              ) : (
                 <div className="text-center text-muted-foreground py-8">
                    Không tìm thấy sơ đồ ghế cho chuyến đi này.
                 </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chuyến đi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Tuyến đường</div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-semibold">
                    {trip.route.originStation.name} - {trip.route.destinationStation.name}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <div className="text-sm font-medium text-muted-foreground">Khởi hành</div>
                   <div className="flex items-center gap-2">
                     <Clock className="h-4 w-4 text-primary" />
                     <span>{format(new Date(trip.departureTime), "HH:mm")}</span>
                   </div>
                   <div className="text-xs text-muted-foreground">
                      {format(new Date(trip.departureTime), "dd/MM/yyyy")}
                   </div>
                </div>
                 <div className="space-y-1">
                   <div className="text-sm font-medium text-muted-foreground">Dự kiến đến</div>
                   <div className="flex items-center gap-2">
                     <Clock className="h-4 w-4 text-primary" />
                     <span>{format(new Date(trip.arrivalTime), "HH:mm")}</span>
                   </div>
                   <div className="text-xs text-muted-foreground">
                      {format(new Date(trip.arrivalTime), "dd/MM/yyyy")}
                   </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Xe</div>
                <div>{trip.bus.plateNumber}</div>
                <div className="text-sm text-muted-foreground">{trip.bus.operator.name}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-lg">
             <CardHeader className="bg-primary/5 pb-4">
               <CardTitle className="text-lg">Ghế đã chọn</CardTitle>
             </CardHeader>
             <CardContent className="pt-6">
                {mySelectedSeats.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {mySelectedSeats.map(seat => (
                            <div key={seat} className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium">
                                {seat}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Chưa chọn ghế nào</p>
                )}
             </CardContent>
             <CardFooter className="flex-col gap-4 border-t pt-6">
                <div className="flex w-full items-center justify-between">
                    <span className="text-muted-foreground">Tổng cộng</span>
                    <span className="text-xl font-bold">
                        -- đ
                    </span>
                </div>
                <Button 
                    className="w-full" 
                    size="lg" 
                    disabled={mySelectedSeats.length === 0}
                    onClick={handleContinue}
                >
                    Tiếp tục thanh toán
                </Button>
             </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
