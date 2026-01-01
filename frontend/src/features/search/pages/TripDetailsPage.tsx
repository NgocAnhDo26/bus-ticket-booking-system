import { useNavigate, useParams } from 'react-router-dom';

import { format } from 'date-fns';
import { ArrowLeft, Bus, Clock, Coffee, MapPin, Wifi, Wind } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useTripById } from '@/features/catalog/hooks';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const TripDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: trip, isLoading, error } = useTripById(id);

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <Skeleton className="h-12 w-48 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 pl-0 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Không tìm thấy chuyến đi</h3>
            <p className="text-muted-foreground">
              Chuyến đi bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allStops = [
    {
      id: trip.route.originStation.id,
      station: trip.route.originStation,
      stopOrder: 0,
      durationMinutesFromOrigin: 0,
      stopType: 'BOTH' as const,
    },
    ...(trip.route.stops || []),
    {
      id: trip.route.destinationStation.id,
      station: trip.route.destinationStation,
      stopOrder: (trip.route.stops?.length ?? 0) + 1,
      durationMinutesFromOrigin: trip.route.durationMinutes,
      stopType: 'BOTH' as const,
    },
  ].sort((a, b) => a.stopOrder - b.stopOrder);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Đang hoạt động</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Đã hủy</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-blue-500">Đã hoàn thành</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 pl-0">
        <ArrowLeft className="h-4 w-4" />
        Quay lại tìm kiếm
      </Button>

      {/* Trip Status */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Chi tiết chuyến đi</h1>
        {getStatusBadge(trip.status)}
      </div>

      {/* Route Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Tuyến đường
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-0.5 h-8 bg-gray-200" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className="font-medium">{trip.route.originStation.name}</p>
                <p className="text-sm text-muted-foreground">{trip.route.originStation.city}</p>
              </div>
              <div>
                <p className="font-medium">{trip.route.destinationStation.name}</p>
                <p className="text-sm text-muted-foreground">
                  {trip.route.destinationStation.city}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Khởi hành</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold">
                  {format(new Date(trip.departureTime), 'HH:mm')}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(trip.departureTime), 'dd/MM/yyyy')}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Dự kiến đến</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold">{format(new Date(trip.arrivalTime), 'HH:mm')}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(trip.arrivalTime), 'dd/MM/yyyy')}
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Thời gian di chuyển: {Math.floor(trip.route.durationMinutes / 60)}h{' '}
            {trip.route.durationMinutes % 60}m
          </div>
        </CardContent>
      </Card>

      {/* Route Stops */}
      {allStops.length > 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Điểm dừng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allStops.map((stop, index) => (
                <div key={stop.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        index === 0
                          ? 'bg-primary'
                          : index === allStops.length - 1
                            ? 'bg-green-500'
                            : 'bg-gray-400'
                      }`}
                    />
                    {index < allStops.length - 1 && <div className="w-0.5 h-8 bg-gray-200" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{stop.station?.name}</p>
                    <p className="text-sm text-muted-foreground">{stop.station?.city}</p>
                    {stop.durationMinutesFromOrigin > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +{stop.durationMinutesFromOrigin} phút từ điểm xuất phát
                      </p>
                    )}
                    {stop.stopType && (
                      <div className="flex gap-2 mt-1">
                        {(stop.stopType === 'PICKUP' || stop.stopType === 'BOTH') && (
                          <Badge variant="outline" className="text-xs">
                            Điểm đón
                          </Badge>
                        )}
                        {(stop.stopType === 'DROPOFF' || stop.stopType === 'BOTH') && (
                          <Badge variant="outline" className="text-xs">
                            Điểm trả
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bus Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            Thông tin xe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Biển số xe</div>
              <div className="font-semibold">{trip.bus.plateNumber}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Nhà xe</div>
              <div className="font-semibold">{trip.bus.operator.name}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Số ghế</div>
              <div className="font-semibold">{trip.bus.totalSeats} chỗ</div>
            </div>
          </div>

          {trip.bus.amenities && trip.bus.amenities.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Tiện ích</div>
                <div className="flex flex-wrap gap-2">
                  {trip.bus.amenities.map((amenity) => (
                    <Badge key={amenity} variant="outline" className="gap-1">
                      {amenity === 'WiFi' && <Wifi className="h-3 w-3" />}
                      {amenity === 'Máy lạnh' && <Wind className="h-3 w-3" />}
                      {amenity === 'Nước uống' && <Coffee className="h-3 w-3" />}
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Giá vé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trip.tripPricings.map((pricing) => (
              <div
                key={pricing.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {pricing.seatType === 'VIP' ? 'Ghế VIP' : 'Ghế thường'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {pricing.seatType === 'VIP' ? 'Ghế cao cấp' : 'Ghế tiêu chuẩn'}
                  </div>
                </div>
                <div className="text-xl font-bold text-primary">
                  {formatCurrency(pricing.price)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex gap-4">
        <Button
          onClick={() => navigate(`/booking/${trip.id}`)}
          className="flex-1"
          size="lg"
          disabled={trip.status !== 'ACTIVE'}
        >
          Đặt vé ngay
        </Button>
      </div>
    </div>
  );
};
