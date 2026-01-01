import { ArrowDownToLine, ArrowUpFromLine, MapPin } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { RouteInfo } from '@/model/routeInfo';
import type { RouteStopInfo } from '@/model/routeStopInfo';

interface PickupDropoffCardProps {
  route: RouteInfo | undefined;
  sortedStops: RouteStopInfo[];
}

export const PickupDropoffCard = ({ route, sortedStops }: PickupDropoffCardProps) => {
  const pickupStops = sortedStops.filter(
    (stop) => stop.stopType === 'PICKUP' || stop.stopType === 'BOTH',
  );
  const dropoffStops = sortedStops.filter(
    (stop) => stop.stopType === 'DROPOFF' || stop.stopType === 'BOTH',
  );

  return (
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
                <p className="text-xs text-muted-foreground">{route?.originStation?.city}</p>
              </div>
              <span className="text-xs text-muted-foreground">Điểm xuất phát</span>
            </div>
            {pickupStops.map((stop) => (
              <div
                key={stop.id}
                className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{stop.station?.name}</p>
                  <p className="text-xs text-muted-foreground">{stop.station?.city}</p>
                </div>
                {stop.durationMinutesFromOrigin && (
                  <span className="text-xs text-muted-foreground">
                    +{stop.durationMinutesFromOrigin}m
                  </span>
                )}
              </div>
            ))}
            {pickupStops.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Không có điểm đón dọc đường</p>
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
            {dropoffStops.map((stop) => (
              <div
                key={stop.id}
                className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{stop.station?.name}</p>
                  <p className="text-xs text-muted-foreground">{stop.station?.city}</p>
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
                <p className="text-xs text-muted-foreground">{route?.destinationStation?.city}</p>
              </div>
              <span className="text-xs text-muted-foreground">Điểm cuối</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
