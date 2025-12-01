import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Calendar, Clock, ArrowRight } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { GenericTable, type ColumnDef } from "@/components/common";
import { useTrips, useCreateTrip, useRoutes, useBuses } from "../hooks";
import { SeatType, type Trip } from "../types";
import { format } from "date-fns";

const formSchema = z.object({
  routeId: z.string().min(1, "Vui lòng chọn tuyến đường"),
  busId: z.string().min(1, "Vui lòng chọn xe"),
  departureTime: z.string().min(1, "Thời gian đi là bắt buộc"),
  arrivalTime: z.string().min(1, "Thời gian đến là bắt buộc"),
  pricings: z.array(
    z.object({
      seatType: z.enum([SeatType.NORMAL, SeatType.VIP, SeatType.SLEEPER]),
      price: z.number().min(0, "Giá vé phải lớn hơn hoặc bằng 0"),
    })
  ),
});

export const TripManagementPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: trips, isLoading: isLoadingTrips } = useTrips();
  const { data: routes } = useRoutes();
  const { data: buses } = useBuses();
  const createTrip = useCreateTrip();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      routeId: "",
      busId: "",
      departureTime: "",
      arrivalTime: "",
      pricings: [
        { seatType: SeatType.NORMAL, price: 0 },
        { seatType: SeatType.VIP, price: 0 },
        { seatType: SeatType.SLEEPER, price: 0 },
      ],
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "pricings",
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Convert local datetime-local string to ISO string for backend
    const departureDate = new Date(values.departureTime);
    const arrivalDate = new Date(values.arrivalTime);

    createTrip.mutate(
      {
        ...values,
        departureTime: departureDate.toISOString(),
        arrivalTime: arrivalDate.toISOString(),
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          reset();
        },
      },
    );
  };

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<{
    key: string | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });

  const sortedPaged = useMemo(() => {
    if (!trips) return { data: [], total: 0, totalPages: 1, page: 1 };
    const arr = [...trips];

    if (sorting.key) {
      const key = sorting.key as keyof Trip;
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
  }, [trips, pageIndex, pageSize, sorting]);

  const meta = {
    total: sortedPaged.total,
    page: sortedPaged.page,
    pageSize,
    totalPages: sortedPaged.totalPages,
  };

  const columns: ColumnDef<Trip>[] = useMemo(
    () => [
      {
        key: "route",
        header: "Tuyến đường",
        cell: (trip) => (
          <div className="flex items-center gap-2">
            <span>{trip.route.originStation.name}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span>{trip.route.destinationStation.name}</span>
          </div>
        ),
      },
      {
        key: "bus",
        header: "Xe",
        cell: (trip) => (
          <>
            <div>{trip.bus.plateNumber}</div>
            <div className="text-xs text-muted-foreground">
              {trip.bus.operator.name}
            </div>
          </>
        ),
      },
      {
        key: "departureTime",
        header: "Thời gian",
        sortable: true,
        cell: (trip) => (
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              {format(new Date(trip.departureTime), "dd/MM/yyyy")}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {format(new Date(trip.departureTime), "HH:mm")} -{" "}
              {format(new Date(trip.arrivalTime), "HH:mm")}
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: "Trạng thái",
        sortable: true,
        cell: (trip) => <Badge variant="default">{trip.status}</Badge>,
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Chuyến đi</h1>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Thêm Chuyến đi
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto max-h-screen">
            <SheetHeader>
              <SheetTitle>Thêm Chuyến đi mới</SheetTitle>
              <SheetDescription>
                Nhập thông tin chi tiết về chuyến đi mới.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormField label="Tuyến đường" error={errors.routeId?.message}>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("routeId")}
                  >
                    <option value="">Chọn tuyến đường...</option>
                    {routes?.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.originStation.name} - {route.destinationStation.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Xe" error={errors.busId?.message}>
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("busId")}
                  >
                    <option value="">Chọn xe...</option>
                    {buses?.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.plateNumber} ({bus.operator.name})
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField
                  label="Thời gian đi"
                  error={errors.departureTime?.message}
                >
                  <Input type="datetime-local" {...register("departureTime")} />
                </FormField>
                <FormField
                  label="Thời gian đến"
                  error={errors.arrivalTime?.message}
                >
                  <Input type="datetime-local" {...register("arrivalTime")} />
                </FormField>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Giá vé</h3>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-end">
                      <FormField
                        label={`Loại ghế: ${field.seatType}`}
                        error={errors.pricings?.[index]?.price?.message}
                        className="flex-1"
                      >
                        <Input
                          type="number"
                          {...register(`pricings.${index}.price`, {
                            valueAsNumber: true,
                          })}
                        />
                      </FormField>
                      <input
                        type="hidden"
                        {...register(`pricings.${index}.seatType`)}
                      />
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createTrip.isPending}
                >
                  {createTrip.isPending ? "Đang tạo..." : "Tạo Chuyến đi"}
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Chuyến đi</CardTitle>
        </CardHeader>
        <CardContent>
          <GenericTable<Trip>
            data={sortedPaged.data}
            columns={columns}
            isLoading={isLoadingTrips}
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
            getRowId={(trip) => trip.id}
          />
        </CardContent>
      </Card>
    </div>
  );
};
