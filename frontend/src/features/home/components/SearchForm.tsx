import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { useStations } from "@/features/catalog/hooks";
import { useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const searchSchema = z.object({
  origin: z.string().min(1, "Vui lòng chọn điểm đi"),
  destination: z.string().min(1, "Vui lòng chọn điểm đến"),
  date: z.string().min(1, "Vui lòng chọn ngày đi"),
});

export const SearchForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: stations } = useStations();

  const cityOptions = useMemo(() => {
    if (!stations) return [];
    const cities = Array.from(new Set(stations.map((s) => s.city)));
    return cities.map((city) => ({ value: city, label: city }));
  }, [stations]);

  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      origin: searchParams.get("origin") ?? "",
      destination: searchParams.get("destination") ?? "",
      date: searchParams.get("date") ?? "",
    },
  });

  const origin = useWatch({ control, name: "origin" });
  const destination = useWatch({ control, name: "destination" });
  const date = useWatch({ control, name: "date" });

  const onSubmit = (values: z.infer<typeof searchSchema>) => {
    const searchParams = new URLSearchParams({
      origin: values.origin,
      destination: values.destination,
      date: values.date,
    });
    navigate(`/search?${searchParams.toString()}`);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto supports-[backdrop-filter]:bg-white/80">
      <CardContent className="p-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Điểm đi
            </Label>
            <div className="relative">
              <Combobox
                options={cityOptions}
                value={origin}
                onSelect={(value) =>
                  setValue("origin", value, { shouldValidate: true })
                }
                placeholder="Chọn điểm đi"
                emptyText="Không tìm thấy tỉnh/thành"
                className="w-full pr-2"
              />
              {errors.origin && (
                <p className="absolute -bottom-5 left-1 text-xs text-destructive">
                  {errors.origin.message}
                </p>
              )}
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
                onSelect={(value) =>
                  setValue("destination", value, { shouldValidate: true })
                }
                placeholder="Chọn điểm đến"
                emptyText="Không tìm thấy tỉnh/thành"
                className="w-full pr-2"
              />
              {errors.destination && (
                <p className="absolute -bottom-5 left-1 text-xs text-destructive">
                  {errors.destination.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" /> Ngày đi
            </Label>
            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-empty={!date}
                    className="data-[empty=true]:text-muted-foreground w-full justify-between text-left font-normal pr-3"
                  >
                    {date ? (
                      format(new Date(date), "PPP")
                    ) : (
                      <span>Chọn ngày đi</span>
                    )}
                    <CalendarIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    className="rounded-md border-none w-full"
                    mode="single"
                    selected={date ? new Date(date) : undefined}
                    onSelect={(selectedDate: Date | undefined) => {
                      if (!selectedDate) return;
                      setValue("date", format(selectedDate, "yyyy-MM-dd"), {
                        shouldValidate: true,
                      });
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="absolute -bottom-5 left-0 text-xs text-destructive">
                  {errors.date.message}
                </p>
              )}
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
