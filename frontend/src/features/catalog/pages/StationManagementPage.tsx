import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, MapPin } from "lucide-react";
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
import { useStations, useCreateStation } from "../hooks";

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên bến xe</TableHead>
                <TableHead>Thành phố</TableHead>
                <TableHead>Địa chỉ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : stations?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Chưa có bến xe nào
                  </TableCell>
                </TableRow>
              ) : (
                stations?.map((station) => (
                  <TableRow key={station.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {station.name}
                      </div>
                    </TableCell>
                    <TableCell>{station.city}</TableCell>
                    <TableCell>{station.address}</TableCell>
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
