import { Bus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { BusInfo } from '@/model/busInfo';
import { mapAmenityToVietnamese } from '@/utils/amenities';

interface BusInfoCardProps {
  bus: BusInfo | undefined;
  tripStatus?: string;
  amenities: string[];
}

export const BusInfoCard = ({ bus, tripStatus, amenities }: BusInfoCardProps) => {
  const getStatusVariant = () => {
    switch (tripStatus) {
      case 'SCHEDULED':
        return 'default';
      case 'RUNNING':
        return 'secondary';
      case 'COMPLETED':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  const getStatusLabel = () => {
    switch (tripStatus) {
      case 'SCHEDULED':
        return 'Đã lên lịch';
      case 'RUNNING':
        return 'Đang chạy';
      case 'COMPLETED':
        return 'Hoàn thành';
      default:
        return 'Đã hủy';
    }
  };

  return (
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
            <Badge variant={getStatusVariant()}>{getStatusLabel()}</Badge>
          </div>
        </div>

        <Separator />

        {/* Amenities */}
        {amenities.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">Tiện ích</p>
            <div className="flex gap-2 flex-wrap">
              {amenities.map((amenity, index) => (
                <Badge key={index} variant="outline">
                  {mapAmenityToVietnamese(amenity)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
