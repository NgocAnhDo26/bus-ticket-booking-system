import { PercentIcon } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface ConversionRateCardProps {
  conversionRate?: number; // 0..1
  confirmed?: number;
  total?: number;
  isLoading?: boolean;
}

const formatPercent = (v: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(v);
};

export const ConversionRateCard = ({
  conversionRate,
  confirmed,
  total,
  isLoading,
}: ConversionRateCardProps) => {
  return (
    <Card className="p-6 flex-1 min-w-64">
      <div className="flex items-center justify-center p-2 rounded-xl size-12 bg-red-400 mb-4">
        <PercentIcon className="text-white size-6" />
      </div>
      <div className="space-y-1">
        <p>Tỷ lệ chuyển đổi đơn</p>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <div className="flex items-center">
            <span className="font-semibold text-xl">{formatPercent(conversionRate ?? 0)}</span>
            <span className="text-sm text-muted-foreground ml-2">
              ({confirmed ?? 0}/{total ?? 0} đơn đã xác nhận)
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
