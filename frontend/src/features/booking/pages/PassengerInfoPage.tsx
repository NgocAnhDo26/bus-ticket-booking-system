import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Clock, Loader2, Mail, MapPin, Ticket, User } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { getBusLayout } from '@/features/bus-layout/api';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';

import { bookingApi, createBooking } from '../api';
import { useBookingStore } from '../store';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const PassengerInfoPage = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // State for contact info (booking holder)
  const [contactName, setContactName] = useState(user?.fullName || '');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');

  // State for per-ticket passenger info
  // ticketsDetails: Record<seatCode, { name: string, phone: string }>
  const [ticketsDetails, setTicketsDetails] = useState<
    Record<string, { name: string; phone: string }>
  >({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    seatStatusMap,
    initialize,
    selectedSeats,
    pickupStationId,
    dropoffStationId,
    setPickupStationId,
    setDropoffStationId,
  } = useBookingStore(
    useShallow((state) => ({
      seatStatusMap: state.seatStatusMap,
      initialize: state.initialize,
      selectedSeats: state.selectedSeats,
      pickupStationId: state.pickupStationId,
      dropoffStationId: state.dropoffStationId,
      setPickupStationId: state.setPickupStationId,
      setDropoffStationId: state.setDropoffStationId,
    })),
  );

  useEffect(() => {
    if (tripId) {
      initialize(tripId);
    }
  }, [tripId, initialize]); // Keep state on unmount for creating booking flow

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

  // Calculate selected seats and price
  const mySelectedSeats = selectedSeats;

  const { totalPrice, seatDetails } = useMemo(() => {
    if (!layout?.seats || !trip?.tripPricings || !seatStatusMap) {
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
  }, [layout, trip, seatStatusMap, mySelectedSeats]);

  const finalTotalPrice = totalPrice;
  const finalSeatDetails = seatDetails;

  // Initialize ticket details when seats are loaded
  useState(() => {
    const initialDetails: Record<string, { name: string; phone: string }> = {};
    finalSeatDetails.forEach((s) => {
      initialDetails[s.seatCode] = { name: '', phone: '' };
    });
    setTicketsDetails((prev) => ({ ...initialDetails, ...prev })); // Merge to keep existing input if re-render
  });

  const handleTicketChange = (seatCode: string, field: 'name' | 'phone', value: string) => {
    setTicketsDetails((prev) => ({
      ...prev,
      [seatCode]: {
        ...prev[seatCode],
        [field]: value,
      },
    }));
  };

  const copyContactToAll = () => {
    const newDetails = { ...ticketsDetails };
    finalSeatDetails.forEach((s) => {
      newDetails[s.seatCode] = {
        name: contactName,
        phone: contactPhone,
      };
    });
    setTicketsDetails(newDetails);
    toast({ title: 'Đã sao chép thông tin' });
  };

  const handleSubmit = async () => {
    if (!tripId) return;

    if (finalSeatDetails.length === 0) {
      toast({
        title: 'Chưa chọn ghế',
        description: 'Vui lòng quay lại chọn ghế trước.',
        variant: 'destructive',
      });
      navigate(`/booking/${tripId}`);
      return;
    }

    // Validate totalPrice is calculated correctly
    if (finalTotalPrice <= 0) {
      toast({
        title: 'Lỗi tính giá',
        description: 'Không thể tính được tổng tiền. Vui lòng thử lại hoặc chọn lại ghế.',
        variant: 'destructive',
      });
      navigate(`/booking/${tripId}`);
      return;
    }

    if (!contactName.trim() || !contactPhone.trim()) {
      toast({
        title: 'Thiếu thông tin liên hệ',
        description: 'Vui lòng nhập họ tên và số điện thoại người đặt.',
        variant: 'destructive',
      });
      return;
    }

    if (!user && !contactEmail.trim()) {
      toast({
        title: 'Thiếu email',
        description: 'Vui lòng nhập email để nhận vé (bắt buộc với khách vãng lai).',
        variant: 'destructive',
      });
      return;
    }

    // Validate per-ticket info
    const missingInfo = finalSeatDetails.find((s) => {
      const details = ticketsDetails[s.seatCode];
      return !details?.name?.trim() || !details?.phone?.trim();
    });

    if (missingInfo) {
      toast({
        title: 'Thiếu thông tin hành khách',
        description: `Vui lòng nhập đủ tên và SĐT cho ghế ${missingInfo.seatCode}`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const booking = await createBooking({
        tripId,
        userId: user?.id, // Optional for guest
        passengerName: contactName.trim(),
        passengerPhone: contactPhone.trim(),
        passengerEmail: !user ? contactEmail.trim() : undefined,
        pickupStationId: pickupStationId || undefined,
        dropoffStationId: dropoffStationId || undefined,
        totalPrice: finalTotalPrice,
        tickets: finalSeatDetails.map((d) => ({
          seatCode: d.seatCode,
          passengerName: ticketsDetails[d.seatCode].name.trim(),
          passengerPhone: ticketsDetails[d.seatCode].phone.trim(),
          price: d.price,
        })),
      });

      toast({
        title: 'Đang giữ vé cho bạn!',
        description: `Mã đặt vé: #${booking.code}. Vé sẽ được giữ trong 15 phút, vui lòng thanh toán để hoàn tất.`,
      });

      // Save draft state in case user navigates back
      useBookingStore.getState().setPendingBooking(
        booking.id,
        finalSeatDetails.map((s) => s.seatCode),
      );

      setPickupStationId(null);
      setDropoffStationId(null);

      navigate(`/booking/confirmation/${booking.id}`);
    } catch {
      toast({
        title: 'Đặt vé thất bại',
        description: 'Có lỗi xảy ra, vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !trip) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 pl-0">
        <ArrowLeft className="h-4 w-4" />
        Quay lại chọn ghế
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Form */}
        <div className="md:col-span-2 space-y-6">
          {/* 1. Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Thông tin liên hệ (Người đặt)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Họ và tên</Label>
                  <Input
                    id="contactName"
                    placeholder="Nguyễn Văn A"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Số điện thoại</Label>
                  <Input
                    id="contactPhone"
                    placeholder="Nhập số điện thoại"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>

              {!user && (
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email nhận vé</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contactEmail"
                      type="email"
                      className="pl-9"
                      placeholder="example@email.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Passenger Info Per Seat */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Thông tin hành khách từng ghế
              </h3>
              <Button variant="outline" size="sm" onClick={copyContactToAll}>
                Sao chép thông tin người đặt
              </Button>
            </div>

            {finalSeatDetails.map((seat) => (
              <Card key={seat.seatCode}>
                <CardHeader className="py-3 bg-muted/20">
                  <CardTitle className="text-base flex justify-between">
                    <span>Ghế {seat.seatCode}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {seat.seatType === 'VIP' ? 'VIP' : 'Thường'} - {formatCurrency(seat.price)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex justify-end">
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary"
                      onClick={() => {
                        setTicketsDetails((prev) => ({
                          ...prev,
                          [seat.seatCode]: {
                            name: contactName,
                            phone: contactPhone,
                          },
                        }));
                        toast({
                          title: `Đã sao chép cho ghế ${seat.seatCode}`,
                        });
                      }}
                    >
                      Sao chép từ người đặt
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Họ tên hành khách</Label>
                      <Input
                        value={ticketsDetails[seat.seatCode]?.name || ''}
                        onChange={(e) => handleTicketChange(seat.seatCode, 'name', e.target.value)}
                        placeholder="Tên hành khách"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SĐT hành khách</Label>
                      <Input
                        value={ticketsDetails[seat.seatCode]?.phone || ''}
                        onChange={(e) => handleTicketChange(seat.seatCode, 'phone', e.target.value)}
                        placeholder="SĐT hành khách"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            className="w-full md:hidden"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting || finalSeatDetails.length === 0}
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận & Thanh toán'}
          </Button>
        </div>

        {/* Right Column: Trip Summary */}
        <div className="space-y-6">
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                Thông tin chuyến đi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Tuyến đường</div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">
                    {trip.route.originStation.name} - {trip.route.destinationStation.name}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Khởi hành</div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm">{format(new Date(trip.departureTime), 'HH:mm')}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(trip.departureTime), 'dd/MM/yyyy')}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm font-medium">Ghế đã chọn ({finalSeatDetails.length})</div>
                <div className="flex flex-wrap gap-2">
                  {finalSeatDetails.map((d) => (
                    <span
                      key={d.seatCode}
                      className="bg-primary/10 text-primary text-xs px-2 py-1 rounded font-medium"
                    >
                      {d.seatCode}
                    </span>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center pt-2">
                <span className="font-medium">Tổng tiền</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(finalTotalPrice)}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full hidden md:flex"
                size="lg"
                onClick={handleSubmit}
                disabled={isSubmitting || finalSeatDetails.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận & Thanh toán'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
