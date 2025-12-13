import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Eye, X, Edit2 } from "lucide-react";
import type { BookingResponse } from "../types";
import { Link } from "react-router-dom";
import { useState } from "react";
import { BookingEditDialog } from "./BookingEditDialog";

type BookingCardProps = {
  booking: BookingResponse;
  onCancel?: (id: string) => void;
  isCancelling?: boolean;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const statusConfig = {
  PENDING: {
    label: "Chờ xác nhận",
    variant: "secondary" as const,
    className: "bg-yellow-100 text-yellow-700",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    variant: "default" as const,
    className: "bg-green-100 text-green-700",
  },
  CANCELLED: {
    label: "Đã hủy",
    variant: "destructive" as const,
    className: "bg-red-100 text-red-700",
  },
};

export const BookingCard = ({
  booking,
  onCancel,
  isCancelling,
}: BookingCardProps) => {
  const [showEdit, setShowEdit] = useState(false);
  const status = statusConfig[booking.status];
  const canCancel =
    booking.status !== "CANCELLED" &&
    new Date(booking.trip.departureTime) > new Date();
  
  const canEdit = booking.status === "PENDING";

  return (
    <>
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left: Trip Info */}
          <div className="flex-1 p-4 space-y-3">
            {/* Header with ID and status */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground">Mã đặt vé</span>
                <p className="font-mono font-bold text-lg">
                  #{booking.code}
                </p>
              </div>
              <Badge className={status.className}>{status.label}</Badge>
            </div>

            {/* Route */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="w-0.5 h-4 bg-gray-200" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {booking.trip.route.originStation.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  → {booking.trip.route.destinationStation.name}
                </p>
              </div>
            </div>

            {/* Pickup/Dropoff Details */}
            {(booking.pickupStation || booking.dropoffStation) && (
                 <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                    <div className="flex gap-2">
                        {booking.pickupStation && (
                            <div className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 text-xs text-nowrap">
                                Đón: {booking.pickupStation.name}
                            </div>
                        )}
                        {booking.dropoffStation && (
                            <div className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-200 text-xs text-nowrap">
                                Trả: {booking.dropoffStation.name}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Date and Time */}
            <div className="flex items-center gap-4 text-sm mt-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(booking.trip.departureTime)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatTime(booking.trip.departureTime)}</span>
              </div>
            </div>

            {/* Seats */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Ghế:</span>
              {booking.tickets.map((ticket) => (
                <Badge key={ticket.id} variant="outline" className="font-mono">
                  {ticket.seatCode}
                </Badge>
              ))}
            </div>
          </div>

          {/* Right: Price and Actions */}
          <div className="bg-muted/50 p-4 flex flex-col justify-between md:w-48 border-t md:border-t-0 md:border-l">
            <div>
              <p className="text-sm text-muted-foreground">Tổng tiền</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(booking.totalPrice)}
              </p>
              <p className="text-xs text-muted-foreground">
                {booking.tickets.length} vé
              </p>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/booking/confirmation/${booking.id}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  Chi tiết
                </Link>
              </Button>
              
              {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
                      <Edit2 className="h-4 w-4 mr-1" />
                      Sửa
                  </Button>
              )}

              {canCancel && onCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onCancel(booking.id)}
                  disabled={isCancelling}
                >
                  <X className="h-4 w-4 mr-1" />
                  {isCancelling ? "Đang hủy..." : "Hủy vé"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <BookingEditDialog 
        booking={booking} 
        open={showEdit} 
        onOpenChange={setShowEdit} 
    />
    </>
  );
};
