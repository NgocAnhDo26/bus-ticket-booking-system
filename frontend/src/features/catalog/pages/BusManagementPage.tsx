import { useCallback, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Bus as BusIcon, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import * as z from 'zod';

import { type ColumnDef, GenericTable } from '@/components/common/GenericTable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  useBusLayouts,
  useBuses,
  useCreateBus,
  useDeleteBus,
  useOperators,
  useUpdateBus,
} from '../hooks';
import type { Bus } from '../types';

const AMENITIES_LIST = ['WiFi', 'Máy lạnh', 'Cổng USB', 'Chăn đắp', 'Nước uống', 'Toilet', 'TV'];

const formSchema = z.object({
  plateNumber: z.string().min(1, 'Biển số xe là bắt buộc'),
  operatorId: z.string().min(1, 'Vui lòng chọn nhà xe'),
  busLayoutId: z.string().min(1, 'Vui lòng nhập layout ID'),
  amenities: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

export const BusManagementPage = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const { data: buses, isLoading: isLoadingBuses } = useBuses();
  const { data: operators } = useOperators();
  const { data: busLayouts } = useBusLayouts();
  const createBus = useCreateBus();
  const updateBus = useUpdateBus();
  const deleteBus = useDeleteBus();
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [deletingBus, setDeletingBus] = useState<Bus | null>(null);

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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingBus) {
      updateBus.mutate(
        { id: editingBus.id, data: values },
        {
          onSuccess: () => {
            setIsOpen(false);
            setEditingBus(null);
            reset();
          },
        },
      );
    } else {
      createBus.mutate(values, {
        onSuccess: () => {
          setIsOpen(false);
          reset();
        },
      });
    }
  };

  const handleEdit = useCallback(
    (bus: Bus) => {
      setEditingBus(bus);
      reset({
        plateNumber: bus.plateNumber,
        operatorId: bus.operator.id,
        busLayoutId: bus.busLayout.id,
        amenities: bus.amenities || [],
      });
      setIsOpen(true);
    },
    [reset],
  );

  const [forceDeleteId, setForceDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deletingBus) {
      deleteBus.mutate(
        { id: deletingBus.id },
        {
          onSuccess: () => {
            setDeletingBus(null);
          },
          onError: (error: Error) => {
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 409) {
              setForceDeleteId(deletingBus.id);
              setDeletingBus(null);
            }
          },
        },
      );
    }
  };

  const handleForceDelete = () => {
    if (forceDeleteId) {
      deleteBus.mutate(
        { id: forceDeleteId, force: true },
        {
          onSuccess: () => {
            setForceDeleteId(null);
            queryClient.invalidateQueries({ queryKey: ['buses'] });
          },
        },
      );
    }
  };

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({ key: 'plateNumber', direction: 'asc' });

  const sortedPaged = useMemo(() => {
    if (!buses) return { data: [], total: 0, totalPages: 1, page: 1 };
    const arr = [...buses];

    if (sorting.key) {
      const key = sorting.key as keyof Bus;
      arr.sort((a, b) => {
        const aVal = a[key] as unknown;
        const bVal = b[key] as unknown;
        if (aVal == null || bVal == null) return 0;
        if (aVal < bVal) return sorting.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sorting.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = arr.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(pageIndex, totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;

    return {
      data: arr.slice(start, end),
      total,
      totalPages,
      page: safePage,
    };
  }, [buses, pageIndex, pageSize, sorting]);

  const meta = {
    total: sortedPaged.total,
    page: sortedPaged.page,
    pageSize,
    totalPages: sortedPaged.totalPages,
  };

  const columns: ColumnDef<Bus>[] = useMemo(
    () => [
      {
        key: 'plateNumber',
        header: 'Biển số',
        sortable: true,
        cell: (bus) => (
          <div className="flex items-center gap-2 flex-wrap">
            <BusIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">{bus.plateNumber}</span>
          </div>
        ),
      },
      {
        key: 'operator',
        header: 'Nhà xe',
        cell: (bus) => bus.operator?.name ?? '-',
      },
      {
        key: 'busLayout',
        header: 'Số ghế',
        sortable: true,
        cell: (bus) => <span>{bus.busLayout?.totalSeats ?? '-'} ghế</span>,
      },
      {
        key: 'amenities',
        header: 'Tiện ích',
        cell: (bus) => (
          <div className="flex flex-wrap gap-1">
            {bus.amenities?.map((amenity, index) => (
              <Badge key={index} className="text-xs">
                {amenity}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        key: 'isActive',
        header: 'Trạng thái',
        sortable: true,
        cell: (bus) => (
          <Badge variant={bus.isActive ? 'default' : 'secondary'}>
            {bus.isActive ? 'Hoạt động' : 'Bảo trì'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: '',
        cell: (bus) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleEdit(bus)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Sửa
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeletingBus(bus)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [handleEdit],
  );

  return (
    <div className="flex flex-col gap-8 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Xe</h1>
        <Dialog
          open={isOpen}
          onOpenChange={(open: boolean) => {
            setIsOpen(open);
            if (!open) {
              setEditingBus(null);
              reset({
                plateNumber: '',
                operatorId: '',
                busLayoutId: '',
                amenities: [],
              });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Thêm Xe
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingBus ? 'Cập nhật Xe' : 'Thêm Xe mới'}</DialogTitle>
              <DialogDescription>Nhập thông tin chi tiết về xe mới.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Field>
                  <FieldLabel>Biển số xe</FieldLabel>
                  <Input placeholder="51B-123.45" {...register('plateNumber')} />
                  <FieldError>{errors.plateNumber?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel>Loại ghế / Sơ đồ</FieldLabel>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register('busLayoutId')}
                  >
                    <option value="">Chọn sơ đồ xe...</option>
                    {busLayouts?.map((layout) => (
                      <option key={layout.id} value={layout.id}>
                        {layout.name} ({layout.totalSeats} ghế, {layout.busType})
                      </option>
                    ))}
                  </select>
                  <FieldError>{errors.busLayoutId?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel>Nhà xe</FieldLabel>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register('operatorId')}
                  >
                    <option value="">Chọn nhà xe...</option>
                    {operators?.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.name}
                      </option>
                    ))}
                  </select>
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
                        />
                        <Label htmlFor={amenity}>{amenity}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createBus.isPending || updateBus.isPending}
                >
                  {createBus.isPending || updateBus.isPending
                    ? 'Đang xử lý...'
                    : editingBus
                      ? 'Cập nhật'
                      : 'Tạo Xe'}
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Xe</CardTitle>
        </CardHeader>
        <CardContent>
          <GenericTable<Bus>
            data={sortedPaged.data}
            columns={columns}
            isLoading={isLoadingBuses}
            meta={meta}
            pageIndex={meta.page}
            pageSize={pageSize}
            sorting={sorting}
            onPageChange={(page) => setPageIndex(page)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPageIndex(1);
            }}
            onSort={(key) =>
              setSorting((prev) => {
                if (prev.key === key) {
                  return {
                    key,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc',
                  };
                }
                return { key, direction: 'asc' };
              })
            }
            getRowId={(bus) => bus.id}
          />
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deletingBus}
        onOpenChange={(open: boolean) => !open && setDeletingBus(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Xe này sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {deleteBus.isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!forceDeleteId}
        onOpenChange={(open: boolean) => !open && setForceDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cảnh báo: Dữ liệu liên quan</AlertDialogTitle>
            <AlertDialogDescription>
              Xe này đang được sử dụng trong các chuyến đi. Bạn có muốn xóa BẮT BUỘC không? Hành
              động này sẽ xóa tất cả các dữ liệu liên quan (chuyến đi, vé).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleForceDelete}
            >
              {deleteBus.isPending ? 'Đang xóa...' : 'Xóa bắt buộc'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
