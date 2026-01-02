import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { differenceInMinutes, format } from 'date-fns';
import { ArrowLeft, Bus, Stars } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Item } from '@/components/ui/item';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetTripById } from '@/features/api/trips/trips';
import { BookingSeatMap } from '@/features/booking/components/BookingSeatMap';
import { useBookedSeats } from '@/features/booking/hooks';
import { useSearchTrips } from '@/features/catalog/hooks';
import { ReviewList } from '@/features/reviews/components/ReviewList';
import { useReviewsByOperator } from '@/features/reviews/hooks';
import { TripPricingInfoSeatType } from '@/model/tripPricingInfoSeatType';
import type { TripResponse } from '@/model/tripResponse';

import { BusImagesGallery } from '../components/BusImagesGallery';
import { BusInfoCard } from '../components/BusInfoCard';
import { PickupDropoffCard } from '../components/PickupDropoffCard';
import { RelatedTripsCard } from '../components/RelatedTripsCard';
import { RouteInfoCard } from '../components/RouteInfoCard';

export const TripDetailsPage = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const {
    data: trip,
    isLoading,
    error,
  } = useGetTripById(tripId || '', {
    query: { enabled: !!tripId },
  });

  const { data: bookedSeats = [] } = useBookedSeats(tripId);

  // Extract search parameters for related trips (before early returns to satisfy React Hooks rules)
  const tempTripData = trip as TripResponse | undefined;
  const tempDeparture = tempTripData?.departureTime ? new Date(tempTripData.departureTime) : null;
  const tempRoute = tempTripData?.route;
  const originCity = tempRoute?.originStation?.city;
  const destinationCity = tempRoute?.destinationStation?.city;
  const tripDate = tempDeparture ? format(tempDeparture, 'yyyy-MM-dd') : undefined;

  // Fetch related trips (same route, same or similar dates)
  // Hook is called at top level, but query is only enabled when we have required params
  const { data: relatedTripsData, isLoading: isLoadingRelatedTrips } = useSearchTrips({
    origin: originCity,
    destination: destinationCity,
    date: tripDate,
    page: 0,
    size: 5, // Show up to 5 related trips
  });

  // Reviews for operator - moved before early returns to satisfy React Hooks rules
  const [reviewsPage, setReviewsPage] = useState(0);
  const operatorId = tempTripData?.bus?.operator?.id;
  const { data: reviewsData, isLoading: isLoadingReviews } = useReviewsByOperator(
    operatorId,
    reviewsPage,
    10,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-12">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-background pb-12">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Không tìm thấy chuyến xe
                </h3>
                <p className="text-muted-foreground mb-4">
                  Chuyến xe bạn đang tìm kiếm không tồn tại hoặc đã bị hủy.
                </p>
                <Button onClick={() => navigate('/search')} variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại tìm kiếm
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // At this point, we know trip exists (passed early returns)
  const tripData = trip as TripResponse;
  const departure = tripData.departureTime ? new Date(tripData.departureTime) : null;
  const arrival = tripData.arrivalTime ? new Date(tripData.arrivalTime) : null;
  const duration = departure && arrival ? differenceInMinutes(arrival, departure) : 0;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  const route = tripData.route;
  const bus = tripData.bus;
  const stops = route?.stops || [];
  const amenities = bus?.amenities || [];
  const tripPricings = tripData.tripPricings || [];

  // Sort stops by stopOrder
  const sortedStops = [...stops].sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0));

  // Filter out the current trip and get related trips
  const relatedTrips =
    relatedTripsData?.trips.filter((t) => t.id !== tripData.id && t.id).slice(0, 4) || [];

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Chi tiết chuyến xe</h1>
        </div>

        <div className="flex items-center justify-center">
          {/* Main Content */}
          <div className="space-y-4 flex-1">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Thông tin chung</TabsTrigger>
                <TabsTrigger value="images">Hình ảnh xe</TabsTrigger>
                <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
                <TabsTrigger value="related">Chuyến liên quan</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <RouteInfoCard
                  route={route}
                  departure={departure}
                  arrival={arrival}
                  sortedStops={sortedStops}
                  hours={hours}
                  minutes={minutes}
                />

                <PickupDropoffCard route={route} sortedStops={sortedStops} />

                <BusInfoCard bus={bus} tripStatus={tripData.status} amenities={amenities} />

                {/* Seat Availability */}
                {bus?.busLayoutId && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bus className="h-5 w-5 text-primary" />
                        Sơ đồ ghế
                      </CardTitle>
                      <CardDescription>
                        Xem tình trạng ghế trống và đã đặt của chuyến xe
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BookingSeatMap
                        busLayoutId={bus.busLayoutId}
                        alreadyBookedSeats={bookedSeats}
                        selectedSeats={[]}
                        onSeatClick={() => {
                          // Read-only mode - no action on click
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Pricing Information */}
                {tripPricings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Bảng giá</CardTitle>
                      <CardDescription>Giá vé theo loại ghế</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {tripPricings.map((pricing) => (
                          <div
                            key={pricing.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card"
                          >
                            <div>
                              <p className="font-medium">
                                {pricing.seatType === TripPricingInfoSeatType.NORMAL
                                  ? 'Ghế thường'
                                  : pricing.seatType === TripPricingInfoSeatType.VIP
                                    ? 'Ghế VIP'
                                    : pricing.seatType || 'Không xác định'}
                              </p>
                            </div>
                            <p className="text-lg font-bold text-primary">
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(pricing.price || 0)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="images" className="mt-4 space-y-4">
                <BusImagesGallery images={(bus as { photos?: string[] })?.photos} />
              </TabsContent>

              <TabsContent value="reviews" className="mt-4">
                <Item className="flex flex-col items-start gap-2 p-0 mb-4">
                  <div className="flex items-center gap-2">
                    <Stars className="h-5 w-5 text-primary" />
                    <p className="font-medium text-lg">Đánh giá nhà xe {bus?.operator?.name}</p>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Xem đánh giá từ khách hàng đã sử dụng dịch vụ của nhà xe này
                  </p>
                </Item>

                <ReviewList
                  reviews={reviewsData?.content || []}
                  isLoading={isLoadingReviews}
                  currentPage={reviewsPage}
                  totalPages={reviewsData?.page?.totalPages || 1}
                  onPageChange={setReviewsPage}
                />
              </TabsContent>

              <TabsContent value="related" className="mt-4">
                <RelatedTripsCard
                  relatedTrips={relatedTrips}
                  isLoading={isLoadingRelatedTrips}
                  onTripClick={(id) => navigate(`/trips/${id}`)}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};
