import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Bus as BusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FormField } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GenericTable, type ColumnDef } from "@/components/common/GenericTable";
import { useBuses, useCreateBus, useOperators } from "../hooks";
import type { Bus } from "../types";

const AMENITIES_LIST = [
  "WiFi",
  "Máy lạnh",
  "Cổng USB",
  "Chăn đắp",
  "Nước uống",
  "Toilet",
  "TV",
];

const formSchema = z.object({
  plateNumber: z.string().min(1, "Biển số xe là bắt buộc"),
  capacity: z.number().min(1, "Sức chứa phải lớn hơn 0"),
  operatorId: z.string().min(1, "Vui lòng chọn nhà xe"),
  amenities: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

export const BusManagementPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: buses, isLoading: isLoadingBuses } = useBuses();
  const { data: operators } = useOperators();
  const createBus = useCreateBus();

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
      plateNumber: "",
      capacity: 40,
      operatorId: "",
      amenities: [],
    },
  });

  const selectedAmenities = useWatch({ control, name: "amenities" }) ?? [];

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    if (checked) {
      setValue("amenities", [...selectedAmenities, amenity]);
    } else {
      setValue(
        "amenities",
        selectedAmenities.filter((item) => item !== amenity),
      );
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createBus.mutate(values, {
      onSuccess: () => {
        setIsOpen(false);
        reset();
      },
    });
  };

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<{
    key: string | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });

  const sortedPaged = useMemo(() => {
    if (!buses) return { data: [], total: 0, totalPages: 1, page: 1 };
    const arr = [...buses];

    if (sorting.key) {
      const key = sorting.key as keyof Bus;
      arr.sort((a, b) => {
        const aVal = a[key] as unknown;
        const bVal = b[key] as unknown;
        if (aVal == null || bVal == null) return 0;
        if (aVal < bVal) return sorting.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sorting.direction === "asc" ? 1 : -1;
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
        key: "plateNumber",
        header: "Biển số",
        sortable: true,
        cell: (bus) => (
          <div className="flex items-center gap-2">
            <BusIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{bus.plateNumber}</span>
          </div>
        ),
      },
      {
        key: "operator",
        header: "Nhà xe",
        cell: (bus) => bus.operator?.name ?? "-",
      },
      {
        key: "capacity",
        header: "Sức chứa",
        sortable: true,
        cell: (bus) => <span>{bus.capacity} ghế</span>,
      },
      {
        key: "amenities",
        header: "Tiện ích",
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
        key: "isActive",
        header: "Trạng thái",
        sortable: true,
        cell: (bus) => (
          <Badge variant={bus.isActive ? "success" : "default"}>
            {bus.isActive ? "Hoạt động" : "Bảo trì"}
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Xe</h1>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Thêm Xe
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Thêm Xe mới</SheetTitle>
              <SheetDescription>
                Nhập thông tin chi tiết về xe mới.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  label="Biển số xe"
                  error={errors.plateNumber?.message}
                >
                  <Input
                    placeholder="51B-123.45"
                    {...register("plateNumber")}
                  />
                </FormField>
                <FormField
                  label="Sức chứa (ghế)"
                  error={errors.capacity?.message}
                >
                  <Input type="number" {...register("capacity")} />
                </FormField>
                <FormField label="Nhà xe" error={errors.operatorId?.message}>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("operatorId")}
                  >
                    <option value="">Chọn nhà xe...</option>
                    {operators?.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <div className="space-y-2">
                  <Label>Tiện ích</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {AMENITIES_LIST.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity}
                          checked={selectedAmenities.includes(amenity)}
                          onCheckedChange={(checked: boolean | "indeterminate") =>
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
                  disabled={createBus.isPending}
                >
                  {createBus.isPending ? "Đang tạo..." : "Tạo Xe"}
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
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
                    direction: prev.direction === "asc" ? "desc" : "asc",
                  };
                }
                return { key, direction: "asc" };
              })
            }
            getRowId={(bus) => bus.id}
          />
        </CardContent>
      </Card>
    </div>
  );
};
