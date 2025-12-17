import { useEffect } from 'react';
import { Controller, type Resolver, useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { type LayoutConfigFormValues, layoutConfigSchema } from '../schema';
import { useBusLayoutStore } from '../store/useBusLayoutStore';

const BUS_TYPES = [
  { label: 'Thường', value: 'NORMAL' },
  { label: 'Giường nằm', value: 'SLEEPER' },
  { label: 'Limousine', value: 'LIMOUSINE' },
];

type LayoutConfigFormProps = {
  onComplete?: () => void;
  className?: string;
};

export const LayoutConfigForm = ({ onComplete, className }: LayoutConfigFormProps) => {
  const config = useBusLayoutStore((state) => state.config);
  const gridDimensions = useBusLayoutStore((state) => state.gridDimensions);
  const setConfig = useBusLayoutStore((state) => state.setConfig);
  const setStep = useBusLayoutStore((state) => state.setStep);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<LayoutConfigFormValues>({
    resolver: zodResolver(layoutConfigSchema) as Resolver<LayoutConfigFormValues>,
    defaultValues: {
      name: '',
      busType: '',
      totalFloors: 1,
      totalRows: gridDimensions.rows,
      totalCols: gridDimensions.cols,
    },
    mode: 'onChange',
  });

  // Reset form when config changes (e.g., when layout data loads in edit mode)
  // Using config.busType as a stable indicator that real data has loaded
  useEffect(() => {
    const formValues = {
      name: config.name ?? '',
      busType: config.busType ?? '',
      totalFloors: config.totalFloors ?? 1,
      totalRows: config.totalRows ?? gridDimensions.rows,
      totalCols: config.totalCols ?? gridDimensions.cols,
    };
    // Reset with all options to clear dirty state and errors
    reset(formValues, {
      keepErrors: false,
      keepDirty: false,
      keepDirtyValues: false,
      keepValues: false,
      keepDefaultValues: false,
      keepIsSubmitted: false,
      keepTouched: false,
      keepIsValid: false,
      keepSubmitCount: false,
    });
  }, [
    config.name,
    config.busType,
    config.totalFloors,
    config.totalRows,
    config.totalCols,
    gridDimensions.rows,
    gridDimensions.cols,
    reset,
  ]);

  const onSubmit = (values: LayoutConfigFormValues) => {
    setConfig(values);
    setStep(2);
    onComplete?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className={className}>
        <FieldGroup>
          <CardHeader>
            <CardTitle>Bước 1: Cấu hình xe</CardTitle>
            <CardDescription>
              Đặt tên, loại xe và kích thước ma trận ghế trước khi vẽ sơ đồ.
            </CardDescription>
          </CardHeader>
        </FieldGroup>
        <CardContent className="space-y-6">
          <Field data-invalid={!!errors.name}>
            <FieldLabel>Tên sơ đồ</FieldLabel>
            <Input className="max-w-md" placeholder="Giường nằm 40 chỗ" {...register('name')} />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field data-invalid={!!errors.busType}>
              <FieldLabel>Loại xe</FieldLabel>
              <Controller
                name="busType"
                control={control}
                render={({ field }) => (
                  <Select
                    key={field.value} // Force remount when value changes to ensure UI updates
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="max-w-md">
                      <SelectValue placeholder="Chọn loại xe..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BUS_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.busType?.message}</FieldError>
            </Field>
            <Field data-invalid={!!errors.totalFloors}>
              <FieldLabel>Số tầng (tối đa 2)</FieldLabel>
              <Input
                className="max-w-md"
                type="number"
                min={1}
                max={2}
                {...register('totalFloors', { valueAsNumber: true })}
              />
              <FieldError>{errors.totalFloors?.message}</FieldError>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field data-invalid={!!errors.totalCols}>
              <FieldLabel>Số cột</FieldLabel>
              <FieldDescription>Số dãy ghế theo chiều dọc thân xe</FieldDescription>
              <Input
                className="max-w-md"
                type="number"
                min={1}
                {...register('totalCols', { valueAsNumber: true })}
              />
              <FieldError>{errors.totalCols?.message}</FieldError>
            </Field>
            <Field data-invalid={!!errors.totalRows}>
              <FieldLabel>Số hàng</FieldLabel>
              <FieldDescription>Số hàng ghế theo chiều ngang</FieldDescription>
              <Input
                className="max-w-md"
                type="number"
                min={1}
                {...register('totalRows', { valueAsNumber: true })}
              />
              <FieldError>{errors.totalRows?.message}</FieldError>
            </Field>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Quay lại
        </Button>
        <Button type="submit">Tiếp tục tới vẽ sơ đồ</Button>
      </div>
    </form>
  );
};
