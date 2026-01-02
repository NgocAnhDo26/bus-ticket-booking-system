import { useEffect } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertCircle, Calendar, Clock, MapPin, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import {
  useBuses,
  useCheckCanUpdateRecurrence,
  useCreateTrip,
  useRoutes,
  useUpdateTrip,
} from '../hooks';
import { type Route, SeatType, StopType, type Trip } from '../types';

// Maximum allowed days for recurrence to prevent server overload
const MAX_RECURRENCE_DAYS = 90;

const WEEKDAYS = [
  { value: 'MON', label: 'Thứ 2' },
  { value: 'TUE', label: 'Thứ 3' },
  { value: 'WED', label: 'Thứ 4' },
  { value: 'THU', label: 'Thứ 5' },
  { value: 'FRI', label: 'Thứ 6' },
  { value: 'SAT', label: 'Thứ 7' },
  { value: 'SUN', label: 'Chủ nhật' },
];

const stopSchema = z.object({
  stationId: z.string().optional(),
  customName: z.string().optional(),
  customAddress: z.string().optional(),
  stopOrder: z.number().min(1),
  durationMinutesFromOrigin: z.number().min(0),
  stopType: z.nativeEnum(StopType),
  estimatedArrivalTime: z.string().optional(),
  normalPrice: z.number().min(0).optional(),
  vipPrice: z.number().min(0).optional(),
});

const formSchema = z
  .object({
    // Basic info
    routeId: z.string().min(1, 'Vui lòng chọn tuyến đường'),
    busId: z.string().min(1, 'Vui lòng chọn xe'),

    // Trip type
    tripType: z.enum(['SINGLE', 'RECURRING']),

    // For SINGLE trip: full datetime
    departureDate: z.date().optional(),

    // For RECURRING trip: time only
    departureTime: z.string().optional(), // HH:mm format

    // Recurrence settings (only for RECURRING)
    recurrenceType: z.enum(['DAILY', 'WEEKLY']).optional(),
    weeklyDays: z.array(z.string()).optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),

    // Pricing
    pricings: z.array(
      z.object({
        seatType: z.nativeEnum(SeatType),
        price: z.number().min(0, 'Giá vé phải lớn hơn hoặc bằng 0'),
      }),
    ),

    // Stops
    stops: z.array(stopSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.tripType === 'SINGLE') {
        return !!data.departureDate;
      }
      return !!data.departureTime;
    },
    {
      message: 'Vui lòng chọn thời gian khởi hành',
      path: ['departureDate'],
    },
  )
  .refine(
    (data) => {
      if (data.tripType === 'RECURRING' && data.startDate && data.endDate) {
        const diffDays = Math.ceil(
          (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        return diffDays <= MAX_RECURRENCE_DAYS;
      }
      return true;
    },
    {
      message: `Khoảng thời gian lặp lại tối đa là ${MAX_RECURRENCE_DAYS} ngày`,
      path: ['endDate'],
    },
  )
  .refine(
    (data) => {
      if (data.tripType === 'RECURRING' && data.recurrenceType === 'WEEKLY') {
        return data.weeklyDays && data.weeklyDays.length > 0;
      }
      return true;
    },
    {
      message: 'Vui lòng chọn ít nhất một ngày lặp lại',
      path: ['weeklyDays'],
    },
  );

type TripSchema = z.infer<typeof formSchema>;

interface TripFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTrip?: Trip | null;
  defaultTab?: 'basic' | 'schedule' | 'stops';
}

export const TripFormDialog = ({
  open,
  onOpenChange,
  editingTrip,
  defaultTab = 'basic',
}: TripFormDialogProps) => {
  const queryClient = useQueryClient();
  const { data: routes } = useRoutes();
  const { data: buses } = useBuses();
  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();

  // Check if we can change recurrence (only for existing trips)
  const { data: recurrenceCheck } = useCheckCanUpdateRecurrence(editingTrip?.id);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    getValues, // Added getValues
    formState: { errors },
  } = useForm<TripSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tripType: 'SINGLE',
      pricings: [],
      stops: [],
      weeklyDays: [],
      recurrenceType: 'DAILY',
    },
  });

  const { fields: pricingFields } = useFieldArray({
    control,
    name: 'pricings',
  });

  const { fields: stopFields, replace: replaceStops } = useFieldArray({
    control,
    name: 'stops',
  });

  const routeId = useWatch({ control, name: 'routeId' });
  const tripType = useWatch({ control, name: 'tripType' });

  // Load route details when route changes
  useEffect(() => {
    if (routeId && buses) {
      const selectedRoute = routes?.find((r) => r.id === routeId);
      if (selectedRoute) {
        // Only reset pricings/stops if NOT editing or if user manually changed route
        if (!editingTrip || editingTrip.route.id !== routeId) {
          // Calculate initial times if departure time is already set
          const dDate = getValues('departureDate');
          const dTime = getValues('departureTime');
          const tType = getValues('tripType');

          let baseDate: Date | null = null;
          if (tType === 'SINGLE' && dDate) {
            baseDate = new Date(dDate);
          } else if (tType === 'RECURRING' && dTime) {
            const [h, m] = dTime.split(':').map(Number);
            baseDate = new Date();
            baseDate.setHours(h);
            baseDate.setMinutes(m);
            baseDate.setSeconds(0);
          }

          const defaultStops = (selectedRoute.stops || []).map((stop) => {
            let arrivalTime = '';
            if (baseDate) {
              const duration = stop.durationMinutesFromOrigin || 0;
              const arrival = new Date(baseDate.getTime() + duration * 60000);
              arrivalTime = format(arrival, 'HH:mm');
            }

            return {
              stationId: stop.station?.id,
              customName: stop.customName,
              customAddress: stop.customAddress || '',
              stopOrder: stop.stopOrder,
              durationMinutesFromOrigin: stop.durationMinutesFromOrigin,
              stopType: stop.stopType,
              estimatedArrivalTime: arrivalTime,
              normalPrice: 0,
              vipPrice: 0,
            };
          });
          replaceStops(defaultStops);
        }
      }
    }
  }, [routeId, routes, buses, editingTrip, replaceStops, getValues]);

  // Auto-calculate stop arrival times
  const depDate = useWatch({ control, name: 'departureDate' });
  const depTime = useWatch({ control, name: 'departureTime' });
  const startDate = useWatch({ control, name: 'startDate' });
  const endDate = useWatch({ control, name: 'endDate' });
  const weeklyDays = useWatch({ control, name: 'weeklyDays' }) || [];

  useEffect(() => {
    const currentStops = getValues('stops') || [];
    // Avoid spamming logs, but keep one to know it triggers
    // console.log('Auto-calc:', { depDate, depTime, tripType, stops: currentStops.length });

    if (currentStops.length === 0) return;

    let baseDate = new Date();
    baseDate.setSeconds(0);
    baseDate.setMilliseconds(0);
    let hasTime = false;

    if (tripType === 'SINGLE' && depDate) {
      baseDate = new Date(depDate);
      hasTime = true;
    } else if (tripType === 'RECURRING' && depTime) {
      const [h, m] = depTime.split(':').map(Number);
      baseDate.setHours(h);
      baseDate.setMinutes(m);
      baseDate.setSeconds(0);
      hasTime = true;
    }

    if (hasTime) {
      currentStops.forEach((stop, index) => {
        const duration = Number(stop.durationMinutesFromOrigin || 0);
        const arrival = new Date(baseDate.getTime() + duration * 60000);
        const newTime = format(arrival, 'HH:mm');

        if (stop.estimatedArrivalTime !== newTime) {
          setValue(`stops.${index}.estimatedArrivalTime`, newTime);
        }
      });
    }
  }, [depDate, depTime, tripType, getValues, setValue]);

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (editingTrip) {
        reset({
          routeId: editingTrip.route.id,
          busId: editingTrip.bus.id,
          tripType: 'SINGLE', // Default to Single as BE response doesn't convey schedule link explicitly yet
          departureDate: new Date(editingTrip.departureTime),
          departureTime: format(new Date(editingTrip.departureTime), 'HH:mm'), // Pre-fill just in case switch to recurring
          pricings: editingTrip.tripPricings.map((p) => ({
            seatType: p.seatType,
            price: Number(p.price),
          })),
          stops: (editingTrip.route.stops || []).map((stop) => {
            // Use route stops or trip stops?
            // Trip response has tripStops if populated. The updated backend logic maps tripStops.
            // We should try to find matching trip stop.
            // But front-end types might not have updated fully reflected.
            // Let's assume trip stops if available, else route stops.
            // Actually TripResponse has "stops" in "RouteInfo" field which is actually populated with trip stops if overriding.
            // See TripService.mapToResponse implementation.
            return {
              stationId: stop.station?.id,
              customName: stop.customName,
              customAddress: stop.customAddress || '',
              stopOrder: stop.stopOrder,
              durationMinutesFromOrigin: stop.durationMinutesFromOrigin,
              stopType: stop.stopType,
              estimatedArrivalTime: stop.estimatedArrivalTime
                ? format(new Date(stop.estimatedArrivalTime), 'HH:mm')
                : '',
              normalPrice: Number(stop.normalPrice || 0),
              vipPrice: Number(stop.vipPrice || 0),
            };
          }),
        });
      } else {
        reset({
          tripType: 'SINGLE',
          pricings: [
            { seatType: SeatType.NORMAL, price: 0 },
            { seatType: SeatType.VIP, price: 0 },
          ],
          stops: [],
          weeklyDays: [],
          recurrenceType: 'DAILY',
        });
      }
    }
  }, [open, editingTrip, reset]);

  const onSubmit = (data: TripSchema) => {
    try {
      let departureTime: string;
      if (data.tripType === 'RECURRING') {
        const [hours, minutes] = (data.departureTime || '00:00').split(':').map(Number);
        const date = new Date(data.startDate!);
        date.setHours(hours);
        date.setMinutes(minutes);
        departureTime = date.toISOString();
      } else {
        departureTime = data.departureDate!.toISOString();
      }

      // Calculate arrival datetime based on route duration
      const depDate = new Date(departureTime);
      const rData = routes?.find((r) => r.id === data.routeId);
      const arrivalDate = new Date(depDate.getTime() + (rData?.durationMinutes || 0) * 60000);
      const arrivalTime = arrivalDate.toISOString();

      const formattedStops = (data.stops || []).map((stop) => {
        let estimatedIso = undefined;
        if (stop.estimatedArrivalTime) {
          const [h, m] = stop.estimatedArrivalTime.split(':').map(Number);
          const stopDate = new Date(depDate);
          stopDate.setHours(h);
          stopDate.setMinutes(m);
          if (
            stopDate.getTime() < depDate.getTime() &&
            depDate.getTime() - stopDate.getTime() > 12 * 60 * 60 * 1000
          ) {
            stopDate.setDate(stopDate.getDate() + 1);
          }
          estimatedIso = stopDate.toISOString();
        }

        return {
          stationId: stop.stationId,
          customName: stop.customName,
          customAddress: stop.customAddress,
          stopOrder: stop.stopOrder,
          durationMinutesFromOrigin: stop.durationMinutesFromOrigin,
          stopType: stop.stopType,
          estimatedArrivalTime: estimatedIso,
          normalPrice: stop.normalPrice ? Number(stop.normalPrice) : undefined,
          vipPrice: stop.vipPrice ? Number(stop.vipPrice) : undefined,
        };
      });

      const tripPayload = {
        routeId: data.routeId,
        busId: data.busId,
        departureTime,
        arrivalTime,
        pricings: data.pricings.map((p) => ({ ...p, price: Number(p.price) })),
        tripType: data.tripType,
        recurrence:
          data.tripType === 'RECURRING'
            ? {
                recurrenceType: data.recurrenceType!,
                weeklyDays: data.weeklyDays || [],
                startDate: format(data.startDate!, 'yyyy-MM-dd'),
                endDate: format(data.endDate!, 'yyyy-MM-dd'),
              }
            : undefined,
        stops: formattedStops,
      };

      if (editingTrip) {
        updateTrip.mutate(
          { id: editingTrip.id, data: tripPayload },
          {
            onSuccess: () => {
              toast.success('Cập nhật chuyến đi thành công');
              queryClient.invalidateQueries({ queryKey: ['trips'] });
              onOpenChange(false);
            },
            onError: (error) => {
              toast.error(`Lỗi: ${(error as Error).message || 'Không thể cập nhật'}`);
            },
          },
        );
      } else {
        createTrip.mutate(tripPayload, {
          onSuccess: () => {
            toast.success('Tạo chuyến đi thành công');
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            onOpenChange(false);
          },
          onError: (error) => {
            toast.error(`Lỗi: ${(error as Error).message || 'Không thể tạo chuyến đi'}`);
          },
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Có lỗi xảy ra khi xử lý dữ liệu');
    }
  };

  const isRecurrenceDisabled = Boolean(
    editingTrip && recurrenceCheck && !recurrenceCheck.canUpdate,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTrip ? 'Cập nhật Chuyến đi' : 'Thêm Chuyến đi mới'}</DialogTitle>
          <DialogDescription>Điền thông tin chi tiết cho chuyến đi.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            console.error('Form validation errors:', errors);
            toast.error('Vui lòng kiểm tra lại thông tin. Có trường dữ liệu chưa hợp lệ.');

            // Optional: iterate errors to show specific messages if needed, though FieldError already handles inline
            // Only toast strictly if high level error
          })}
        >
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="basic">
                <Clock className="w-4 h-4 mr-2" />
                Thông tin cơ bản
              </TabsTrigger>
              <TabsTrigger value="schedule">
                <Calendar className="w-4 h-4 mr-2" />
                Lịch trình & Lặp lại
              </TabsTrigger>
              <TabsTrigger value="stops">
                <MapPin className="w-4 h-4 mr-2" />
                Quản lý trạm
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel required>Tuyến đường</FieldLabel>
                  <Select
                    onValueChange={(value) => setValue('routeId', value)}
                    defaultValue={routeId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tuyến đường" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes?.map((route: Route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.originStation.name} - {route.destinationStation.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.routeId && <FieldError>{errors.routeId.message}</FieldError>}
                </Field>

                <Field>
                  <FieldLabel required>Xe</FieldLabel>
                  <Select
                    onValueChange={(value) => setValue('busId', value)}
                    defaultValue={useWatch({ control, name: 'busId' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn xe" />
                    </SelectTrigger>
                    <SelectContent>
                      {buses?.map((bus) => (
                        <SelectItem key={bus.id} value={bus.id}>
                          {bus.plateNumber} - {bus.operator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.busId && <FieldError>{errors.busId.message}</FieldError>}
                </Field>
              </div>

              <Separator className="my-4" />
              <div className="space-y-4">
                <Label>Giá vé mặc định</Label>
                <div className="grid grid-cols-2 gap-4">
                  {pricingFields.map((field, index) => (
                    <Field key={field.id}>
                      <FieldLabel className="capitalize">
                        {getValues(`pricings.${index}.seatType`) === 'NORMAL'
                          ? 'Ghế thường'
                          : 'Ghế VIP'}
                      </FieldLabel>
                      <Input
                        type="number"
                        {...register(`pricings.${index}.price`, { valueAsNumber: true })}
                      />
                      {errors.pricings?.[index]?.price && (
                        <FieldError>{errors.pricings[index]?.price?.message}</FieldError>
                      )}
                    </Field>
                  ))}
                  {pricingFields.length === 0 && (
                    <div className="text-sm text-muted-foreground col-span-2">
                      Vui lòng chọn Xe để hiển thị cấu hình giá vé.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <div className="flex gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-single"
                    checked={tripType === 'SINGLE'}
                    onCheckedChange={() => setValue('tripType', 'SINGLE')}
                    disabled={isRecurrenceDisabled && tripType === 'RECURRING'}
                  />
                  <Label htmlFor="type-single">Chuyến đi đơn</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-recurring"
                    checked={tripType === 'RECURRING'}
                    onCheckedChange={() => setValue('tripType', 'RECURRING')}
                    disabled={isRecurrenceDisabled && tripType === 'SINGLE'}
                  />
                  <Label htmlFor="type-recurring">Lịch lặp lại</Label>
                </div>
              </div>

              {isRecurrenceDisabled && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Có {recurrenceCheck?.futureBookingsCount} đặt vé trong tương lai. Không thể thay
                    đổi cấu hình lặp lại.
                  </span>
                </div>
              )}

              {tripType === 'SINGLE' ? (
                <Field>
                  <FieldLabel required>Thời gian khởi hành</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !depDate && 'text-muted-foreground',
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {depDate ? format(depDate, 'PP HH:mm') : <span>Chọn ngày giờ</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={depDate}
                        onSelect={(date) => {
                          if (date) {
                            // Keep time if previously selected or defaut to now?
                            // Calendar component only sets Date part.
                            // We need time picker too.
                            // For simplicity, let's assume default Calendar usage plus Time Input?
                            // Or better, use a Datetime picker if available.
                            // Since we used to have type="datetime-local" input, let's revert to that for simplicity if Calendar is too complex
                            // or just use 2 inputs: Date and Time.
                            // Logic here assumes date only.
                            // Let's use simple check: if date is set, keep existing time or set to current time.
                            const currentTime = getValues('departureDate') || new Date();
                            date.setHours(currentTime.getHours());
                            date.setMinutes(currentTime.getMinutes());
                            setValue('departureDate', date);
                          }
                        }}
                        initialFocus
                      />
                      <div className="p-3 border-t">
                        <Label>Giờ khởi hành</Label>
                        <Input
                          type="time"
                          className="mt-2"
                          onChange={(e) => {
                            const [h, m] = e.target.value.split(':').map(Number);
                            const d = getValues('departureDate') || new Date();
                            d.setHours(h);
                            d.setMinutes(m);
                            setValue('departureDate', new Date(d));
                          }}
                          value={depDate ? format(depDate, 'HH:mm') : ''}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  {errors.departureDate && <FieldError>{errors.departureDate.message}</FieldError>}
                </Field>
              ) : (
                <div className="space-y-4">
                  <Field>
                    <FieldLabel required>Giờ khởi hành (cho các chuyến lặp lại)</FieldLabel>
                    <Input
                      type="time"
                      {...register('departureTime')}
                      disabled={isRecurrenceDisabled}
                    />
                    {errors.departureTime && (
                      <FieldError>{errors.departureTime.message}</FieldError>
                    )}
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel required>Ngày bắt đầu</FieldLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !startDate && 'text-muted-foreground',
                            )}
                            disabled={isRecurrenceDisabled}
                          >
                            {startDate ? format(startDate, 'PPP') : <span>Chọn ngày</span>}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={startDate}
                            onSelect={(date) => setValue('startDate', date)}
                            disabled={(date) =>
                              date < new Date() || (endDate ? date > endDate : false)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.startDate && <FieldError>{errors.startDate.message}</FieldError>}
                    </Field>

                    <Field>
                      <FieldLabel required>Ngày kết thúc</FieldLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !endDate && 'text-muted-foreground',
                            )}
                            disabled={isRecurrenceDisabled}
                          >
                            {endDate ? format(endDate, 'PPP') : <span>Chọn ngày</span>}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={endDate}
                            onSelect={(date) => setValue('endDate', date)}
                            disabled={(date) => (startDate ? date < startDate : date < new Date())}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.endDate && <FieldError>{errors.endDate.message}</FieldError>}
                    </Field>
                  </div>

                  <Field>
                    <div className="flex items-center justify-between mb-2">
                      <FieldLabel required className="mb-0">
                        Lặp lại hàng tuần
                      </FieldLabel>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto py-0 px-2 text-primary hover:text-primary/80"
                        onClick={() => {
                          const current = getValues('weeklyDays') || [];
                          const allDays = WEEKDAYS.map((d) => d.value);
                          if (current.length === allDays.length) {
                            setValue('weeklyDays', []);
                          } else {
                            setValue('weeklyDays', allDays);
                          }
                        }}
                        disabled={isRecurrenceDisabled}
                      >
                        {(weeklyDays?.length || 0) === WEEKDAYS.length
                          ? 'Bỏ chọn tất cả'
                          : 'Chọn tất cả (Hằng ngày)'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 border rounded-lg p-4">
                      {WEEKDAYS.map((day) => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${day.value}`}
                            checked={weeklyDays?.includes(day.value)}
                            onCheckedChange={(checked) => {
                              const current = getValues('weeklyDays') || [];
                              if (checked) setValue('weeklyDays', [...current, day.value]);
                              else
                                setValue(
                                  'weeklyDays',
                                  current.filter((d) => d !== day.value),
                                );
                            }}
                            disabled={isRecurrenceDisabled}
                          />
                          <Label htmlFor={`day-${day.value}`}>{day.label}</Label>
                        </div>
                      ))}
                    </div>
                    {errors.weeklyDays && <FieldError>{errors.weeklyDays.message}</FieldError>}
                  </Field>
                  <Input type="hidden" {...register('recurrenceType')} value="WEEKLY" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="stops">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trạm dừng</TableHead>
                    <TableHead>Tg di chuyển</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Giờ đến (Dự kiến)</TableHead>
                    <TableHead>Giá Thường</TableHead>
                    <TableHead>Giá VIP</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stopFields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <div className="font-medium">
                          {field.customName || `Trạm ${field.stopOrder}`}
                        </div>
                        <div className="text-xs text-muted-foreground">{field.customAddress}</div>
                        {/* Hidden inputs to persist data */}
                        <input
                          type="hidden"
                          {...register(`stops.${index}.stationId`)}
                          value={field.stationId || ''}
                        />
                        <input
                          type="hidden"
                          {...register(`stops.${index}.customName`)}
                          value={field.customName || ''}
                        />
                        <input
                          type="hidden"
                          {...register(`stops.${index}.customAddress`)}
                          value={field.customAddress || ''}
                        />
                        <input
                          type="hidden"
                          {...register(`stops.${index}.stopOrder`, { valueAsNumber: true })}
                          value={field.stopOrder}
                        />
                        <input
                          type="hidden"
                          {...register(`stops.${index}.durationMinutesFromOrigin`, {
                            valueAsNumber: true,
                          })}
                          value={field.durationMinutesFromOrigin}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{field.durationMinutesFromOrigin} phút</div>
                      </TableCell>
                      <TableCell>
                        <Select
                          onValueChange={(value) =>
                            setValue(`stops.${index}.stopType`, value as StopType)
                          }
                          defaultValue={field.stopType}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={StopType.PICKUP}>Đón khách</SelectItem>
                            <SelectItem value={StopType.DROPOFF}>Trả khách</SelectItem>
                            <SelectItem value={StopType.BOTH}>Đón/Trả</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input type="time" {...register(`stops.${index}.estimatedArrivalTime`)} />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-[100px]"
                          {...register(`stops.${index}.normalPrice`, { valueAsNumber: true })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-[100px]"
                          {...register(`stops.${index}.vipPrice`, { valueAsNumber: true })}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const currentStops = getValues('stops') || [];
                            const newStops = currentStops.filter((_, i) => i !== index);
                            replaceStops(newStops);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {stopFields.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Chưa có trạm dừng nào. Vui lòng thêm trạm vào tuyến đường hoặc chọn tuyến
                        đường khác.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex justify-end mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Logic to add manual stop?
                    // Currently stops come from Route. User can verify/modify pricing.
                    // Adding arbitrary stop might disconnect from Route logic.
                    // Let's keep it simple: manage pricing/time derived from route.
                    toast.info('Vui lòng chỉnh sửa trạm dừng trong menu Tuyến đường');
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Thêm trạm (Tùy chỉnh)
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit">{editingTrip ? 'Cập nhật' : 'Tạo mới'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
