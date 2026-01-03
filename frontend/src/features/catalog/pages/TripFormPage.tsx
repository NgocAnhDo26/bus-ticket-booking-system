import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertCircle, ArrowLeft, Calendar, Clock, MapPin, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getFriendlyErrorMessage } from '@/utils/error-utils';

import {
  useBuses,
  useCheckCanUpdateRecurrence,
  useCreateTrip,
  useRoutes,
  useTripById,
  useUpdateTrip,
} from '../hooks';
import { type Route, SeatType, StopType } from '../types';

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
  );

type TripSchema = z.infer<typeof formSchema>;

export const TripFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const queryClient = useQueryClient();
  const { data: routes } = useRoutes();
  const { data: buses } = useBuses();
  const { data: editingTrip, isLoading: isLoadingTrip } = useTripById(id);

  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();

  // Check if we can change recurrence (only for existing trips)
  const { data: recurrenceCheck } = useCheckCanUpdateRecurrence(id);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors, isSubmitting },
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

  const routeId = watch('routeId');
  const tripType = watch('tripType');
  const departureDate = watch('departureDate');
  // departureTime is used in render but extracted from watch inside JSX or handled via rhf

  // Load route details logic matches Dialog
  useEffect(() => {
    if (routeId && buses) {
      const selectedRoute = routes?.find((r) => r.id === routeId);
      if (selectedRoute) {
        // Only reset stops if NOT editing or if user manually changed route (and it differs from original)
        const isOriginalRoute = editingTrip && editingTrip.route.id === routeId;

        if (!isEditing || !isOriginalRoute) {
          const defaultStops = (selectedRoute.stops || []).map((stop) => ({
            stationId: stop.station?.id,
            customName: stop.customName,
            customAddress: stop.customAddress || '',
            stopOrder: stop.stopOrder,
            durationMinutesFromOrigin: stop.durationMinutesFromOrigin,
            stopType: stop.stopType,
            estimatedArrivalTime: '',
            normalPrice: 0,
            vipPrice: 0,
          }));

          // Only replace if stops array is empty or different route
          // This check prevents infinite loop or overwriting valid input
          if (stopFields.length === 0 || !isOriginalRoute) {
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

            const calculatedStops = defaultStops.map((stop) => {
              let arrivalTime = '';
              if (baseDate) {
                const duration = stop.durationMinutesFromOrigin || 0;
                const arrival = new Date(baseDate.getTime() + duration * 60000);
                arrivalTime = format(arrival, 'HH:mm');
              }
              return { ...stop, estimatedArrivalTime: arrivalTime };
            });

            replaceStops(calculatedStops);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, routes, buses, editingTrip?.route.id, isEditing]);

  // Auto-calculate stop arrival times
  const depDate = watch('departureDate');
  const depTime = watch('departureTime');

  useEffect(() => {
    const currentStops = getValues('stops') || [];
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
    if (editingTrip) {
      reset({
        routeId: editingTrip.route.id,
        busId: editingTrip.bus.id,
        tripType: 'SINGLE',
        departureDate: new Date(editingTrip.departureTime),
        departureTime: format(new Date(editingTrip.departureTime), 'HH:mm'),
        pricings: editingTrip.tripPricings.map((p) => ({
          seatType: p.seatType,
          price: Number(p.price),
        })),
        stops: (editingTrip.route.stops || []).map((stop) => ({
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
        })),
      });
    } else {
      // Init default pricings if creating new
      if (!isEditing && pricingFields.length === 0) {
        setValue('pricings', [
          { seatType: SeatType.NORMAL, price: 0 },
          { seatType: SeatType.VIP, price: 0 },
        ]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTrip, reset, isEditing]);

  const onSubmit = (data: TripSchema) => {
    try {
      let depTimeStr: string;
      if (data.tripType === 'RECURRING') {
        const [hours, minutes] = (data.departureTime || '00:00').split(':').map(Number);
        const date = new Date(data.startDate!);
        date.setHours(hours);
        date.setMinutes(minutes);
        depTimeStr = date.toISOString();
      } else {
        depTimeStr = data.departureDate!.toISOString();
      }

      // Calculate arrival datetime based on route duration
      const depDate = new Date(depTimeStr);
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
        departureTime: depTimeStr,
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

      const mutation = isEditing ? updateTrip : createTrip;
      // @ts-expect-error - Mutation inputs for Create/Update slightly differ but payload is compatible
      mutation.mutate(isEditing ? { id: id!, data: tripPayload } : tripPayload, {
        onSuccess: () => {
          toast.success(
            isEditing ? 'Cập nhật chuyến đi thành công' : 'Đã tạo chuyến đi thành công',
          );
          queryClient.invalidateQueries({ queryKey: ['trips'] });
          navigate('/admin/catalog/trips');
        },
        onError: (error) => {
          toast.error(isEditing ? 'Cập nhật thất bại' : 'Tạo thất bại', {
            description: getFriendlyErrorMessage(error),
          });
        },
      });
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Có lỗi xảy ra khi xử lý dữ liệu');
    }
  };

  const isRecurrenceDisabled = Boolean(isEditing && recurrenceCheck && !recurrenceCheck.canUpdate);

  if (isLoadingTrip) {
    return <div className="p-8 text-center">Đang tải dữ liệu chuyến đi...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/catalog/trips')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? 'Cập nhật Chuyến đi' : 'Tạo Chuyến đi mới'}
          </h1>
          <p className="text-muted-foreground">
            Quản lý thông tin chuyến đi, lịch trình và giá vé chi tiết.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit, (errors) => {
          console.error('Form validation errors:', errors);

          // Helper to extract all error messages recursively (safe version)
          const getErrorMessages = (obj: unknown): string[] => {
            const messages = new Set<string>();
            const extract = (item: unknown, depth = 0) => {
              if (!item || depth > 10) return; // Prevent infinite recursion
              if (typeof item !== 'object') return;

              // If it has a message, add it
              if (
                item &&
                'message' in (item as Record<string, unknown>) &&
                typeof (item as Record<string, unknown>).message === 'string'
              ) {
                messages.add((item as { message: string }).message);
              }

              // Recurse into children, strictly avoiding 'ref' (DOM element)
              Object.keys(item as object).forEach((key) => {
                if (key === 'ref') return;
                extract((item as Record<string, unknown>)[key], depth + 1);
              });
            };
            extract(obj);
            return Array.from(messages);
          };

          const errorMsgs = getErrorMessages(errors);

          toast.error('Dữ liệu không hợp lệ', {
            description:
              errorMsgs.length > 0 ? (
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  {errorMsgs.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              ) : (
                'Vui lòng kiểm tra lại các trường bắt buộc.'
              ),
          });
        })}
        className="space-y-8"
      >
        {/* Section 1: Basic Info & Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Thông tin Tuyến & Xe
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  Tuyến đường
                </FieldLabel>
                <Select
                  onValueChange={(value) => setValue('routeId', value)}
                  defaultValue={watch('routeId')}
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
                <FieldLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  Xe
                </FieldLabel>
                <Select
                  onValueChange={(value) => setValue('busId', value)}
                  defaultValue={watch('busId')}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Loại Chuyến đi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2 border p-3 rounded-md">
                  <Checkbox
                    id="type-single"
                    checked={tripType === 'SINGLE'}
                    onCheckedChange={() => setValue('tripType', 'SINGLE')}
                    disabled={isRecurrenceDisabled && tripType === 'RECURRING'}
                  />
                  <Label htmlFor="type-single" className="cursor-pointer flex-1">
                    Chuyến đi đơn
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border p-3 rounded-md">
                  <Checkbox
                    id="type-recurring"
                    checked={tripType === 'RECURRING'}
                    onCheckedChange={() => setValue('tripType', 'RECURRING')}
                    disabled={isRecurrenceDisabled && tripType === 'SINGLE'}
                  />
                  <Label htmlFor="type-recurring" className="cursor-pointer flex-1">
                    Lịch lặp lại
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 2: Details Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Chi tiết Lịch trình
            </CardTitle>
            <CardDescription>Cấu hình thời gian khởi hành và lặp lại.</CardDescription>
          </CardHeader>
          <CardContent>
            {isRecurrenceDisabled && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>
                  Có {recurrenceCheck?.futureBookingsCount} đặt vé trong tương lai. Không thể thay
                  đổi cấu hình lặp lại.
                </span>
              </div>
            )}

            {tripType === 'SINGLE' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Ngày khởi hành
                  </FieldLabel>
                  <DatePicker
                    date={departureDate}
                    setDate={(date) => {
                      if (date) {
                        const current = departureDate || new Date();
                        date.setHours(current.getHours());
                        date.setMinutes(current.getMinutes());
                        setValue('departureDate', date);
                      } else {
                        setValue('departureDate', undefined); // eslint-disable-line @typescript-eslint/no-explicit-any
                      }
                    }}
                    placeholder="Chọn ngày"
                  />
                </Field>
                <Field>
                  <FieldLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Giờ khởi hành
                  </FieldLabel>
                  <TimePicker
                    date={departureDate}
                    setDate={(date) => {
                      // If we get a date (has time), we update just the time part of our departureDate
                      if (date) {
                        const current = departureDate || new Date();
                        current.setHours(date.getHours());
                        current.setMinutes(date.getMinutes());
                        setValue('departureDate', new Date(current));
                      }
                    }}
                  />
                  {errors.departureDate && <FieldError>{errors.departureDate.message}</FieldError>}
                </Field>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      Giờ khởi hành (Hàng ngày)
                    </FieldLabel>
                    <div className="relative">
                      <TimePicker
                        disabled={isRecurrenceDisabled}
                        date={(() => {
                          const val = watch('departureTime');
                          if (!val) return undefined;
                          const [h, m] = val.split(':').map(Number);
                          const d = new Date();
                          d.setHours(h);
                          d.setMinutes(m);
                          return d;
                        })()}
                        setDate={(date) => {
                          if (date) {
                            const timeStr = format(date, 'HH:mm');
                            setValue('departureTime', timeStr);
                          }
                        }}
                      />
                    </div>
                    {errors.departureTime && (
                      <FieldError>{errors.departureTime.message}</FieldError>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      Ngày bắt đầu
                    </FieldLabel>
                    <DatePicker
                      date={watch('startDate')}
                      setDate={(date) => setValue('startDate', date)}
                      placeholder="Chọn ngày"
                      disabled={isRecurrenceDisabled}
                      fromDate={new Date()}
                      toDate={watch('endDate')}
                    />
                    {errors.startDate && <FieldError>{errors.startDate.message}</FieldError>}
                  </Field>

                  <Field>
                    <FieldLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      Ngày kết thúc
                    </FieldLabel>
                    <DatePicker
                      date={watch('endDate')}
                      setDate={(date) => setValue('endDate', date)}
                      placeholder="Chọn ngày"
                      disabled={isRecurrenceDisabled}
                      fromDate={watch('startDate') || new Date()}
                    />
                    {errors.endDate && <FieldError>{errors.endDate.message}</FieldError>}
                  </Field>
                </div>

                <Field>
                  <div className="flex items-center justify-between mb-2">
                    <FieldLabel className="after:content-['*'] after:ml-0.5 after:text-red-500 mb-0">
                      Lặp lại vào các thứ
                    </FieldLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80"
                      onClick={() => {
                        const current = watch('weeklyDays') || [];
                        const allDays = WEEKDAYS.map((d) => d.value);
                        if (current.length === allDays.length) {
                          setValue('weeklyDays', []);
                        } else {
                          setValue('weeklyDays', allDays);
                        }
                      }}
                      disabled={isRecurrenceDisabled}
                    >
                      {(watch('weeklyDays')?.length || 0) === WEEKDAYS.length
                        ? 'Bỏ chọn tất cả'
                        : 'Chọn tất cả (Hằng ngày)'}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-4 border rounded-lg p-4 bg-gray-50/50">
                    {WEEKDAYS.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={watch('weeklyDays')?.includes(day.value)}
                          onCheckedChange={(checked) => {
                            const current = watch('weeklyDays') || [];
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
                </Field>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Pricing & Stops */}
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="bg-primary/5">
            <CardTitle>Cấu Hình Giá vé & Trạm Dừng</CardTitle>
            <CardDescription>
              Thiết lập giá cơ bản và tùy chỉnh chi tiết cho từng trạm dừng.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6 border-b bg-white">
              <Label className="text-base font-semibold mb-3 block">
                Giá vé cơ bản (toàn tuyến)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pricingFields.map((field, index) => (
                  <Field key={field.id} className="bg-slate-50 p-3 rounded-md border">
                    <FieldLabel className="capitalize font-medium">
                      {watch(`pricings.${index}.seatType`) === 'NORMAL' ? 'Ghế thường' : 'Ghế VIP'}
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        type="number"
                        className="pl-8 font-bold"
                        {...register(`pricings.${index}.price`, { valueAsNumber: true })}
                      />
                      <span className="absolute left-3 top-2.5 text-gray-500 text-sm">₫</span>
                    </div>
                    {errors.pricings?.[index]?.price && (
                      <FieldError>{errors.pricings[index]?.price?.message}</FieldError>
                    )}
                  </Field>
                ))}
                {pricingFields.length === 0 && (
                  <div className="text-sm text-yellow-600 col-span-3">
                    Vui lòng chọn Xe để hiển thị cấu hình giá vé.
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">
                  Danh sách Trạm dừng & Giá chi tiết
                </Label>
                <div className="text-sm text-muted-foreground bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  Dữ liệu được tải từ Tuyến đường đã chọn
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[50px]">TT</TableHead>
                      <TableHead className="w-[200px]">Trạm dừng</TableHead>
                      <TableHead className="w-[150px]">Loại</TableHead>
                      <TableHead className="w-[100px]">Tg di chuyển</TableHead>
                      <TableHead className="w-[150px]">Giờ đến (Dự kiến)</TableHead>
                      <TableHead className="w-[180px]">Giá Thường (Tại trạm)</TableHead>
                      <TableHead className="w-[180px]">Giá VIP (Tại trạm)</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stopFields.map((field, index) => (
                      <TableRow key={field.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium text-center">{field.stopOrder}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-primary">
                            {field.customName || `Trạm ${field.stopOrder}`}
                          </div>
                          <div
                            className="text-xs text-muted-foreground truncate max-w-[180px]"
                            title={field.customAddress}
                          >
                            {field.customAddress}
                          </div>
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
                          <Select
                            onValueChange={(value) =>
                              setValue(`stops.${index}.stopType`, value as StopType)
                            }
                            defaultValue={field.stopType}
                          >
                            <SelectTrigger className="h-8">
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
                          <div className="text-sm text-center">
                            {field.durationMinutesFromOrigin} phút
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="time"
                            className="h-9"
                            {...register(`stops.${index}.estimatedArrivalTime`)}
                          />
                          {errors.stops?.[index]?.estimatedArrivalTime && (
                            <div className="text-[0.8rem] font-medium text-destructive mt-1">
                              {errors.stops[index]?.estimatedArrivalTime?.message}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <Input
                              type="number"
                              className={cn(
                                'h-9 pl-7',
                                errors.stops?.[index]?.normalPrice && 'border-destructive',
                              )}
                              placeholder="Mặc định"
                              {...register(`stops.${index}.normalPrice`, { valueAsNumber: true })}
                            />
                            <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs">
                              ₫
                            </span>
                          </div>
                          {errors.stops?.[index]?.normalPrice && (
                            <div className="text-[0.8rem] font-medium text-destructive mt-1">
                              {errors.stops[index]?.normalPrice?.message}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <Input
                              type="number"
                              className={cn(
                                'h-9 pl-7',
                                errors.stops?.[index]?.vipPrice && 'border-destructive',
                              )}
                              placeholder="Mặc định"
                              {...register(`stops.${index}.vipPrice`, { valueAsNumber: true })}
                            />
                            <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs">
                              ₫
                            </span>
                          </div>
                          {errors.stops?.[index]?.vipPrice && (
                            <div className="text-[0.8rem] font-medium text-destructive mt-1">
                              {errors.stops[index]?.vipPrice?.message}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              const currentStops = watch('stops') || [];
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
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          Chưa có dữ liệu trạm dừng.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 sticky bottom-6 bg-background/95 p-4 border rounded-lg shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate('/admin/catalog/trips')}
          >
            Hủy bỏ
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-[150px]">
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? 'Lưu thay đổi' : 'Tạo chuyến đi'}
          </Button>
        </div>
      </form>
    </div>
  );
};
