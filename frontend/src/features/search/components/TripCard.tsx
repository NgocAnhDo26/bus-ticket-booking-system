import { Link } from 'react-router-dom';

import { differenceInMinutes, format } from 'date-fns';
import { Bus, Coffee, Image as ImageIcon, MapPin, StarIcon, Wifi, Wind } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Trip } from '@/features/catalog/types';
import { getImageUrl } from '@/lib/image-upload';

interface TripCardProps {
  trip: Trip;
  onSelect: (trip: Trip) => void;
}

export const TripCard = ({ trip, onSelect }: TripCardProps) => {
  const departure = new Date(trip.departureTime);
  const arrival = new Date(trip.arrivalTime);
  const duration = differenceInMinutes(arrival, departure);
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  const prices = trip.tripPricings.map((p) => p.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const firstPhoto = trip.bus.photos?.[0];
  const imageUrl = firstPhoto ? getImageUrl(firstPhoto) : null;

  return (
    <Card className="hover:shadow-md transition-shadow py-4">
      <CardContent className="flex px-6 py-2">
        {imageUrl ? (
          <img
            src={imageUrl}
            className="aspect-square object-cover rounded-lg object-center shadow-sm mr-4 max-h-36 max-w-36"
            alt={`${trip.bus.operator.name} bus`}
          />
        ) : (
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center shadow-sm mr-4">
            <ImageIcon className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-6 flex-1">
          {/* Left: Time & Route */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <Bus className="text-primary" />
                <span className="text-lg font-medium">{trip.bus.operator.name}</span>
              </div>
              <Badge className="text-xs ml-4">{trip.bus.totalSeats} chỗ</Badge>
              <Badge className="text-xs bg-yellow-500 text-white ml-2">
                <StarIcon />
                <span className="font-semibold">5.0</span>
                <span>(52)</span>
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-2 flex-1">
                  <h3 className="text-xl font-bold text-primary">{format(departure, 'HH:mm')}</h3>
                  <div className="flex flex-col items-center px-2 flex-1">
                    <span className="text-xs text-muted-foreground">
                      {hours}h{minutes}m
                    </span>
                    <div className="w-full h-0.25 bg-border relative">
                      <div className="absolute -top-1 left-0 w-2 h-2 rounded-full bg-primary" />
                      <div className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-muted-foreground">
                    {format(arrival, 'HH:mm')}
                  </h3>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{trip.route.originStation.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{trip.route.destinationStation.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Price & Action */}
          <div className="flex flex-col justify-between items-end border-l border-border pl-6 gap-4 min-w-[200px]">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Giá từ</p>
              <p className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(minPrice)}
              </p>
            </div>

            <div className="flex gap-2">
              {trip.bus.amenities.includes('WiFi') && (
                <Wifi className="w-4 h-4 text-muted-foreground" />
              )}
              {trip.bus.amenities.includes('Máy lạnh') && (
                <Wind className="w-4 h-4 text-muted-foreground" />
              )}
              {trip.bus.amenities.includes('Nước uống') && (
                <Coffee className="w-4 h-4 text-muted-foreground" />
              )}
            </div>

            <div className="flex gap-2 w-full">
              <Button variant="outline" asChild className="flex-1">
                <Link to={`/trips/${trip.id}`}>Xem chi tiết</Link>
              </Button>
              <Button onClick={() => onSelect(trip)} className="flex-1">
                Chọn chuyến
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
