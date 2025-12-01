import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Map as MapIcon, ArrowRight } from "lucide-react";
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
import { useRoutes, useCreateRoute, useStations } from "../hooks";

const formSchema = z.object({
  originStationId: z.string().min(1, "Vui lòng chọn điểm đi"),
  destinationStationId: z.string().min(1, "Vui lòng chọn điểm đến"),
  durationMinutes: z.number().min(1, "Thời gian di chuyển phải lớn hơn 0"),
  distanceKm: z.number().min(1, "Khoảng cách phải lớn hơn 0"),
});

export const RouteManagementPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: routes, isLoading: isLoadingRoutes } = useRoutes();
  const { data: stations } = useStations();
  const createRoute = useCreateRoute();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originStationId: "",
      destinationStationId: "",
      durationMinutes: 0,
      distanceKm: 0,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createRoute.mutate(values, {
      onSuccess: () => {
        setIsOpen(false);
        reset();
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Tuyến đường</h1>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Thêm Tuyến đường
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Thêm Tuyến đường mới</SheetTitle>
              <SheetDescription>
                Nhập thông tin chi tiết về tuyến đường mới.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  label="Điểm đi"
                  error={errors.originStationId?.message}
                >
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("originStationId")}
                  >
                    <option value="">Chọn điểm đi...</option>
                    {stations?.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name} ({station.city})
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField
                  label="Điểm đến"
                  error={errors.destinationStationId?.message}
                >
                  <select
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("destinationStationId")}
                  >
                    <option value="">Chọn điểm đến...</option>
                    {stations?.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name} ({station.city})
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField
                  label="Thời gian di chuyển (phút)"
                  error={errors.durationMinutes?.message}
                >
                  <Input
                    type="number"
                    {...register("durationMinutes", { valueAsNumber: true })}
                  />
                </FormField>
                <FormField
                  label="Khoảng cách (km)"
                  error={errors.distanceKm?.message}
                >
                  <Input
                    type="number"
                    step="0.1"
                    {...register("distanceKm", { valueAsNumber: true })}
                  />
                </FormField>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createRoute.isPending}
                >
                  {createRoute.isPending ? "Đang tạo..." : "Tạo Tuyến đường"}
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Tuyến đường</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tuyến đường</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Khoảng cách</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingRoutes ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : routes?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Chưa có tuyến đường nào
                  </TableCell>
                </TableRow>
              ) : (
                routes?.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{route.originStation.name}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span>{route.destinationStation.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-6">
                        {route.originStation.city} - {route.destinationStation.city}
                      </div>
                    </TableCell>
                    <TableCell>{route.durationMinutes} phút</TableCell>
                    <TableCell>{route.distanceKm} km</TableCell>
                    <TableCell>
                      <Badge variant={route.isActive ? "success" : "default"}>
                        {route.isActive ? "Hoạt động" : "Ngừng hoạt động"}
                      </Badge>
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
