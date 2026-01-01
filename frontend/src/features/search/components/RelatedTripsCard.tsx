import { differenceInMinutes, format } from 'date-fns';
import { Bus, Calendar } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Item } from '@/components/ui/item';
import { Skeleton } from '@/components/ui/skeleton';
import type { Trip } from '@/features/catalog/types';

interface RelatedTripsCardProps {
  relatedTrips: Trip[];
  isLoading: boolean;
  onTripClick: (tripId: string) => void;
}

export const RelatedTripsCard = ({
  relatedTrips,
  isLoading,
  onTripClick,
}: RelatedTripsCardProps) => {
  return (
    <>
      <Item className="flex flex-col gap-2 p-0 mb-4 items-start">
        <div className="flex items-center gap-2">
          <Bus className="h-5 w-5 text-primary" />
          <p className="font-medium text-lg">Chuyến xe liên quan</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Các chuyến xe khác trên cùng tuyến đường hoặc ngày tương tự
        </p>
      </Item>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : relatedTrips.length === 0 ? (
        <Card className="text-center py-8 p-4">
          <p className="text-sm text-muted-foreground">Không có chuyến xe liên quan nào</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {relatedTrips.map((relatedTrip) => (
            <div
              key={relatedTrip.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onTripClick(relatedTrip.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{relatedTrip.bus.operator.name}</span>
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
                    <span>{format(new Date(relatedTrip.departureTime), 'dd/MM/yyyy')}</span>
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
                  onTripClick(relatedTrip.id);
                }}
              >
                Xem chi tiết
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
