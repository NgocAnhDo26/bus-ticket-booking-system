import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2 } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { useAddRouteStop, useDeleteRouteStop, useStations } from "../hooks";
import type { Route } from "../types";

const formSchema = z.object({
  stationId: z.string().min(1, "Vui lòng chọn trạm"),
  stopOrder: z.number().min(0, "Thứ tự phải không âm"),
  durationMinutesFromOrigin: z.number().min(0, "Thời gian phải không âm"),
  stopType: z.enum(["PICKUP", "DROPOFF", "BOTH"]),
});

type RouteStopsManagerProps = {
  route: Route;
};

export const RouteStopsManager = ({ route }: RouteStopsManagerProps) => {
  const { data: stations } = useStations();
  const addStop = useAddRouteStop();
  const deleteStop = useDeleteRouteStop();

  const {
      register,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stationId: "",
      stopOrder: (route.stops?.length || 0) + 1,
      durationMinutesFromOrigin: 0,
      stopType: "BOTH",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addStop.mutate(
      { routeId: route.id, data: values },
      {
        onSuccess: () => {
          reset({
            stationId: "",
            stopOrder: (route.stops?.length || 0) + 2, // Increment for next stop
            durationMinutesFromOrigin: 0,
            stopType: "BOTH",
          });
        },
      }
    );
  };

  const handleDelete = (stopId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa điểm dừng này?")) {
        deleteStop.mutate({ routeId: route.id, stopId });
    }
  };

  // Sort stops by order
  const sortedStops = [...(route.stops || [])].sort((a, b) => a.stopOrder - b.stopOrder);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Danh sách điểm dừng</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[80px]">Thứ tự</TableHead>
                    <TableHead>Trạm</TableHead>
                    <TableHead>Thời gian từ Đ.Đi</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {sortedStops.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        Chưa có điểm dừng trung gian nào.
                    </TableCell>
                    </TableRow>
                ) : (
                    sortedStops.map((stop) => (
                    <TableRow key={stop.id}>
                        <TableCell>{stop.stopOrder}</TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-medium">{stop.station.name}</span>
                                <span className="text-xs text-muted-foreground">{stop.station.city}</span>
                            </div>
                        </TableCell>
                        <TableCell>{stop.durationMinutesFromOrigin} phút</TableCell>
                        <TableCell>
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                {stop.stopType === "PICKUP" ? "Đón khách" : stop.stopType === "DROPOFF" ? "Trả khách" : "Đón/Trả"}
                            </span>
                        </TableCell>
                        <TableCell className="text-right">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(stop.id)}
                            disabled={deleteStop.isPending}
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
          <CardTitle className="text-lg">Thêm điểm dừng mới</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Trạm dừng" error={errors.stationId?.message}>
                    <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register("stationId")}
                    >
                        <option value="">Chọn trạm...</option>
                        {stations?.map((station) => (
                            <option key={station.id} value={station.id}>
                                {station.name} ({station.city})
                            </option>
                        ))}
                    </select>
                </FormField>
                
                <FormField label="Loại điểm dừng" error={errors.stopType?.message}>
                    <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...register("stopType")}
                    >
                        <option value="PICKUP">Đón khách</option>
                        <option value="DROPOFF">Trả khách</option>
                        <option value="BOTH">Đón và Trả</option>
                    </select>
                </FormField>

                <FormField label="Thứ tự" error={errors.stopOrder?.message}>
                    <Input type="number" {...register("stopOrder", { valueAsNumber: true })} />
                </FormField>

                <FormField label="Thời gian từ điểm đi (phút)" error={errors.durationMinutesFromOrigin?.message}>
                    <Input type="number" {...register("durationMinutesFromOrigin", { valueAsNumber: true })} />
                </FormField>
              </div>

              <Button type="submit" disabled={addStop.isPending}>
                <Plus className="mr-2 h-4 w-4" />
                {addStop.isPending ? "Đang thêm..." : "Thêm điểm dừng"}
              </Button>
            </form>
        </CardContent>
      </Card>
    </div>
  );
};
