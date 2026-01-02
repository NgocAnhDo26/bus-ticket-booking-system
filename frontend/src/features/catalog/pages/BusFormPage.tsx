import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { BusImageUpload, type BusImageUploadRef } from '../components/BusImageUpload';
import { useBusById, useBusLayouts, useCreateBus, useOperators, useUpdateBus } from '../hooks';

const AMENITIES_LIST = ['WiFi', 'Máy lạnh', 'Cổng USB', 'Chăn đắp', 'Nước uống', 'Toilet', 'TV'];

const formSchema = z.object({
  plateNumber: z.string().min(1, 'Biển số xe là bắt buộc'),
  operatorId: z.string().min(1, 'Vui lòng chọn nhà xe'),
  busLayoutId: z.string().min(1, 'Vui lòng chọn sơ đồ xe'),
  amenities: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

export const BusFormPage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const { data: operators } = useOperators();
  const { data: busLayouts } = useBusLayouts();
  const { data: bus, isLoading: isLoadingBus } = useBusById(id);

  const createBus = useCreateBus();
  const updateBus = useUpdateBus();

  const imageUploadRef = useRef<BusImageUploadRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive initialPhotos from bus data instead of using setState in effect
  const initialPhotos = useMemo(() => bus?.photos || [], [bus?.photos]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plateNumber: '',
      operatorId: '',
      busLayoutId: '',
      amenities: [],
    },
  });

  const selectedAmenities = useWatch({ control, name: 'amenities' }) ?? [];
  const watchedBusLayoutId = useWatch({ control, name: 'busLayoutId' });
  const watchedOperatorId = useWatch({ control, name: 'operatorId' });

  // Load bus data when editing
  useEffect(() => {
    if (bus) {
      reset({
        plateNumber: bus.plateNumber,
        operatorId: bus.operator.id,
        busLayoutId: bus.busLayout.id,
        amenities: bus.amenities || [],
      });
    }
  }, [bus, reset]);

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    if (checked) {
      setValue('amenities', [...selectedAmenities, amenity]);
    } else {
      setValue(
        'amenities',
        selectedAmenities.filter((item) => item !== amenity),
      );
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    const saveOperation = async () => {
      // First upload any pending photos
      let photos: string[] = initialPhotos;
      if (imageUploadRef.current) {
        photos = await imageUploadRef.current.uploadPendingFiles();
      }

      const submitData = {
        ...values,
        photos,
      };

      if (isEditing && id) {
        await updateBus.mutateAsync({ id, data: submitData });
      } else {
        await createBus.mutateAsync(submitData);
      }

      navigate('/admin/catalog/buses');
    };

    toast.promise(saveOperation(), {
      loading: isEditing ? 'Đang cập nhật xe...' : 'Đang tạo xe mới...',
      success: isEditing ? 'Cập nhật xe thành công!' : 'Tạo xe mới thành công!',
      error: (error) =>
        isEditing
          ? 'Cập nhật thất bại: ' + (error instanceof Error ? error.message : 'Lỗi không xác định')
          : 'Tạo thất bại: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'),
      finally: () => setIsSubmitting(false),
    });
  };

  if (isEditing && isLoadingBus) {
    return <div className="p-4">Đang tải thông tin xe...</div>;
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto p-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/catalog/buses')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? 'Cập nhật Xe' : 'Thêm Xe mới'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? 'Chỉnh sửa thông tin xe và hình ảnh.'
              : 'Nhập thông tin xe và thêm hình ảnh.'}
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
              <form id="bus-form" onSubmit={(e) => handleSubmit(onSubmit)(e)} className="space-y-4">
                <Field data-invalid={!!errors.plateNumber}>
                  <FieldLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Biển số xe
                  </FieldLabel>
                  <Input
                    placeholder="VD: 51B-123.45"
                    {...register('plateNumber')}
                    disabled={isSubmitting}
                  />
                  <FieldError>{errors.plateNumber?.message}</FieldError>
                </Field>

                <Field data-invalid={!!errors.busLayoutId}>
                  <FieldLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Loại ghế / Sơ đồ
                  </FieldLabel>
                  <Select
                    key={`busLayout-${watchedBusLayoutId || 'empty'}`}
                    onValueChange={(value) => setValue('busLayoutId', value)}
                    value={watchedBusLayoutId || ''}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn sơ đồ xe..." />
                    </SelectTrigger>
                    <SelectContent>
                      {busLayouts?.map((layout) => (
                        <SelectItem key={layout.id} value={layout.id}>
                          {layout.name} ({layout.totalSeats} ghế, {layout.busType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.busLayoutId?.message}</FieldError>
                </Field>

                <Field data-invalid={!!errors.operatorId}>
                  <FieldLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Nhà xe
                  </FieldLabel>
                  <Select
                    key={`operator-${watchedOperatorId || 'empty'}`}
                    onValueChange={(value) => setValue('operatorId', value)}
                    value={watchedOperatorId || ''}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn nhà xe..." />
                    </SelectTrigger>
                    <SelectContent>
                      {operators?.map((op) => (
                        <SelectItem key={op.id} value={op.id}>
                          {op.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.operatorId?.message}</FieldError>
                </Field>

                <div className="space-y-2">
                  <Label>Tiện ích</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {AMENITIES_LIST.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity}
                          checked={selectedAmenities.includes(amenity)}
                          onCheckedChange={(checked: boolean | 'indeterminate') =>
                            handleAmenityChange(amenity, checked === true)
                          }
                          disabled={isSubmitting}
                        />
                        <Label htmlFor={amenity}>{amenity}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Đang xử lý...' : isEditing ? 'Lưu thay đổi' : 'Tạo Xe'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Photos */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hình ảnh xe</CardTitle>
            </CardHeader>
            <CardContent>
              <BusImageUpload
                ref={imageUploadRef}
                initialPhotos={initialPhotos}
                maxFiles={10}
                maxTotalSize={50}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
