import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import type { RevenueChartResponse } from '@/model';

export interface RevenueChartProps {
  data?: RevenueChartResponse[];
  isLoading?: boolean;
}

const formatCurrencyCompact = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

const normalizeDateString = (raw?: string) => {
  if (!raw) return '';
  // Handle backend strings like "{date=2025-12-17T17:00:00Z, revenue=850000.00}"
  const isoMatch = raw.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
  return isoMatch?.[0] ?? raw;
};

const formatXAxisDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const normalized = normalizeDateString(dateStr);
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('vi-VN', { month: '2-digit', day: '2-digit' }).format(d);
};

export const RevenueChart = ({ data, isLoading }: RevenueChartProps) => {
  const chartData =
    data?.map((d) => ({
      date: normalizeDateString(d.date),
      revenue: d.revenue ?? 0,
    })) ?? [];

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Doanh thu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="h-[260px] space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-[240px] w-full" />
          </div>
        ) : (
          <>
            <ChartLegend
              items={[
                {
                  id: 'revenue',
                  label: 'Doanh thu',
                  colorClass: 'bg-chart-1',
                },
              ]}
            />
            <ChartContainer
              config={{ revenue: { label: 'Doanh thu', color: 'hsl(var(--chart-1))' } }}
            >
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted/60"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={formatXAxisDate}
                      className="fill-muted-foreground text-xs"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(v) => formatCurrencyCompact(Number(v))}
                      className="fill-muted-foreground text-xs"
                    />
                    <Tooltip
                      content={({ label, payload }) => {
                        if (!payload?.length) return null;
                        const firstPoint = payload[0]?.payload as
                          | { date?: string; revenue?: number }
                          | undefined;
                        const value = firstPoint?.revenue ?? payload[0]?.value ?? 0;
                        const dateLabel =
                          firstPoint?.date ?? (typeof label === 'string' ? label : undefined);
                        return (
                          <ChartTooltipContent>
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-muted-foreground">
                                {dateLabel ? `Ngày ${formatXAxisDate(String(dateLabel))}` : 'Ngày'}
                              </p>
                              <p className="text-xs font-semibold text-foreground">
                                {formatCurrencyCompact(Number(value))}
                              </p>
                            </div>
                          </ChartTooltipContent>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--chart-1))"
                      fill="url(#revenueGradient)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
};
