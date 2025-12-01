import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Calendar, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  useTrips,
  useCreateTrip,
  useRoutes,
  useBuses,
} from "../hooks";
import { SeatType } from "../types";
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tuyến đường</TableHead>
                <TableHead>Xe</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTrips ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : trips?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Chưa có chuyến đi nào
                  </TableCell>
                </TableRow>
              ) : (
                trips?.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{trip.route.originStation.name}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span>{trip.route.destinationStation.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{trip.bus.plateNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {trip.bus.operator.name}
                      </div>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{trip.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
