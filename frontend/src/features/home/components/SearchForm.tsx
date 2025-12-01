import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { useStations } from "@/features/catalog/hooks";
import { useMemo } from "react";

const searchSchema = z.object({
  origin: z.string().min(1, "Vui lòng chọn điểm đi"),
  destination: z.string().min(1, "Vui lòng chọn điểm đến"),
  date: z.string().min(1, "Vui lòng chọn ngày đi"),
});

export const SearchForm = () => {
  const navigate = useNavigate();
  const { data: stations } = useStations();

  const cityOptions = useMemo(() => {
    if (!stations) return [];
    const cities = Array.from(new Set(stations.map((s) => s.city)));
    return cities.map((city) => ({ value: city, label: city }));
  }, [stations]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      origin: "",
      destination: "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const origin = watch("origin");
  const destination = watch("destination");

  const onSubmit = (values: z.infer<typeof searchSchema>) => {
    const searchParams = new URLSearchParams({
      origin: values.origin,
      destination: values.destination,
      date: values.date,
    });
    navigate(`/search?${searchParams.toString()}`);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Điểm đi
            </Label>
            <div className="relative">
                <Combobox
                    options={cityOptions}
                    value={origin}
                    onSelect={(value) => setValue("origin", value, { shouldValidate: true })}
                    placeholder="Chọn điểm đi"
                    emptyText="Không tìm thấy tỉnh/thành"
                    className="w-full"
                />
                {errors.origin && <p className="absolute -bottom-5 left-0 text-xs text-destructive">{errors.origin.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Điểm đến
            </Label>
            <div className="relative">
                <Combobox
                    options={cityOptions}
                    value={destination}
                    onSelect={(value) => setValue("destination", value, { shouldValidate: true })}
                    placeholder="Chọn điểm đến"
                    emptyText="Không tìm thấy tỉnh/thành"
                    className="w-full"
                />
                {errors.destination && <p className="absolute -bottom-5 left-0 text-xs text-destructive">{errors.destination.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" /> Ngày đi
            </Label>
            <div className="relative">
                <Input
                    id="date"
                    type="date"
                    {...register("date")}
                    min={format(new Date(), "yyyy-MM-dd")}
                />
                {errors.date && <p className="absolute -bottom-5 left-0 text-xs text-destructive">{errors.date.message}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg">
            <Search className="w-4 h-4 mr-2" /> Tìm chuyến
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
