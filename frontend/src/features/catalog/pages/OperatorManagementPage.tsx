import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Phone, Building2, Mail, Globe } from "lucide-react";
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
import { useOperators, useCreateOperator } from "../hooks";

const formSchema = z.object({
  name: z.string().min(1, "Tên nhà xe là bắt buộc"),
  phone: z.string().min(1, "Số điện thoại là bắt buộc"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  website: z.string().url("Website không hợp lệ").optional().or(z.literal("")),
});

export const OperatorManagementPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: operators, isLoading } = useOperators();
  const createOperator = useCreateOperator();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      website: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createOperator.mutate(
      {
        name: values.name,
        contactInfo: {
          phone: values.phone,
          email: values.email || undefined,
          website: values.website || undefined,
        },
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
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Nhà xe</h1>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Thêm Nhà xe
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Thêm Nhà xe mới</SheetTitle>
              <SheetDescription>
                Nhập thông tin chi tiết về nhà xe mới.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormField label="Tên nhà xe" error={errors.name?.message}>
                  <Input placeholder="Phương Trang" {...register("name")} />
                </FormField>
                <FormField label="Số điện thoại" error={errors.phone?.message}>
                  <Input placeholder="0909..." {...register("phone")} />
                </FormField>
                <FormField label="Email" error={errors.email?.message}>
                  <Input
                    placeholder="contact@example.com"
                    {...register("email")}
                  />
                </FormField>
                <FormField label="Website" error={errors.website?.message}>
                  <Input
                    placeholder="https://example.com"
                    {...register("website")}
                  />
                </FormField>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createOperator.isPending}
                >
                  {createOperator.isPending ? "Đang tạo..." : "Tạo Nhà xe"}
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Nhà xe</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên nhà xe</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : operators?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Chưa có nhà xe nào
                  </TableCell>
                </TableRow>
              ) : (
                operators?.map((operator) => (
                  <TableRow key={operator.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {operator.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {operator.contactInfo?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {operator.contactInfo.phone}
                          </div>
                        )}
                        {operator.contactInfo?.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {operator.contactInfo.email}
                          </div>
                        )}
                        {operator.contactInfo?.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <a
                              href={operator.contactInfo.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              Website
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={operator.isActive ? "success" : "default"}
                      >
                        {operator.isActive ? "Hoạt động" : "Ngừng hoạt động"}
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
