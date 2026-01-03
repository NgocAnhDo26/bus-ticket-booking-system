import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchTrips } from '@/features/catalog/hooks';
import type { Trip } from '@/features/catalog/types';
import { SearchForm } from '@/features/home/components/SearchForm';

import { FilterSidebar } from '../components/FilterSidebar';
import { TripCard } from '../components/TripCard';

const PAGE_SIZE = 10;

export const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const origin = searchParams.get('origin') || undefined;
  const destination = searchParams.get('destination') || undefined;
  const date = searchParams.get('date') || undefined;
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const minTime = searchParams.get('minTime') || undefined;
  const maxTime = searchParams.get('maxTime') || undefined;
  const operatorIds = searchParams.getAll('operatorIds');
  const currentPage = Number(searchParams.get('page')) || 1;

  const { data, isLoading } = useSearchTrips({
    origin,
    destination,
    date,
    minPrice,
    maxPrice,
    minTime,
    maxTime,
    operatorIds: operatorIds.length > 0 ? operatorIds : undefined,
    page: currentPage - 1, // Convert 1-based to 0-based for API
    size: PAGE_SIZE,
  });

  const trips = data?.trips ?? [];
  const pagination = data?.pagination;

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete('page');
    } else {
      newParams.set('page', page.toString());
    }
    setSearchParams(newParams);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTrip = (trip: Trip) => {
    // Allow guests to proceed to booking page
    navigate(`/booking/${trip.id}`);
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header Search Bar */}

      <div className="md:sticky md:top-22 md:z-30 py-4 lg:mx-23 sm:mx-6 mx-4 mt-2 bg-white dark:bg-emerald-900/80 backdrop-blur-xl p-4 md:p-6 rounded-2xl shadow-xl border border-white/20">
        <div className="w-full">
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
              <h2 className="text-xl font-bold text-foreground">
                Kết quả tìm kiếm: {origin} - {destination}
              </h2>
              <span className="text-muted-foreground">
                Tìm thấy {pagination?.totalElements || 0} chuyến xe
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-lg" />
                ))}
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border">
                <h3 className="text-lg font-medium text-foreground">
                  Không tìm thấy chuyến xe nào
                </h3>
                <p className="text-muted-foreground">
                  Vui lòng thử lại với ngày khác hoặc tuyến đường khác.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {trips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} onSelect={handleSelectTrip} />
                  ))}
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) {
                                handlePageChange(currentPage - 1);
                              }
                            }}
                            className={
                              currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                            }
                            aria-disabled={currentPage <= 1}
                          />
                        </PaginationItem>

                        {/* First page */}
                        {currentPage > 3 && (
                          <>
                            <PaginationItem>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePageChange(1);
                                }}
                                className="cursor-pointer"
                              >
                                1
                              </PaginationLink>
                            </PaginationItem>
                            {currentPage > 4 && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                          </>
                        )}

                        {/* Pages around current page */}
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                          .filter(
                            (page) =>
                              page === currentPage ||
                              page === currentPage - 1 ||
                              page === currentPage + 1 ||
                              (page === 1 && currentPage <= 3) ||
                              (page === pagination.totalPages &&
                                currentPage >= pagination.totalPages - 2),
                          )
                          .map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePageChange(page);
                                }}
                                isActive={page === currentPage}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}

                        {/* Last page */}
                        {currentPage < pagination.totalPages - 2 && (
                          <>
                            {currentPage < pagination.totalPages - 3 && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePageChange(pagination.totalPages);
                                }}
                                className="cursor-pointer"
                              >
                                {pagination.totalPages}
                              </PaginationLink>
                            </PaginationItem>
                          </>
                        )}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage < pagination.totalPages) {
                                handlePageChange(currentPage + 1);
                              }
                            }}
                            className={
                              currentPage >= pagination.totalPages
                                ? 'pointer-events-none opacity-50'
                                : 'cursor-pointer'
                            }
                            aria-disabled={currentPage >= pagination.totalPages}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
