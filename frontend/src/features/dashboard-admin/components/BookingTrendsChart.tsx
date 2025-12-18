import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import type { BookingTrendResponse } from '@/model';

export interface BookingTrendsChartProps {
  data?: BookingTrendResponse[];
  isLoading?: boolean;
}

const formatBucket = (bucket?: string) => {
  if (!bucket) return '';
  const d = new Date(bucket);
  if (Number.isNaN(d.getTime())) return bucket;
  return new Intl.DateTimeFormat('vi-VN', { month: '2-digit', day: '2-digit' }).format(d);
};

export const BookingTrendsChart = ({ data, isLoading }: BookingTrendsChartProps) => {
  const chartData =
    data?.map((d) => ({
      bucket: d.bucket ?? '',
      totalBookings: d.totalBookings ?? 0,
      confirmedBookings: d.confirmedBookings ?? 0,
    })) ?? [];

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Xu hướng đặt vé</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="h-[260px] space-y-3">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-[240px] w-full" />
          </div>
        ) : (
          <>
            <ChartLegend
              items={[
                { id: 'totalBookings', label: 'Tổng đặt vé', colorClass: 'bg-chart-2' },
                { id: 'confirmedBookings', label: 'Đã xác nhận', colorClass: 'bg-chart-3' },
              ]}
            />
            <ChartContainer
              config={{
                totalBookings: { label: 'Tổng đặt vé', color: 'hsl(var(--chart-2))' },
                confirmedBookings: { label: 'Đã xác nhận', color: 'hsl(var(--chart-3))' },
              }}
            >
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: 8, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted/60"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="bucket"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={formatBucket}
                      className="fill-muted-foreground text-xs"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="fill-muted-foreground text-xs"
                    />
                    <Tooltip
                      content={({ label, payload }) => {
                        if (!payload?.length) return null;
                        const total =
                          payload.find((p) => p.dataKey === 'totalBookings')?.value ?? 0;
                        const confirmed =
                          payload.find((p) => p.dataKey === 'confirmedBookings')?.value ?? 0;

                        return (
                          <ChartTooltipContent>
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-muted-foreground">
                                {label ? `Ngày ${formatBucket(String(label))}` : 'Ngày'}
                              </p>
                              <div className="flex items-center justify-between gap-4 text-xs">
                                <span className="text-muted-foreground">Tổng đặt vé</span>
                                <span className="font-semibold text-foreground">{total}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-xs">
                                <span className="text-muted-foreground">Đã xác nhận</span>
                                <span className="font-semibold text-foreground">{confirmed}</span>
                              </div>
                            </div>
                          </ChartTooltipContent>
                        );
                      }}
                    />
                    <Bar
                      dataKey="totalBookings"
                      name="Tổng đặt vé"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={24}
                    />
                    <Bar
                      dataKey="confirmedBookings"
                      name="Đã xác nhận"
                      fill="hsl(var(--chart-3))"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
};
