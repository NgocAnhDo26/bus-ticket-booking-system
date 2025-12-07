import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserBookings, useCancelBooking } from "../hooks";
import { BookingCard } from "../components/BookingCard";
import { toast } from "@/hooks/use-toast";
import { Ticket, ChevronLeft, ChevronRight } from "lucide-react";

export function BookingHistoryPage() {
  const [page, setPage] = useState(0);
  const pageSize = 5;
  
  const { data, isLoading, error } = useUserBookings(page, pageSize);
  const cancelMutation = useCancelBooking();

  const handleCancel = async (id: string) => {
    try {
      await cancelMutation.mutateAsync(id);
      toast({
        title: "Hủy vé thành công",
        description: "Đặt vé của bạn đã được hủy.",
      });
    } catch {
      toast({
        title: "Hủy vé thất bại",
        description: "Có lỗi xảy ra, vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Có lỗi xảy ra khi tải lịch sử đặt vé.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bookings = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Ticket className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Lịch sử đặt vé</h1>
          <p className="text-muted-foreground">
            Bạn có {totalElements} đặt vé
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Chưa có đặt vé nào</h3>
            <p className="text-muted-foreground mb-4">
              Đặt vé ngay để bắt đầu hành trình của bạn.
            </p>
            <Button asChild>
              <a href="/">Tìm chuyến xe</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
                isCancelling={cancelMutation.isPending}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Trước
              </Button>
              <span className="text-sm">
                Trang {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
