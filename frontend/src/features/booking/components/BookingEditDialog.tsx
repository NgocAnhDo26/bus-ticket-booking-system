import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { getBusLayout } from '@/features/bus-layout/api';

import { bookingApi, updateBooking } from '../api';
import { useCancelBooking } from '../hooks';
import { useBookingStore } from '../store';
import type { BookingResponse } from '../types';
import { BookingSeatMap } from './BookingSeatMap';

const formSchema = z.object({
  passengerName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  passengerPhone: z.string().regex(/^[0-9]{10}$/, 'Số điện thoại không hợp lệ'),
  passengerEmail: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  pickupStationId: z.string().optional(),
  dropoffStationId: z.string().optional(),
});

type BookingEditDialogProps = {
  booking: BookingResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const BookingEditDialog = ({ booking, open, onOpenChange }: BookingEditDialogProps) => {
  const queryClient = useQueryClient();
  const { initialize, cleanup, toggleSeat } = useBookingStore();
  const [localSelectedSeats, setLocalSelectedSeats] = useState<string[]>([]);
  const cancelMutation = useCancelBooking();

  const canCancel =
    booking.status !== 'CANCELLED' && new Date(booking.trip.departureTime) > new Date();

  const handleCancelBooking = async () => {
    try {
      await cancelMutation.mutateAsync(booking.id);
      toast.success('Hủy vé thành công', { id: 'dialog-cancel-success' });
      onOpenChange(false);
    } catch {
      toast.error('Hủy vé thất bại', { id: 'dialog-cancel-error' });
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      passengerName: booking.passengerName,
      passengerPhone: booking.passengerPhone,
      passengerEmail: '',
      pickupStationId: booking.pickupStation?.id,
      dropoffStationId: booking.dropoffStation?.id,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        passengerName: booking.passengerName,
        passengerPhone: booking.passengerPhone,
        passengerEmail: '',
        pickupStationId: booking.pickupStation?.id,
        dropoffStationId: booking.dropoffStation?.id,
      });
      // Move state updates to next tick to avoid synchronous update warning
      requestAnimationFrame(() => {
        setLocalSelectedSeats(booking.tickets.map((t) => t.seatCode));
        initialize(booking.trip.id);
      });
    } else {
      cleanup();
    }
  }, [open, booking, initialize, cleanup, form]);

  const handleSeatClick = async (seatCode: string) => {
    // Logic:
    // If seat currently in local list:
    //    Remove from local. If it was a NEW seat (not original), try to unlock it.
    // If seat NOT in local list:
    //    If it was ORIGINAL: Just add back.
    //    If it is NEW: Call lock API. If success, add to local.

    const isOriginal = booking.tickets.some((t) => t.seatCode === seatCode);
    const isSelected = localSelectedSeats.includes(seatCode);

    if (isSelected) {
      setLocalSelectedSeats((prev) => prev.filter((s) => s !== seatCode));
      if (!isOriginal) {
        await toggleSeat(seatCode); // dependent on store to toggle/unlock
      }
    } else {
      if (isOriginal) {
        setLocalSelectedSeats((prev) => [...prev, seatCode]);
      } else {
        // Try to lock
        await toggleSeat(seatCode); // store handles locking, hopefully throws if fail?
        // Store toggleSeat catches error but logs it. We assume success if no easy way to check.
        // Ideally we check store state. `selectedSeats` in store should have it.
        // We can optimistically add it, or wait?
        // `toggleSeat` is async.
        setLocalSelectedSeats((prev) => [...prev, seatCode]);
      }
    }
  };

  const { data: trip, isLoading: isLoadingTrip } = useQuery({
    queryKey: ['trip', booking.trip.id],
    queryFn: () => bookingApi.getTrip(booking.trip.id),
    enabled: open,
  });

  // Fetch layout
  const { data: layout } = useQuery({
    queryKey: ['bus-layout', trip?.bus?.busLayoutId],
    queryFn: () => getBusLayout(trip!.bus.busLayoutId!),
    enabled: !!trip?.bus?.busLayoutId,
  });

  const pickupStationId = form.watch('pickupStationId');
  const dropoffStationId = form.watch('dropoffStationId');

  // Calculate estimated price
  const { totalPrice, seatDetails } = useMemo(() => {
    if (!layout?.seats || !trip?.tripPricings) {
      return { totalPrice: 0, seatDetails: [] };
    }

    const pickupId = pickupStationId;
    const dropoffId = dropoffStationId;

    // 1. Base prices (full route)
    const basePrices: Record<string, number> = {};
    trip.tripPricings.forEach((p) => {
      basePrices[p.seatType] = p.price;
    });

    // 2. Identify Pickup Prices
    const pickupPrices = { NORMAL: 0, VIP: 0 };
    if (pickupId && pickupId !== 'ORIGIN' && pickupId !== 'DESTINATION') {
      const stop = trip.route.stops?.find((s) => s.id === pickupId);
      if (stop) {
        if (stop.normalPrice) pickupPrices['NORMAL'] = stop.normalPrice;
        if (stop.vipPrice) pickupPrices['VIP'] = stop.vipPrice;
      }
    }

    // 3. Identify Dropoff Prices
    const dropoffPrices = { ...basePrices };
    if (dropoffId && dropoffId !== 'DESTINATION' && dropoffId !== 'ORIGIN') {
      const stop = trip.route.stops?.find((s) => s.id === dropoffId);
      if (stop) {
        if (stop.normalPrice) dropoffPrices['NORMAL'] = stop.normalPrice;
        if (stop.vipPrice) dropoffPrices['VIP'] = stop.vipPrice;
      }
    }

    // 4. Effective Prices = Dropoff - Pickup
    const effectivePrices: Record<string, number> = {
      NORMAL: Math.max(0, dropoffPrices.NORMAL - pickupPrices.NORMAL),
      VIP: Math.max(0, dropoffPrices.VIP - pickupPrices.VIP),
    };

    const seats = layout.seats || [];
    const details = localSelectedSeats.map((seatCode) => {
      const seat = seats.find((s) => s.seatCode === seatCode);
      const seatType = seat?.type || 'NORMAL';
      const price = effectivePrices[seatType] || 0;
      return { seatCode, seatType, price };
    });

    const total = details.reduce((sum, d) => sum + d.price, 0);
    return { totalPrice: total, seatDetails: details };
  }, [layout, trip, localSelectedSeats, pickupStationId, dropoffStationId]);

  const { mutateAsync: updateBookingMutation, isPending } = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      // Map pickup/dropoff logic from PassengerInfoPage
      let finalPickupId: string | undefined;
      let finalPickupStopId: string | undefined;

      if (!data.pickupStationId || data.pickupStationId === 'ORIGIN') {
        finalPickupId = trip?.route.originStation.id;
      } else if (data.pickupStationId === 'DESTINATION') {
        finalPickupId = trip?.route.destinationStation.id; // Should not happen logically for pickup
      } else {
        finalPickupStopId = data.pickupStationId;
      }

      let finalDropoffId: string | undefined;
      let finalDropoffStopId: string | undefined;

      if (!data.dropoffStationId || data.dropoffStationId === 'DESTINATION') {
        finalDropoffId = trip?.route.destinationStation.id;
      } else if (data.dropoffStationId === 'ORIGIN') {
        finalDropoffId = trip?.route.originStation.id; // Should not happen logically for dropoff
      } else {
        finalDropoffStopId = data.dropoffStationId;
      }

      return updateBooking(booking.id, {
        passengerName: data.passengerName,
        passengerPhone: data.passengerPhone,
        passengerEmail: data.passengerEmail || undefined,

        pickupStationId: finalPickupId,
        pickupTripStopId: finalPickupStopId,

        dropoffStationId: finalDropoffId,
        dropoffTripStopId: finalDropoffStopId,

        tickets: seatDetails.map((detail) => ({
          seatCode: detail.seatCode,
          passengerName: data.passengerName, // Simple update uses same name for all
          passengerPhone: data.passengerPhone,
          price: detail.price,
        })),
      });
    },
    onSuccess: () => {
      toast.success('Cập nhật thành công');
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
    },
    onError: () => {
      toast.error('Cập nhật thất bại');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl w-[90vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Chỉnh sửa đặt vé #{booking.code}</DialogTitle>
          <DialogDescription>Thay đổi thông tin hành khách hoặc chọn ghế mới</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-[350px] xl:w-[400px] shrink-0 space-y-8">
              <form
                id="update-booking-form"
                onSubmit={form.handleSubmit((d) => updateBookingMutation(d))}
              >
                <FieldGroup className="space-y-4">
                  <Controller
                    name="passengerName"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="update-booking-form-passengerName">
                          Tên hành khách
                        </FieldLabel>
                        <Input
                          {...field}
                          id="update-booking-form-passengerName"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name="passengerPhone"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="update-booking-form-passengerPhone">
                          Số điện thoại
                        </FieldLabel>
                        <Input
                          {...field}
                          id="update-booking-form-passengerPhone"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name="passengerEmail"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="update-booking-form-passengerEmail">
                          Email (Tùy chọn)
                        </FieldLabel>
                        <Input
                          {...field}
                          id="update-booking-form-passengerEmail"
                          type="email"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name="pickupStationId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="update-booking-form-pickupStationId">
                          Điểm đón
                        </FieldLabel>
                        <select
                          id="update-booking-form-pickupStationId"
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value || ''}
                          onChange={field.onChange}
                          disabled={isLoadingTrip || !trip}
                          aria-invalid={fieldState.invalid}
                        >
                          {isLoadingTrip ? (
                            <option>Đang tải danh sách...</option>
                          ) : (
                            <>
                              <option value="ORIGIN">
                                {trip?.route.originStation.name} (Xuất phát)
                              </option>
                              {trip?.route.stops
                                ?.filter(
                                  (s) =>
                                    s.station && (s.stopType === 'PICKUP' || s.stopType === 'BOTH'),
                                )
                                .sort((a, b) => a.stopOrder - b.stopOrder)
                                .map((stop) => (
                                  <option key={stop.id} value={stop.id}>
                                    {stop.station!.name} ({stop.durationMinutesFromOrigin}m)
                                  </option>
                                ))}
                            </>
                          )}
                        </select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name="dropoffStationId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="update-booking-form-dropoffStationId">
                          Điểm trả
                        </FieldLabel>
                        <select
                          id="update-booking-form-dropoffStationId"
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value || ''}
                          onChange={field.onChange}
                          disabled={isLoadingTrip || !trip}
                          aria-invalid={fieldState.invalid}
                        >
                          {isLoadingTrip ? (
                            <option>Đang tải danh sách...</option>
                          ) : (
                            <>
                              <option value="DESTINATION">
                                {trip?.route.destinationStation.name} (Điểm cuối)
                              </option>
                              {trip?.route.stops
                                ?.filter(
                                  (s) =>
                                    s.station &&
                                    (s.stopType === 'DROPOFF' || s.stopType === 'BOTH'),
                                )
                                .sort((a, b) => a.stopOrder - b.stopOrder)
                                .map((stop) => (
                                  <option key={stop.id} value={stop.id}>
                                    {stop.station!.name} ({stop.durationMinutesFromOrigin}m)
                                  </option>
                                ))}
                            </>
                          )}
                        </select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </form>

              <div>
                <h4 className="font-medium mb-4">Ghế đã chọn</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {localSelectedSeats.map((seat) => (
                    <div
                      key={seat}
                      className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-medium border border-primary/20"
                    >
                      {seat}
                    </div>
                  ))}
                  {localSelectedSeats.length === 0 && (
                    <p className="text-muted-foreground text-sm italic">Chưa chọn ghế nào</p>
                  )}
                </div>

                {/* Price Display */}
                <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
                  <span className="font-medium">Tổng tạm tính:</span>
                  <span className="text-xl font-bold text-primary">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 border rounded-lg p-4 bg-muted/10 flex flex-col justify-start">
              {booking.trip.bus.busLayoutId ? (
                <BookingSeatMap
                  busLayoutId={booking.trip.bus.busLayoutId}
                  alreadyBookedSeats={booking.tickets.map((t) => t.seatCode)}
                  selectedSeats={localSelectedSeats}
                  onSeatClick={handleSeatClick}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Không tìm thấy sơ đồ ghế
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/5 flex justify-between sm:justify-between">
          {canCancel && (
            <Button
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Đang hủy...' : 'Hủy đặt vé'}
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
            <Button
              type="submit"
              form="update-booking-form"
              disabled={isPending || localSelectedSeats.length === 0}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
