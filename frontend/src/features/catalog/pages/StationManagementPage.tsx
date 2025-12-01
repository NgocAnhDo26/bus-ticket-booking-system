import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { GenericTable, type ColumnDef } from "@/components/common";
import { useStations, useCreateStation } from "../hooks";
import type { Station } from "../types";

const formSchema = z.object({
  name: z.string().min(1, "Tên bến xe là bắt buộc"),
  city: z.string().min(1, "Thành phố là bắt buộc"),
  address: z.string().min(1, "Địa chỉ là bắt buộc"),
});

export const StationManagementPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: stations, isLoading } = useStations();
  const createStation = useCreateStation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      city: "",
      address: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createStation.mutate(values, {
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
    if (!stations) return { data: [], total: 0, totalPages: 1, page: 1 };
    const arr = [...stations];

    if (sorting.key) {
      const key = sorting.key as keyof Station;
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
  }, [stations, pageIndex, pageSize, sorting]);

  const meta = {
    total: sortedPaged.total,
    page: sortedPaged.page,
    pageSize,
    totalPages: sortedPaged.totalPages,
  };

  const columns: ColumnDef<Station>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Tên bến xe",
        sortable: true,
        cell: (station) => (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {station.name}
          </div>
        ),
      },
      {
        key: "city",
        header: "Thành phố",
        sortable: true,
        cell: (station) => station.city,
      },
      {
        key: "address",
        header: "Địa chỉ",
        cell: (station) => station.address,
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Bến xe</h1>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Thêm Bến xe
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Thêm Bến xe mới</SheetTitle>
              <SheetDescription>
                Nhập thông tin chi tiết về bến xe mới.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormField label="Tên bến xe" error={errors.name?.message}>
                  <Input
                    placeholder="Bến xe Miền Đông"
                    {...register("name")}
                  />
                </FormField>
                <FormField label="Thành phố" error={errors.city?.message}>
                  <Input placeholder="Hồ Chí Minh" {...register("city")} />
                </FormField>
                <FormField label="Địa chỉ" error={errors.address?.message}>
                  <Input
                    placeholder="292 Đinh Bộ Lĩnh..."
                    {...register("address")}
                  />
                </FormField>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createStation.isPending}
                >
                  {createStation.isPending ? "Đang tạo..." : "Tạo Bến xe"}
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Bến xe</CardTitle>
        </CardHeader>
        <CardContent>
          <GenericTable<Station>
            data={sortedPaged.data}
            columns={columns}
            isLoading={isLoading}
            meta={meta}
            pageIndex={meta.page}
            pageSize={pageSize}
            sorting={sorting}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPageIndex(1);
            }}
            onSort={(key) =>
              setSorting((prev) =>
                prev.key === key
                  ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
                  : { key, direction: "asc" },
              )
            }
            getRowId={(station) => station.id}
          />
        </CardContent>
      </Card>
    </div>
  );
};
