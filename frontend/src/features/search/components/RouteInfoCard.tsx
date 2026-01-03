import { format } from 'date-fns';
import { Clock, MapPin } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { RouteInfo } from '@/model/routeInfo';

interface RouteInfoCardProps {
  route: RouteInfo | undefined;
  departure: Date | null;
  arrival: Date | null;
  hours: number;
  minutes: number;
}

export const RouteInfoCard = ({
  route,
  departure,
  arrival,
  hours,
  minutes,
}: RouteInfoCardProps) => {
  return (
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
                <p className="text-sm text-muted-foreground">{route?.originStation?.city}</p>
                {departure && (
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {format(departure, 'HH:mm')} - {format(departure, 'dd/MM/yyyy')}
                    </span>
                  </div>
                )}
              </div>



              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {route?.destinationStation?.name}
                </h3>
                <p className="text-sm text-muted-foreground">{route?.destinationStation?.city}</p>
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
  );
};
