import { differenceInMinutes, format } from 'date-fns';
import { Bus, Coffee, MapPin, Wifi, Wind } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Trip } from '@/features/catalog/types';

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

  const minPrice = Math.min(...trip.tripPricings.map((p) => p.price));

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: Time & Route */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-primary">{format(departure, 'HH:mm')}</h3>
                <div className="flex flex-col items-center px-2">
                  <span className="text-xs text-muted-foreground">
                    {hours}h{minutes}m
                  </span>
                  <div className="w-20 h-0.5 bg-border relative">
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

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{trip.bus.operator.name}</span>
              </div>
              <Badge className="text-xs">{trip.bus.totalSeats} chỗ</Badge>
            </div>
          </div>

          {/* Right: Price & Action */}
          <div className="flex flex-col justify-between items-end border-l pl-6 gap-4 min-w-[200px]">
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

            <Button onClick={() => onSelect(trip)} className="w-full">
              Chọn chuyến
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
