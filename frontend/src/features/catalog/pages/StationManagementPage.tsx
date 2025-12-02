import { useMemo, useState, useCallback } from "react";
import { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, MapPin, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useStations, useCreateStation, useUpdateStation, useDeleteStation } from "../hooks";
import type { Station } from "../types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  name: z.string().min(1, "Tên bến xe là bắt buộc"),
  city: z.string().min(1, "Thành phố là bắt buộc"),
  address: z.string().min(1, "Địa chỉ là bắt buộc"),
});

export const StationManagementPage = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const { data: stations, isLoading } = useStations();
  const createStation = useCreateStation();
  const updateStation = useUpdateStation();
  const deleteStation = useDeleteStation();
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [deletingStation, setDeletingStation] = useState<Station | null>(null);

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
    if (editingStation) {
      updateStation.mutate(
        { id: editingStation.id, data: values },
        {
          onSuccess: () => {
            setIsOpen(false);
            setEditingStation(null);
            reset();
          },
        }
      );
    } else {
      createStation.mutate(values, {
        onSuccess: () => {
          setIsOpen(false);
          reset();
        },
      });
    }
  };

  const handleEdit = useCallback((station: Station) => {
    setEditingStation(station);
    reset({
      name: station.name,
      city: station.city,
      address: station.address,
    });
    setIsOpen(true);
  }, [reset]);

  const [forceDeleteId, setForceDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deletingStation) {
      deleteStation.mutate(
        { id: deletingStation.id },
        {
          onSuccess: () => {
            setDeletingStation(null);
          },
          onError: (error: Error) => {
            const axiosError = error as AxiosError;
            if (axiosError.response?.status === 409) {
              setForceDeleteId(deletingStation.id);
              setDeletingStation(null);
            }
          },
        }
      );
    }
  };

  const handleForceDelete = () => {
    if (forceDeleteId) {
      deleteStation.mutate(
        { id: forceDeleteId, force: true },
        {
          onSuccess: () => {
            setForceDeleteId(null);
            // Invalidate queries to ensure UI update
            queryClient.invalidateQueries({ queryKey: ["stations"] });
          },
        }
      );
    }
  };

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<{
    key: string | null;
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });

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
          <div className="flex items-center gap-2 flex-wrap">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{station.name}</span>
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
      {
        key: "actions",
        header: "",
        cell: (station) => (
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
                <DropdownMenuItem onClick={() => handleEdit(station)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Sửa
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeletingStation(station)}
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
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Bến xe</h1>
        <Sheet open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingStation(null);
            reset({
              name: "",
              city: "",
              address: "",
            });
          }
        }}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Thêm Bến xe
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{editingStation ? "Cập nhật Bến xe" : "Thêm Bến xe mới"}</SheetTitle>
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
                  disabled={createStation.isPending || updateStation.isPending}
                >
                  {createStation.isPending || updateStation.isPending ? "Đang xử lý..." : (editingStation ? "Cập nhật" : "Tạo Bến xe")}
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

      <AlertDialog open={!!deletingStation} onOpenChange={(open) => !open && setDeletingStation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bến xe này sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {deleteStation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!forceDeleteId} onOpenChange={(open) => !open && setForceDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cảnh báo: Dữ liệu liên quan</AlertDialogTitle>
            <AlertDialogDescription>
              Bến xe này đang được sử dụng trong các tuyến đường hoặc chuyến đi. 
              Bạn có muốn xóa BẮT BUỘC không? Hành động này sẽ xóa tất cả các dữ liệu liên quan (tuyến đường, chuyến đi, vé).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleForceDelete}
            >
              {deleteStation.isPending ? "Đang xóa..." : "Xóa bắt buộc"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
