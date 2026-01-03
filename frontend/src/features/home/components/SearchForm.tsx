import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Search } from 'lucide-react';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Combobox } from '@/components/ui/combobox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSearchStations } from '@/features/catalog/hooks';

const searchSchema = z.object({
  origin: z.string().min(1, 'Vui lòng chọn điểm đi'),
  destination: z.string().min(1, 'Vui lòng chọn điểm đến'),
  date: z.string().min(1, 'Vui lòng chọn ngày đi'),
});

export const SearchForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State for search queries
  const [originSearch, setOriginSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');

  // Use search API instead of loading all stations
  const { data: originStations, isLoading: isLoadingOrigin } = useSearchStations(originSearch);
  const { data: destinationStations, isLoading: isLoadingDestination } =
    useSearchStations(destinationSearch);

  // Convert stations to city options
  const originCityOptions = useMemo(() => {
    if (!originStations) return [];
    const cities = Array.from(new Set(originStations.map((s) => s.city)));
    return cities.map((city) => ({ value: city, label: city }));
  }, [originStations]);

  const destinationCityOptions = useMemo(() => {
    if (!destinationStations) return [];
    const cities = Array.from(new Set(destinationStations.map((s) => s.city)));
    return cities.map((city) => ({ value: city, label: city }));
  }, [destinationStations]);

  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      origin: searchParams.get('origin') ?? '',
      destination: searchParams.get('destination') ?? '',
      date: searchParams.get('date') ?? '',
    },
  });

  const origin = useWatch({ control, name: 'origin' });
  const destination = useWatch({ control, name: 'destination' });
  const date = useWatch({ control, name: 'date' });

  const onSubmit = (values: z.infer<typeof searchSchema>) => {
    const searchParams = new URLSearchParams({
      origin: values.origin,
      destination: values.destination,
      date: values.date,
    });
    navigate(`/search?${searchParams.toString()}`);
  };

  const labelStyles =
    'block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-2 ml-2';

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* --- Origin Field --- */}
        <div className="md:col-span-3">
          <label className={labelStyles}>Điểm đi</label>
          <div className="relative">
            <Combobox
              options={originCityOptions}
              value={origin}
              onSelect={(value) => setValue('origin', value, { shouldValidate: true })}
              onSearchChange={setOriginSearch}
              placeholder="Chọn điểm đi"
              emptyText={isLoadingOrigin ? 'Đang tìm...' : 'Không tìm thấy'}
              isLoading={isLoadingOrigin}
              icon={<MapPin size={18} />}
            />
            {errors.origin && (
              <p className="absolute -bottom-5 left-1 text-xs text-red-500 font-medium">
                {errors.origin.message}
              </p>
            )}
          </div>
        </div>

        {/* --- Destination Field --- */}
        <div className="md:col-span-3">
          <label className={labelStyles}>Điểm đến</label>
          <div className="relative">
            <Combobox
              options={destinationCityOptions}
              value={destination}
              onSelect={(value) => setValue('destination', value, { shouldValidate: true })}
              onSearchChange={setDestinationSearch}
              placeholder="Chọn điểm đến"
              emptyText={isLoadingDestination ? 'Đang tìm...' : 'Không tìm thấy'}
              isLoading={isLoadingDestination}
              icon={<MapPin size={18} />}
            />
            {errors.destination && (
              <p className="absolute -bottom-5 left-1 text-xs text-red-500 font-medium">
                {errors.destination.message}
              </p>
            )}
          </div>
        </div>

        {/* --- Date Field --- */}
        <div className="md:col-span-3">
          <label className={labelStyles}>Ngày đi</label>
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  data-empty={!date}
                  className="w-full justify-between h-auto py-3 px-4 text-base font-normal bg-white dark:bg-emerald-900/50 border-2 border-emerald-100 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-50 hover:bg-white hover:border-emerald-400 hover:translate-y-0 hover:shadow-sm focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 data-[empty=true]:text-emerald-300 dark:data-[empty=true]:text-emerald-600"
                >
                  <span className="flex items-center gap-2">
                    <CalendarIcon size={18} className="shrink-0 text-emerald-500" />
                    <span className="truncate">
                      {date ? format(new Date(date), 'dd/MM/yyyy') : 'Chọn ngày'}
                    </span>
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl border-emerald-100 dark:border-emerald-800 shadow-xl shadow-emerald-900/5 dark:shadow-black/20">
                <Calendar
                  className="rounded-2xl border-none w-full"
                  mode="single"
                  selected={date ? new Date(date) : undefined}
                  onSelect={(selectedDate: Date | undefined) => {
                    if (!selectedDate) return;
                    setValue('date', format(selectedDate, 'yyyy-MM-dd'), {
                      shouldValidate: true,
                    });
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="absolute -bottom-5 left-1 text-xs text-red-500 font-medium">
                {errors.date.message}
              </p>
            )}
          </div>
        </div>

        {/* --- Submit Button --- */}
        <div className="md:col-span-3 flex items-end">
          <Button size="lg" type="submit" className="w-full">
            <Search size={20} strokeWidth={3} /> Tìm chuyến
          </Button>
        </div>
      </form>
    </div>
  );
};
