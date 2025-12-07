import { Ticket, Calendar, Clock, MapPin } from "lucide-react";
import { UserSummaryCard } from "../components/UserSummaryCard";
import { useUserDashboardSummary, useUserRecentTrips } from "../hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export const DashboardPage = () => {
  const { data: summary, isLoading: isLoadingSummary } = useUserDashboardSummary();
  const { data: recentTrips, isLoading: isLoadingTrips } = useUserRecentTrips();

  const isLoading = isLoadingSummary || isLoadingTrips;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-muted/50">
        <div className="flex flex-wrap gap-4">
          <UserSummaryCard
            title="Chuyến đi đã đặt"
            data={summary?.totalTrips || 0}
            icon={Ticket}
            iconBgColor="bg-blue-500"
          />
          <UserSummaryCard
            title="Chuyến sắp tới"
            data={summary?.upcomingTrips || 0}
            icon={Calendar}
            iconBgColor="bg-green-500"
          />
          <UserSummaryCard
            title="Tổng chi tiêu"
            data={formatCurrency(summary?.totalSpent || 0)}
            icon={Clock}
            iconBgColor="bg-purple-500"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Chuyến đi gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {recentTrips?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có chuyến đi nào.</p>
                ) : (
                    recentTrips?.map((trip, i) => (
                    <div key={i} className="flex items-center">
                        <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {trip.origin} - {trip.destination}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {format(new Date(trip.departureTime), "dd/MM/yyyy • HH:mm", { locale: vi })}
                        </p>
                        </div>
                        <div className="ml-auto font-medium">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="w-3 h-3" /> {trip.distance.toFixed(1)}km
                            </div>
                        </div>
                    </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Thông báo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-md border p-4">
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                            Khuyến mãi 20%
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Nhập mã HELLO2024 để được giảm giá cho chuyến đi đầu tiên.
                        </p>
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};
