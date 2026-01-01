import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useAddRouteStop, useDeleteRouteStop } from '../hooks';
import type { Route, RouteStop } from '../types';

const formSchema = z.object({
  customName: z.string().min(1, 'Vui lòng nhập tên điểm dừng'),
  stopOrder: z.number().min(0, 'Thứ tự phải không âm'),
  durationMinutesFromOrigin: z.number().min(0, 'Thời gian phải không âm'),
  stopType: z.enum(['PICKUP', 'DROPOFF', 'BOTH']),
});

type RouteStopsManagerProps = {
  route: Route;
  isLocalMode?: boolean;
  localStops?: RouteStop[];
  setLocalStops?: (stops: RouteStop[]) => void;
};

export const RouteStopsManager = ({
  route,
  isLocalMode = false,
  localStops = [],
  setLocalStops,
}: RouteStopsManagerProps) => {
  const addStopMutation = useAddRouteStop();
  const deleteStopMutation = useDeleteRouteStop();

  // Use localStops if in local mode, otherwise use route.stops
  const currentStops = isLocalMode ? localStops : route.stops || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customName: '',
      stopOrder: (currentStops.length || 0) + 1,
      durationMinutesFromOrigin: 0,
      stopType: 'BOTH',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Basic Client-side check for order duplication warning (optional)
    const isDuplicateOrder = currentStops.some((s) => s.stopOrder === values.stopOrder);
    if (isDuplicateOrder) {
      if (
        !confirm(
          `Thứ tự ${values.stopOrder} đã tồn tại. Bạn có muốn tiếp tục thêm (các trạm sẽ có cùng thứ tự)?`,
        )
      ) {
        return;
      }
    }

    if (isLocalMode && setLocalStops) {
      // Local Mode: Add to state
      const newStop: RouteStop = {
        id: `temp-${globalThis.crypto.randomUUID()}`, // Temporary ID
        stopOrder: values.stopOrder,
        durationMinutesFromOrigin: values.durationMinutesFromOrigin,
        stopType: values.stopType as 'PICKUP' | 'DROPOFF' | 'BOTH',
        customName: values.customName,
      };
      setLocalStops([...localStops, newStop]);
      reset({
        customName: '',
        stopOrder: (currentStops.length || 0) + 2,
        durationMinutesFromOrigin: 0,
        stopType: 'BOTH',
      });
    } else {
      // API Mode
      addStopMutation.mutate(
        { routeId: route.id, data: { ...values, stationId: undefined, customAddress: undefined } },
        {
          onSuccess: () => {
            // toast.success('Đã thêm điểm dừng thành công');
            reset({
              customName: '',
              stopOrder: (route.stops?.length || 0) + 2, // Auto-increment safely
              durationMinutesFromOrigin: 0,
              stopType: 'BOTH',
            });
          },
          onError: (error: unknown) => {
            // Error handling matching generic backend response
            const msg =
              (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
              (error as Error).message ||
              'Có lỗi xảy ra khi thêm điểm dừng';
            toast.error(`Thêm thất bại: ${msg}`);
          },
        },
      );
    }
  };

  const handleDelete = (stopId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa điểm dừng này?')) {
      if (isLocalMode && setLocalStops) {
        setLocalStops(localStops.filter((s) => s.id !== stopId));
      } else {
        deleteStopMutation.mutate(
          { routeId: route.id, stopId },
          {
            onSuccess: () => toast.success('Đã xoá điểm dừng'),
            onError: () => toast.error('Xoá thất bại'),
          },
        );
      }
    }
  };

  const sortedStops = [...currentStops].sort((a, b) => a.stopOrder - b.stopOrder);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Danh sách điểm dừng trung gian</CardTitle>
          <p className="text-sm text-muted-foreground">
            Quản lý các điểm đón/trả khách giữa {route.originStation?.name || 'Điểm đi'} và{' '}
            {route.destinationStation?.name || 'Điểm đến'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Thứ tự</TableHead>
                  <TableHead>Tên điểm dừng</TableHead>
                  <TableHead>Thời gian từ Đ.Đi</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      Chưa có điểm dừng trung gian nào.{' '}
                      {isLocalMode && '(Dữ liệu sẽ được lưu cùng Tuyến)'}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedStops.map((stop) => (
                    <TableRow key={stop.id}>
                      <TableCell>{stop.stopOrder}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {stop.customName || stop.station?.name || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>{stop.durationMinutesFromOrigin} phút</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                          {stop.stopType === 'PICKUP'
                            ? 'Đón khách'
                            : stop.stopType === 'DROPOFF'
                              ? 'Trả khách'
                              : 'Đón/Trả'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(stop.id)}
                          disabled={!isLocalMode && deleteStopMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Thêm điểm dừng mới {isLocalMode && '(Chế độ nháp)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field data-invalid={!!errors.customName} className="md:col-span-2">
                <FieldLabel>Tên điểm dừng</FieldLabel>
                <Input {...register('customName')} placeholder="Ví dụ: Ngã tư Hàng Xanh..." />
                <FieldError>{errors.customName?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.stopType}>
                <FieldLabel>Loại điểm dừng</FieldLabel>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register('stopType')}
                >
                  <option value="PICKUP">Đón khách</option>
                  <option value="DROPOFF">Trả khách</option>
                  <option value="BOTH">Đón và Trả</option>
                </select>
                <FieldError>{errors.stopType?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.stopOrder}>
                <FieldLabel>Thứ tự</FieldLabel>
                <Input type="number" {...register('stopOrder', { valueAsNumber: true })} />
                <FieldError>{errors.stopOrder?.message}</FieldError>
              </Field>

              <Field data-invalid={!!errors.durationMinutesFromOrigin}>
                <FieldLabel>Thời gian từ điểm đi (phút)</FieldLabel>
                <Input
                  type="number"
                  {...register('durationMinutesFromOrigin', { valueAsNumber: true })}
                />
                <FieldError>{errors.durationMinutesFromOrigin?.message}</FieldError>
              </Field>
            </div>

            <Button
              type="submit"
              disabled={!isLocalMode && addStopMutation.isPending}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              {!isLocalMode && addStopMutation.isPending
                ? 'Đang thêm...'
                : 'Thêm điểm dừng vào danh sách'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
