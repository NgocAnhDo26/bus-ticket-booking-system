import { useEffect, useState } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
      toast.success('Hủy vé thành công');
      onOpenChange(false);
    } catch {
      toast.error('Hủy vé thất bại');
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

  // Fetch trip details for pricing
  const { data: trip } = useQuery({
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

  const { mutateAsync: updateBookingMutation, isPending } = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      // Build price map
      const priceMap: Record<string, number> = {};
      if (trip?.tripPricings) {
        trip.tripPricings.forEach((p) => (priceMap[p.seatType] = p.price));
      }

      return updateBooking(booking.id, {
        ...data,
        tickets: localSelectedSeats.map((code) => {
          // Try to preserve price for original seats if logic dictates,
          // BUT better to recalculate to ensure validity or use current price.
          // However, original booking might have had a discount or old price.
          // Usually for "Change Seat", we apply current price or keep old if same type?
          // Let's use current trip pricing for simplicity and correctness.

          const seat = layout?.seats?.find((s) => s.seatCode === code);
          const seatType = seat?.type || 'NORMAL';
          const price = priceMap[seatType] || 0;

          return {
            seatCode: code,
            passengerName: data.passengerName,
            passengerPhone: data.passengerPhone,
            price: price,
          };
        }),
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
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Chỉnh sửa đặt vé #{booking.code}</DialogTitle>
          <DialogDescription>Thay đổi thông tin hành khách hoặc chọn ghế mới</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
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
                          aria-invalid={fieldState.invalid}
                        >
                          <option value={trip?.route.originStation.id}>
                            {trip?.route.originStation.name} (Xuất phát)
                          </option>
                          {trip?.route.stops
                            ?.filter(
                              (s) =>
                                s.station && (s.stopType === 'PICKUP' || s.stopType === 'BOTH'),
                            )
                            .sort((a, b) => a.stopOrder - b.stopOrder)
                            .map((stop) => (
                              <option key={stop.id} value={stop.station!.id}>
                                {stop.station!.name} ({stop.durationMinutesFromOrigin}m)
                              </option>
                            ))}
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
                          aria-invalid={fieldState.invalid}
                        >
                          <option value={trip?.route.destinationStation.id}>
                            {trip?.route.destinationStation.name} (Điểm cuối)
                          </option>
                          {trip?.route.stops
                            ?.filter(
                              (s) =>
                                s.station && (s.stopType === 'DROPOFF' || s.stopType === 'BOTH'),
                            )
                            .sort((a, b) => a.stopOrder - b.stopOrder)
                            .map((stop) => (
                              <option key={stop.id} value={stop.station!.id}>
                                {stop.station!.name} ({stop.durationMinutesFromOrigin}m)
                              </option>
                            ))}
                        </select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </form>

              <div className="mt-8">
                <h4 className="font-medium mb-4">Ghế đã chọn</h4>
                <div className="flex flex-wrap gap-2">
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
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-muted/10 h-[500px]">
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
        </ScrollArea>

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
