import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { differenceInMinutes, format } from 'date-fns';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Bus,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import { mapAmenityToVietnamese } from '@/utils/amenities';

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

  const minPrice = tripPricings.length > 0 ? Math.min(...tripPricings.map((p) => p.price || 0)) : 0;
  const maxPrice = tripPricings.length > 0 ? Math.max(...tripPricings.map((p) => p.price || 0)) : 0;

  // Sort stops by stopOrder
  const sortedStops = [...stops].sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0));

  // Filter out the current trip and get related trips
  const relatedTrips =
    relatedTripsData?.trips.filter((t) => t.id !== tripData.id && t.id).slice(0, 4) || [];

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Chi tiết chuyến xe</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Content */}
          <div className="space-y-4">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Thông tin</TabsTrigger>
                <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                {/* Route Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Thông tin tuyến đường
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Origin and Destination */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center pt-1">
                          <div className="w-4 h-4 rounded-full bg-primary" />
                          <div className="w-0.5 h-8 bg-border my-1" />
                          <div className="w-4 h-4 rounded-full bg-primary border-2 border-background" />
                        </div>
                        <div className="flex-1 space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {route?.originStation?.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {route?.originStation?.city}
                            </p>
                            {departure && (
                              <div className="flex items-center gap-2 mt-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {format(departure, 'HH:mm')} - {format(departure, 'dd/MM/yyyy')}
                                </span>
                              </div>
                            )}
                          </div>

                          {sortedStops.map((stop, index) => (
                            <div key={stop.id || index}>
                              <h4 className="text-base font-medium text-foreground">
                                {stop.station?.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">{stop.station?.city}</p>
                              {stop.durationMinutesFromOrigin && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {Math.floor(stop.durationMinutesFromOrigin / 60)}h{' '}
                                    {stop.durationMinutesFromOrigin % 60}m từ điểm xuất phát
                                  </span>
                                </div>
                              )}
                              {stop.stopType && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {stop.stopType}
                                </Badge>
                              )}
                            </div>
                          ))}

                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {route?.destinationStation?.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {route?.destinationStation?.city}
                            </p>
                            {arrival && (
                              <div className="flex items-center gap-2 mt-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {format(arrival, 'HH:mm')} - {format(arrival, 'dd/MM/yyyy')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Duration and Distance */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Thời gian di chuyển</p>
                        <p className="text-lg font-semibold">
                          {hours}h {minutes}m
                        </p>
                      </div>
                      {route?.durationMinutes && (
                        <div>
                          <p className="text-sm text-muted-foreground">Tổng thời gian</p>
                          <p className="text-lg font-semibold">
                            {Math.floor(route.durationMinutes / 60)}h {route.durationMinutes % 60}m
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Pickup / Dropoff Points */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Điểm đón / trả
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Pickup Points */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ArrowUpFromLine className="h-4 w-4 text-green-600" />
                        <h4 className="font-medium text-foreground">Điểm đón</h4>
                      </div>
                      <div className="space-y-2">
                        {/* Origin station is always a pickup point */}
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                          <div className="w-2 h-2 rounded-full bg-green-600" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{route?.originStation?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {route?.originStation?.city}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">Điểm xuất phát</span>
                        </div>
                        {sortedStops
                          .filter((stop) => stop.stopType === 'PICKUP' || stop.stopType === 'BOTH')
                          .map((stop) => (
                            <div
                              key={stop.id}
                              className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                            >
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{stop.station?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {stop.station?.city}
                                </p>
                              </div>
                              {stop.durationMinutesFromOrigin && (
                                <span className="text-xs text-muted-foreground">
                                  +{stop.durationMinutesFromOrigin}m
                                </span>
                              )}
                            </div>
                          ))}
                        {sortedStops.filter(
                          (stop) => stop.stopType === 'PICKUP' || stop.stopType === 'BOTH',
                        ).length === 0 && (
                          <p className="text-sm text-muted-foreground italic">
                            Không có điểm đón dọc đường
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Dropoff Points */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ArrowDownToLine className="h-4 w-4 text-blue-600" />
                        <h4 className="font-medium text-foreground">Điểm trả</h4>
                      </div>
                      <div className="space-y-2">
                        {sortedStops
                          .filter((stop) => stop.stopType === 'DROPOFF' || stop.stopType === 'BOTH')
                          .map((stop) => (
                            <div
                              key={stop.id}
                              className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                            >
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{stop.station?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {stop.station?.city}
                                </p>
                              </div>
                              {stop.durationMinutesFromOrigin && (
                                <span className="text-xs text-muted-foreground">
                                  +{stop.durationMinutesFromOrigin}m
                                </span>
                              )}
                            </div>
                          ))}
                        {/* Destination station is always a dropoff point */}
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                          <div className="w-2 h-2 rounded-full bg-blue-600" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{route?.destinationStation?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {route?.destinationStation?.city}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">Điểm cuối</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bus className="h-5 w-5 text-primary" />
                      Thông tin xe
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nhà xe</p>
                        <p className="text-lg font-semibold">{bus?.operator?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Biển số xe</p>
                        <p className="text-lg font-semibold">{bus?.plateNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tổng số ghế</p>
                        <p className="text-lg font-semibold">{bus?.totalSeats} chỗ</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Trạng thái</p>
                        <Badge
                          variant={
                            tripData.status === 'SCHEDULED'
                              ? 'default'
                              : tripData.status === 'RUNNING'
                                ? 'secondary'
                                : tripData.status === 'COMPLETED'
                                  ? 'outline'
                                  : 'destructive'
                          }
                        >
                          {tripData.status === 'SCHEDULED'
                            ? 'Đã lên lịch'
                            : tripData.status === 'RUNNING'
                              ? 'Đang chạy'
                              : tripData.status === 'COMPLETED'
                                ? 'Hoàn thành'
                                : 'Đã hủy'}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* Amenities */}
                    {amenities.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-3">Tiện ích</p>
                        <div className="flex gap-2">
                          {amenities.map((amenity, index) => {
                            return (
                              <Badge key={index} variant="outline">
                                {mapAmenityToVietnamese(amenity)}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

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

              <TabsContent value="reviews" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bus className="h-5 w-5 text-primary" />
                      Đánh giá nhà xe {bus?.operator?.name}
                    </CardTitle>
                    <CardDescription>
                      Xem đánh giá từ khách hàng đã sử dụng dịch vụ của nhà xe này
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ReviewList
                      reviews={reviewsData?.content || []}
                      isLoading={isLoadingReviews}
                      currentPage={reviewsPage}
                      totalPages={reviewsData?.page?.totalPages || 1}
                      onPageChange={setReviewsPage}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex flex-col gap-4">
            {/* Booking card */}
            <Card>
              <CardHeader>
                <CardTitle>Đặt vé</CardTitle>
                <CardDescription>Chọn chuyến xe này để tiếp tục</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Giá từ</span>
                    <span className="text-2xl font-bold text-primary">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(minPrice)}
                    </span>
                  </div>
                  {minPrice !== maxPrice && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Giá đến</span>
                      <span className="text-lg font-semibold text-muted-foreground">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(maxPrice)}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {departure && format(departure, 'dd/MM/yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {departure && format(departure, 'HH:mm')} -{' '}
                      {arrival && format(arrival, 'HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {route?.originStation?.name} → {route?.destinationStation?.name}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate(`/booking/${tripId}`)}
                  disabled={tripData.status === 'CANCELLED' || tripData.status === 'COMPLETED'}
                >
                  Chọn chuyến này
                </Button>

                {(tripData.status === 'CANCELLED' || tripData.status === 'COMPLETED') && (
                  <p className="text-xs text-center text-muted-foreground">
                    Chuyến xe này không còn khả dụng để đặt vé
                  </p>
                )}
              </CardContent>
            </Card>

            <Separator className="my-4" />

            {/* Relevant trips section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5 text-primary" />
                  Chuyến xe liên quan
                </CardTitle>
                <CardDescription>
                  Các chuyến xe khác trên cùng tuyến đường hoặc ngày tương tự
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRelatedTrips ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full rounded-lg" />
                    ))}
                  </div>
                ) : relatedTrips.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      Không có chuyến xe liên quan nào
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {relatedTrips.map((relatedTrip) => (
                      <div
                        key={relatedTrip.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/trips/${relatedTrip.id}`)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {relatedTrip.bus.operator.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {relatedTrip.bus.totalSeats} chỗ
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <p className="text-lg font-bold text-primary">
                                  {format(new Date(relatedTrip.departureTime), 'HH:mm')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {relatedTrip.route.originStation.name}
                                </p>
                              </div>
                              <div className="flex-1 flex flex-col items-center">
                                <p className="text-xs text-muted-foreground">
                                  {Math.floor(
                                    differenceInMinutes(
                                      new Date(relatedTrip.arrivalTime),
                                      new Date(relatedTrip.departureTime),
                                    ) / 60,
                                  )}
                                  h{' '}
                                  {differenceInMinutes(
                                    new Date(relatedTrip.arrivalTime),
                                    new Date(relatedTrip.departureTime),
                                  ) % 60}
                                  m
                                </p>
                                <div className="w-full h-0.5 bg-border relative my-1">
                                  <div className="absolute -top-0.5 left-0 w-1.5 h-1.5 rounded-full bg-primary" />
                                  <div className="absolute -top-0.5 right-0 w-1.5 h-1.5 rounded-full bg-primary" />
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-muted-foreground">
                                  {format(new Date(relatedTrip.arrivalTime), 'HH:mm')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {relatedTrip.route.destinationStation.name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(new Date(relatedTrip.departureTime), 'dd/MM/yyyy')}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Giá từ</p>
                            <p className="text-lg font-bold text-primary">
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(Math.min(...relatedTrip.tripPricings.map((p) => p.price)))}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/trips/${relatedTrip.id}`);
                          }}
                        >
                          Xem chi tiết
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
