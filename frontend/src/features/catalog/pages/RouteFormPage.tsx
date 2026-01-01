import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { RouteStopsManager } from '../components/RouteStopsManager';
import { useCreateRoute, useRouteById, useStations, useUpdateRoute } from '../hooks';
import type { Route, RouteStop, Station } from '../types';

const formSchema = z.object({
  name: z.string().optional(),
  originStationId: z.string().min(1, 'Vui lòng chọn điểm đi'),
  destinationStationId: z.string().min(1, 'Vui lòng chọn điểm đến'),
  durationMinutes: z.number().min(1, 'Thời gian di chuyển phải lớn hơn 0'),
  distanceKm: z.number().min(1, 'Khoảng cách phải lớn hơn 0'),
});

export const RouteFormPage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const { data: stations } = useStations();
  const { data: route, isLoading: isLoadingRoute } = useRouteById(id);

  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();

  const [localStops, setLocalStops] = useState<RouteStop[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      originStationId: '',
      destinationStationId: '',
      durationMinutes: 0,
      distanceKm: 0,
    },
  });

  // Load route data when editing
  useEffect(() => {
    if (route) {
      reset({
        name: route.name || '',
        originStationId: route.originStation.id,
        destinationStationId: route.destinationStation.id,
        durationMinutes: route.durationMinutes,
        distanceKm: route.distanceKm,
      });
    }
  }, [route, reset]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isEditing && id) {
      updateRoute.mutate(
        { id, data: values },
        {
          onSuccess: () => {
            toast.success('Cập nhật tuyến đường thành công!');
            navigate('/admin/catalog/routes');
          },
          onError: (error) => {
            toast.error('Cập nhật thất bại: ' + error.message);
          },
        },
      );
    } else {
      // Unite creation: Include stops in the request
      const payload = {
        ...values,
        stops: localStops.map((s) => ({
          stationId: s.station?.id, // Should remain undefined for custom stops
          customName: s.customName,
          customAddress: s.customAddress,
          stopOrder: s.stopOrder,
          durationMinutesFromOrigin: s.durationMinutesFromOrigin,
          stopType: s.stopType,
        })),
      };

      createRoute.mutate(payload, {
        onSuccess: () => {
          toast.success('Tạo tuyến đường và các điểm dừng thành công!');
          navigate('/admin/catalog/routes');
        },
        onError: (error) => {
          toast.error('Tạo thất bại: ' + error.message);
        },
      });
    }
  };

  // Watch form values for dynamic preview in RouteStopsManager (in create mode)
  const watchedValues = watch();

  // Construct a partial/preview route object for the Manager
  const previewRoute: Route =
    isEditing && route
      ? route
      : {
          id: 'temp',
          name: watchedValues.name,
          originStation:
            stations?.find((s) => s.id === watchedValues.originStationId) ||
            ({ id: 'mock', name: 'Điểm đi' } as unknown as Station),
          destinationStation:
            stations?.find((s) => s.id === watchedValues.destinationStationId) ||
            ({ id: 'mock', name: 'Điểm đến' } as unknown as Station),
          durationMinutes: watchedValues.durationMinutes || 0,
          distanceKm: watchedValues.distanceKm || 0,
          isActive: true,
          createdAt: '',
          stops: [],
        };

  if (isEditing && isLoadingRoute) {
    return <div>Đang tải thông tin tuyến đường...</div>;
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto p-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/catalog/routes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? 'Cập nhật Tuyến đường' : 'Tạo Tuyến đường mới'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? 'Chỉnh sửa thông tin tuyến đường và quản lý các trạm dừng.'
              : 'Nhập thông tin cơ bản và thêm các điểm dừng trước khi lưu.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Field data-invalid={!!errors.name}>
                  <FieldLabel>Tên tuyến (Tùy chọn)</FieldLabel>
                  <Input
                    {...register('name')}
                    placeholder="VD: Sài Gòn - Đà Lạt (Cao tốc)"
                    disabled={createRoute.isPending || updateRoute.isPending}
                  />
                  <FieldError>{errors.name?.message}</FieldError>
                </Field>

                <Field data-invalid={!!errors.originStationId}>
                  <FieldLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Điểm đi
                  </FieldLabel>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register('originStationId')}
                    disabled={createRoute.isPending || updateRoute.isPending}
                  >
                    <option value="">Chọn điểm đi...</option>
                    {stations?.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name} ({station.city})
                      </option>
                    ))}
                  </select>
                  <FieldError>{errors.originStationId?.message}</FieldError>
                </Field>

                <Field data-invalid={!!errors.destinationStationId}>
                  <FieldLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Điểm đến
                  </FieldLabel>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register('destinationStationId')}
                    disabled={createRoute.isPending || updateRoute.isPending}
                  >
                    <option value="">Chọn điểm đến...</option>
                    {stations?.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name} ({station.city})
                      </option>
                    ))}
                  </select>
                  <FieldError>{errors.destinationStationId?.message}</FieldError>
                </Field>

                <Field data-invalid={!!errors.durationMinutes}>
                  <FieldLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Thời gian (phút)
                  </FieldLabel>
                  <Input
                    type="number"
                    {...register('durationMinutes', { valueAsNumber: true })}
                    disabled={createRoute.isPending || updateRoute.isPending}
                  />
                  <FieldError>{errors.durationMinutes?.message}</FieldError>
                </Field>

                <Field data-invalid={!!errors.distanceKm}>
                  <FieldLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Khoảng cách (km)
                  </FieldLabel>
                  <Input
                    type="number"
                    step="0.1"
                    {...register('distanceKm', { valueAsNumber: true })}
                    disabled={createRoute.isPending || updateRoute.isPending}
                  />
                  <FieldError>{errors.distanceKm?.message}</FieldError>
                </Field>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createRoute.isPending || updateRoute.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {createRoute.isPending || updateRoute.isPending
                    ? 'Đang xử lý...'
                    : isEditing
                      ? 'Lưu thay đổi'
                      : 'Lưu Tuyến & Điểm dừng'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stops Management (Visible in both modes now) */}
        <div className="lg:col-span-2 space-y-6">
          <RouteStopsManager
            route={previewRoute}
            isLocalMode={!isEditing}
            localStops={localStops}
            setLocalStops={setLocalStops}
          />
        </div>
      </div>
    </div>
  );
};
