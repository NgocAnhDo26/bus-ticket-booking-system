import { useNavigate, useSearchParams } from 'react-router-dom';

import { Skeleton } from '@/components/ui/skeleton';
import { useSearchTrips } from '@/features/catalog/hooks';
import type { Trip } from '@/features/catalog/types';
import { SearchForm } from '@/features/home/components/SearchForm';

import { FilterSidebar } from '../components/FilterSidebar';
import { TripCard } from '../components/TripCard';

export const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const origin = searchParams.get('origin') || undefined;
  const destination = searchParams.get('destination') || undefined;
  const date = searchParams.get('date') || undefined;
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const minTime = searchParams.get('minTime') || undefined;
  const maxTime = searchParams.get('maxTime') || undefined;
  const operatorIds = searchParams.getAll('operatorIds');

  const { data: trips, isLoading } = useSearchTrips({
    origin,
    destination,
    date,
    minPrice,
    maxPrice,
    minTime,
    maxTime,
    operatorIds: operatorIds.length > 0 ? operatorIds : undefined,
  });

  const handleSelectTrip = (trip: Trip) => {
    // Allow guests to proceed to booking page
    navigate(`/booking/${trip.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Search Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-30 py-4">
        <div className="container mx-auto px-4">
          <SearchForm />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <FilterSidebar />

          {/* Results List */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Kết quả tìm kiếm: {origin} - {destination}
              </h2>
              <span className="text-muted-foreground">
                {trips?.length || 0} chuyến xe được tìm thấy
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-lg" />
                ))}
              </div>
            ) : trips?.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border">
                <h3 className="text-lg font-medium text-gray-900">Không tìm thấy chuyến xe nào</h3>
                <p className="text-gray-500">
                  Vui lòng thử lại với ngày khác hoặc tuyến đường khác.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {trips?.map((trip) => (
                  <TripCard key={trip.id} trip={trip} onSelect={handleSelectTrip} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
