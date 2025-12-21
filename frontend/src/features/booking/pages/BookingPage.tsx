import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Clock, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getBusLayout } from '@/features/bus-layout/api';

import { bookingApi, getBookingById } from '../api';
import { BookingSeatMap } from '../components/BookingSeatMap';
import { useBookingStore } from '../store';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const BookingPage = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  // const { user } = useAuthStore(); // Unused

  const {
    initialize,
    selectedSeats,
    pickupStationId,
    dropoffStationId,
    setPickupStationId,
    setDropoffStationId,
  } = useBookingStore(
    useShallow((state) => ({
      initialize: state.initialize,
      // cleanup: state.cleanup, // cleanup is not used here but in effect return?
      // seatStatusMap: state.seatStatusMap, // Unused
      selectedSeats: state.selectedSeats,
      pickupStationId: state.pickupStationId,
      dropoffStationId: state.dropoffStationId,
      setPickupStationId: state.setPickupStationId,
      setDropoffStationId: state.setDropoffStationId,
    })),
  );

  const [restoredBookingSheets, setRestoredBookingSheets] = useState<string[]>([]);

  const { data: trip, isLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => bookingApi.getTrip(tripId!),
    enabled: !!tripId,
  });

  const { data: layout } = useQuery({
    queryKey: ['bus-layout', trip?.bus?.busLayoutId],
    queryFn: () => getBusLayout(trip!.bus.busLayoutId!),
    enabled: !!trip?.bus?.busLayoutId,
  });

  useEffect(() => {
    const restoreDraft = async () => {
      const { pendingBookingId, setPendingBooking } = useBookingStore.getState();

      if (tripId) {
        // If there is a pending booking (user came back from confirmation or refresh)
        if (pendingBookingId) {
          try {
            // Fetch booking to see if it's still PENDING
            const booking = await getBookingById(pendingBookingId);

            if (booking.status === 'PENDING') {
              // Restore seats
              const bookedSeats = booking.tickets.map((t) => t.seatCode);
              setRestoredBookingSheets(bookedSeats);

              // Sync store selectedSeats if needed, BUT store might already have them persisted.
              // If store persisted them, great. If not, we might need to "re-select" them in UI.
              // But `toggleSeat` logic locks them.
              // If they are BOOKED in backend (PENDING status), we can't "Lock" them again.
              // We just need UI to show them as Selected.
              // We force them into store if missing?
              // `useBookingStore.setState({ selectedSeats: bookedSeats })` ?
              // Yes, directly updating state is cleaner for hydration.
              useBookingStore.setState({ selectedSeats: bookedSeats });

              toast.success('Khôi phục phiên đặt vé', {
                description: 'Bạn đang tiếp tục chỉnh sửa đơn đặt vé trước đó.',
              });
            } else {
              // If confirmed or cancelled, clear draft
              setPendingBooking(null, []);
              useBookingStore.setState({ selectedSeats: [] });
            }
          } catch (e) {
            console.error('Failed to restore booking', e);
            // If not found (404), clear draft
            setPendingBooking(null, []);
          }
        }

        initialize(tripId);
      }
    };

    restoreDraft();

    // Don't cleanup on unmount to persist state for next step
    // return () => cleanup();
  }, [tripId, initialize]);

  // Calculate selected seats and price
  const mySelectedSeats = selectedSeats;

  // Calculate total price based on seat types
  const { totalPrice, seatDetails } = useMemo(() => {
    if (!layout?.seats || !trip?.tripPricings) {
      return { totalPrice: 0, seatDetails: [] };
    }

    const priceMap: Record<string, number> = {};
    trip.tripPricings.forEach((p: { seatType: string; price: number }) => {
      priceMap[p.seatType] = p.price;
    });

    const seats = layout.seats || [];
    const details = mySelectedSeats.map((seatCode) => {
      const seat = seats.find((s: { seatCode: string; type: string }) => s.seatCode === seatCode);
      const seatType = seat?.type || 'NORMAL';
      const price = priceMap[seatType] || 0;
      return { seatCode, seatType, price };
    });

    const total = details.reduce((sum, d) => sum + d.price, 0);
    return { totalPrice: total, seatDetails: details };
  }, [mySelectedSeats, layout, trip]);

  const handleContinue = () => {
    if (!tripId) return;

    if (mySelectedSeats.length === 0) {
      toast.error('Chưa chọn ghế', {
        description: 'Vui lòng chọn ít nhất 1 ghế để tiếp tục.',
      });
      return;
    }

    navigate(`/booking/${tripId}/details`);
  };

  if (isLoading || !trip) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
                <BookingSeatMap
                  busLayoutId={trip.bus.busLayoutId}
                  alreadyBookedSeats={restoredBookingSheets}
                />
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
                    <span>{format(new Date(trip.departureTime), 'HH:mm')}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(trip.departureTime), 'dd/MM/yyyy')}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Dự kiến đến</div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{format(new Date(trip.arrivalTime), 'HH:mm')}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(trip.arrivalTime), 'dd/MM/yyyy')}
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

          <Card>
            <CardHeader>
              <CardTitle>Điểm đón / trả</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Điểm đón
                </label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={pickupStationId || ''}
                  onChange={(e) => {
                    setPickupStationId(e.target.value);
                    // Reset dropoff if invalid?
                    // For now just set it.
                  }}
                >
                  <option value="">Chọn điểm đón...</option>
                  <option value={trip.route.originStation.id}>
                    {trip.route.originStation.name} (00:00)
                  </option>
                  {trip.route.stops
                    ?.filter((s) => s.stopType === 'PICKUP' || s.stopType === 'BOTH')
                    .sort((a, b) => a.stopOrder - b.stopOrder)
                    .map((s) => (
                      <option key={s.id} value={s.station.id}>
                        {s.station.name} (+{s.durationMinutesFromOrigin}m)
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Điểm trả
                </label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={dropoffStationId || ''}
                  onChange={(e) => setDropoffStationId(e.target.value)}
                >
                  <option value="">Chọn điểm trả...</option>
                  {trip.route.stops
                    ?.filter((s) => s.stopType === 'DROPOFF' || s.stopType === 'BOTH')
                    .filter((s) => {
                      // Filter based on pickup order
                      if (!pickupStationId) return true;
                      let pickupOrder = 0;
                      if (pickupStationId === trip.route.originStation.id) pickupOrder = 0;
                      else {
                        const pStop = trip.route.stops.find(
                          (st) => st.station.id === pickupStationId,
                        );
                        if (pStop) pickupOrder = pStop.stopOrder;
                      }
                      return s.stopOrder > pickupOrder;
                    })
                    .sort((a, b) => a.stopOrder - b.stopOrder)
                    .map((s) => (
                      <option key={s.id} value={s.station.id}>
                        {s.station.name} (+{s.durationMinutesFromOrigin}m)
                      </option>
                    ))}
                  <option value={trip.route.destinationStation.id}>
                    {trip.route.destinationStation.name} (Cuối tuyến)
                  </option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg">Ghế đã chọn</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {mySelectedSeats.length > 0 ? (
                <div className="space-y-2">
                  {seatDetails.map((d) => (
                    <div key={d.seatCode} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-sm font-medium">
                          {d.seatCode}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {d.seatType === 'VIP' ? 'VIP' : 'Thường'}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(d.price)}</span>
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
                <span className="text-xl font-bold text-primary">{formatCurrency(totalPrice)}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={mySelectedSeats.length === 0}
                onClick={handleContinue}
              >
                Tiếp tục
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
