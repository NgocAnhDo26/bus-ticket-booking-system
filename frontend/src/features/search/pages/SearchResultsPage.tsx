import { useSearchParams, useNavigate } from "react-router-dom";
import { SearchForm } from "@/features/home/components/SearchForm";
import { useSearchTrips } from "@/features/catalog/hooks";
import { TripCard } from "../components/TripCard";
import { FilterSidebar } from "../components/FilterSidebar";
import type { Trip } from "@/features/catalog/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "@/hooks/use-toast";

export const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const date = searchParams.get("date");
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;

  const { data: trips, isLoading } = useSearchTrips({
    origin,
    destination,
    date,
    minPrice,
    maxPrice,
  });

  const handleSelectTrip = (trip: Trip) => {
    if (!user) {
        toast({
            title: "Vui lòng đăng nhập",
            description: "Bạn cần đăng nhập để đặt vé.",
            variant: "destructive",
        });
        navigate("/login", { state: { from: `/search?${searchParams.toString()}` } });
        return;
    }
    // Navigate to booking page (to be implemented)
    // For now, just show a toast or log
    console.log("Selected trip:", trip);
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
                        <p className="text-gray-500">Vui lòng thử lại với ngày khác hoặc tuyến đường khác.</p>
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
