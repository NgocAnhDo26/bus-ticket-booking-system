import { Link } from 'react-router-dom';

import { differenceInMinutes, format } from 'date-fns';
import { Bus, ChevronRight, Coffee, ImageIcon, StarIcon, Wifi, Wind } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Trip } from '@/features/catalog/types';
import { useOperatorStats } from '@/features/reviews/hooks';
import { getImageUrl } from '@/lib/image-upload';

interface TripCardProps {
  trip: Trip;
  onSelect: (trip: Trip) => void;
}

export const TripCard = ({ trip, onSelect }: TripCardProps) => {
  // --- Logic Extraction ---
  const departure = new Date(trip.departureTime);
  const arrival = new Date(trip.arrivalTime);
  const duration = differenceInMinutes(arrival, departure);
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  const prices = trip.tripPricings.map((p) => p.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

  const firstPhoto = trip.bus.photos?.[0];
  const imageUrl = firstPhoto ? getImageUrl(firstPhoto) : null;

  // Fetch operator stats for rating
  const { data: operatorStats } = useOperatorStats(trip.bus.operator.id);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  return (
    <div className="group relative w-full bg-white dark:bg-emerald-900 rounded-3xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 overflow-hidden hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
      {/* --- Visuals: Ticket Cutouts (Notches) --- 
          These sit on top (z-20) to create the "punched hole" effect over the image and background 
      */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 bg-orange-50 dark:bg-emerald-950 rounded-full border-r-2 border-emerald-200 dark:border-emerald-800 group-hover:border-emerald-400 dark:group-hover:border-emerald-500 transition-colors z-20"></div>
      <div className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-orange-50 dark:bg-emerald-950 rounded-full border-l-2 border-emerald-200 dark:border-emerald-800 group-hover:border-emerald-400 dark:group-hover:border-emerald-500 transition-colors z-20"></div>

      <div className="flex h-full min-h-[180px]">
        {/* --- SECTION 1: IMAGE (Mandatory, Responsive) --- 
            Hidden on mobile (xs), Visible on sm+. 
            Occupies fixed width.
        */}
        <div className="hidden md:flex w-32 md:w-48 bg-emerald-100 dark:bg-emerald-950 relative shrink-0 border-r border-dashed border-emerald-100 dark:border-emerald-800">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${trip.bus.operator.name} bus`}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-emerald-300">
              <ImageIcon className="w-10 h-10" />
            </div>
          )}
          {/* Overlay to ensure text readability if we ever put text here, or just for style */}
          <div className="absolute inset-0 bg-linear-to-t from-emerald-900/20 to-transparent pointer-events-none" />
        </div>

        {/* --- SECTION 2: INFO (Middle) --- */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          {/* Header: Operator & Rating */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Bus className="w-3 h-3" />
                  {trip.bus.operator.name}
                </span>
                <span className="text-[10px] text-muted-foreground border border-emerald-200 dark:border-emerald-700 px-1.5 py-0.5 rounded-full">
                  {trip.bus.totalSeats} chỗ
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md border border-yellow-100 dark:border-yellow-900/50">
              <StarIcon className="w-3 h-3 fill-current" />
              {operatorStats && operatorStats.totalReviews > 0 ? (
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs">
                    {operatorStats.averageRating?.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-muted-foreground opacity-70">
                    ({operatorStats.totalReviews})
                  </span>
                </div>
              ) : (
                <span className="text-[10px]">Chưa có đánh giá</span>
              )}
            </div>
          </div>

          {/* Route Diagram */}
          <div className="flex items-center gap-3 md:gap-4 pl-1">
            {/* The Dot/Line Visual */}
            <div className="flex flex-col items-center h-full gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400"></div>
              <div className="h-10 w-0.5 bg-emerald-200 dark:bg-emerald-700 border-l border-dashed border-emerald-300"></div>
              <div className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-white dark:bg-emerald-800"></div>
            </div>

            {/* Time & Station Data */}
            <div className="flex flex-col gap-3 w-full">
              {/* Origin */}
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-col">
                  <span className="font-black text-lg text-emerald-950 dark:text-emerald-50 leading-none">
                    {format(departure, 'HH:mm')}
                  </span>
                  <span
                    className="text-xs font-medium text-muted-foreground truncate max-w-[120px] md:max-w-[200px]"
                    title={trip.route.originStation.name}
                  >
                    {trip.route.originStation.name}
                  </span>
                </div>
              </div>

              {/* Destination */}
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-lg text-emerald-800/80 dark:text-emerald-200/80 leading-none">
                      {format(arrival, 'HH:mm')}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/50 px-1 rounded h-fit">
                      {hours}h{minutes}m
                    </span>
                  </div>

                  <span
                    className="text-xs font-medium text-muted-foreground truncate max-w-[120px] md:max-w-[200px]"
                    title={trip.route.destinationStation.name}
                  >
                    {trip.route.destinationStation.name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Amenities (Bottom Left) */}
          <div className="mt-4 pt-3 border-t border-dashed border-emerald-100 dark:border-emerald-800/50 flex gap-3 overflow-hidden">
            {trip.bus.amenities.includes('WiFi') && (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" aria-label="WiFi" />
            )}
            {trip.bus.amenities.includes('Máy lạnh') && (
              <Wind className="w-3.5 h-3.5 text-emerald-400" aria-label="A/C" />
            )}
            {trip.bus.amenities.includes('Nước uống') && (
              <Coffee className="w-3.5 h-3.5 text-emerald-400" aria-label="Water" />
            )}
            <span className="text-[10px] text-emerald-400/70 font-medium self-center ml-auto hidden md:block">
              Khởi hành {format(departure, 'dd/MM/yyyy')}
            </span>
          </div>
        </div>

        {/* --- SECTION 3: PRICE & ACTION (Right Stub) --- */}
        <div className="bg-emerald-50 dark:bg-emerald-800/40 w-[140px] md:w-[180px] flex flex-col justify-center items-center border-l-2 border-dashed border-emerald-200 dark:border-emerald-800 p-3 md:p-4 gap-3">
          <div className="text-center">
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide">
              Giá vé
            </div>
            <div className="text-xl md:text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {formatCurrency(minPrice)}
            </div>
          </div>

          <div className="flex flex-col w-full gap-2">
            <Button size="sm" onClick={() => onSelect(trip)}>
              Chọn vé
            </Button>

            <Button variant="ghost" size="sm" asChild>
              <Link to={`/trips/${trip.id}`} className="flex items-center justify-center gap-1">
                Chi tiết <ChevronRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
