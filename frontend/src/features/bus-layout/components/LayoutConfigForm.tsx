import { useEffect } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { layoutConfigSchema, type LayoutConfigFormValues } from "../schema";
import { useBusLayoutStore } from "../store/useBusLayoutStore";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";

const BUS_TYPES = [
  { label: "Thường", value: "NORMAL" },
  { label: "Giường nằm", value: "SLEEPER" },
  { label: "Limousine", value: "LIMOUSINE" },
];

type LayoutConfigFormProps = {
  onComplete?: () => void;
  className?: string;
};

export const LayoutConfigForm = ({
  onComplete,
  className,
}: LayoutConfigFormProps) => {
  const config = useBusLayoutStore((state) => state.config);
  const gridDimensions = useBusLayoutStore((state) => state.gridDimensions);
  const setConfig = useBusLayoutStore((state) => state.setConfig);
  const setStep = useBusLayoutStore((state) => state.setStep);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<LayoutConfigFormValues>({
    resolver: zodResolver(
      layoutConfigSchema,
    ) as Resolver<LayoutConfigFormValues>,
    defaultValues: {
      ...config,
      totalRows: gridDimensions.cols,
      totalCols: gridDimensions.rows,
    },
    mode: "onChange",
  });

  const busType = useWatch({ control, name: "busType" });

  useEffect(() => {
    const formValues = {
      ...config,
      totalRows: gridDimensions.cols,
      totalCols: gridDimensions.rows,
    };
    reset(formValues);
    // Force set busType separately to ensure UI update
    if (config.busType) {
      setValue("busType", config.busType, { shouldValidate: true });
    }
  }, [config, gridDimensions, reset, setValue]);

  // Ensure Select re-renders when busType changes
  useEffect(() => {
    if (config.busType) {
      setValue("busType", config.busType, { shouldValidate: true });
    }
  }, [config.busType, setValue]);

  const onSubmit = (values: LayoutConfigFormValues) => {
    setConfig(values);
    setStep(2);
    onComplete?.();
  };

  return (
    <Card className={className}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <CardHeader>
            <CardTitle>Bước 1: Cấu hình xe</CardTitle>
            <CardDescription>
              Đặt tên, loại xe và kích thước ma trận ghế trước khi vẽ sơ đồ.
            </CardDescription>
          </CardHeader>
        </FieldGroup>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field data-invalid={!!errors.name}>
              <FieldLabel>Tên sơ đồ</FieldLabel>
              <Input
                className="max-w-md"
                placeholder="Giường nằm 40 chỗ"
                {...register("name")}
              />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>
            <Field data-invalid={!!errors.busType}>
              <FieldLabel>Loại xe</FieldLabel>
              <Select
                value={busType}
                onValueChange={(val) =>
                  setValue("busType", val, { shouldValidate: true })
                }
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Chọn loại xe..." />
                </SelectTrigger>
                <SelectContent>
                  {BUS_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{errors.busType?.message}</FieldError>
            </Field>

            <Field data-invalid={!!errors.totalFloors}>
              <FieldLabel>Số tầng</FieldLabel>
              <FieldDescription>Hầu hết xe chỉ có 1-2 tầng</FieldDescription>
              <Input
                className="max-w-md"
                type="number"
                min={1}
                max={2}
                {...register("totalFloors", { valueAsNumber: true })}
              />
              <FieldError>{errors.totalFloors?.message}</FieldError>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field data-invalid={!!errors.totalRows}>
              <FieldLabel>Số hàng</FieldLabel>
              <FieldDescription>Số hàng ghế dọc thân xe</FieldDescription>
              <Input
                className="max-w-md"
                type="number"
                min={1}
                {...register("totalRows", { valueAsNumber: true })}
              />
              <FieldError>{errors.totalRows?.message}</FieldError>
            </Field>
            <Field data-invalid={!!errors.totalCols}>
              <FieldLabel>Số cột</FieldLabel>
              <FieldDescription>Số ghế trên mỗi hàng</FieldDescription>
              <Input
                className="max-w-md"
                type="number"
                min={1}
                {...register("totalCols", { valueAsNumber: true })}
              />
              <FieldError>{errors.totalCols?.message}</FieldError>
            </Field>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-end">
          <Button type="submit">Tiếp tục tới vẽ sơ đồ</Button>
        </CardFooter>
      </form>
    </Card>
  );
};
