import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Square, User } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { SeatGrid } from '@/components/common/SeatGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getBusLayout } from '@/features/bus-layout/api';
import { cn } from '@/lib/utils';

// import { useAuthStore } from "@/store/auth-store";
import { useBookingStore } from '../store';

type BookingSeatMapProps = {
  busLayoutId: string;
  alreadyBookedSeats?: string[];
  selectedSeats?: string[];
  onSeatClick?: (seatCode: string, status: string) => void;
};

export const BookingSeatMap = ({
  busLayoutId,
  alreadyBookedSeats = [],
  selectedSeats: propSelectedSeats,
  onSeatClick: propOnSeatClick,
}: BookingSeatMapProps) => {
  // const { user } = useAuthStore(); // Unused variable removed

  const {
    seatStatusMap,
    toggleSeat,
    selectedSeats: storeSelectedSeats,
  } = useBookingStore(
    useShallow((state) => ({
      seatStatusMap: state.seatStatusMap,
      toggleSeat: state.toggleSeat,
      selectedSeats: state.selectedSeats,
    })),
  );

  const selectedSeats = propSelectedSeats ?? storeSelectedSeats;

  const [currentFloor, setCurrentFloor] = useState(1);

  const { data: layout, isLoading } = useQuery({
    queryKey: ['bus-layout', busLayoutId],
    queryFn: () => getBusLayout(busLayoutId),
  });

  if (isLoading || !layout) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { totalFloors, totalRows, totalCols, seats = [] } = layout;
  const floors = Array.from({ length: totalFloors }, (_, i) => i + 1);

  // Fallback if rows/cols are missing
  const rows = totalRows || 10;
  const cols = totalCols || 4;

  const getSeatStatus = (seatCode: string) => {
    // Correctly identify MY selection using the persistent array
    if (selectedSeats.includes(seatCode)) return 'SELECTED';

    const statusString = seatStatusMap[seatCode];
    if (!statusString) return 'AVAILABLE';
    // If it's booked but it's one of OUR seats, treat as available so we can select/deselect
    if (statusString === 'BOOKED' && !alreadyBookedSeats.includes(seatCode)) return 'BOOKED';
    if (statusString === 'BOOKED' && alreadyBookedSeats.includes(seatCode)) return 'AVAILABLE'; // Or implicitly available

    // If it's locked but NOT by me (since I checked selectedSeats above), then it's LOCKED (gray)
    if (statusString.startsWith('LOCKED:')) {
      // Optional: Double check generic ID if logged in, but selectedSeats should suffice
      return 'LOCKED';
    }

    return 'AVAILABLE';
  };

  const getSeatStyle = (status: string, type: string) => {
    switch (status) {
      case 'BOOKED':
      case 'LOCKED':
        return 'bg-muted text-muted-foreground cursor-not-allowed border-muted';
      case 'SELECTED':
        return 'bg-primary border-primary text-primary-foreground';
      case 'AVAILABLE':
      default:
        if (type === 'VIP') {
          return 'bg-amber-100 border-amber-500 text-amber-700 hover:bg-amber-200';
        }
        return 'bg-emerald-100 border-emerald-500 text-emerald-700 hover:bg-emerald-200';
    }
  };

  const handleSeatClick = (seatCode: string, status: string) => {
    if (propOnSeatClick) {
      propOnSeatClick(seatCode, status);
      return;
    }
    if (status === 'BOOKED' || status === 'LOCKED') return;

    toggleSeat(seatCode);
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={`floor-${currentFloor}`}
        onValueChange={(value) => setCurrentFloor(Number(value.split('-')[1]))}
        className="w-full"
      >
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            {floors.map((floor) => (
              <TabsTrigger key={floor} value={`floor-${floor}`}>
                Tầng {floor}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Square className="h-4 w-4 fill-emerald-100 text-emerald-500" />
              <span>Ghế thường</span>
            </div>
            <div className="flex items-center gap-2">
              <Square className="h-4 w-4 fill-amber-100 text-amber-500" />
              <span>Ghế VIP</span>
            </div>
            <div className="flex items-center gap-2">
              <Square className="h-4 w-4 fill-primary text-primary" />
              <span>Đang chọn</span>
            </div>
            <div className="flex items-center gap-2">
              <Square className="h-4 w-4 fill-muted text-muted" />
              <span>Đã đặt</span>
            </div>
          </div>
        </div>

        {floors.map((floor) => (
          <TabsContent key={floor} value={`floor-${floor}`} className="mt-4">
            <div className="flex justify-center">
              <SeatGrid
                rows={rows}
                cols={cols}
                floor={floor}
                seats={seats}
                renderCell={(_row, col, _floor, seat) => {
                  if (!seat) {
                    return (
                      // <div
                      //   key={`${floor}-${row}-${col}`}
                      //   className={cn(
                      //     "flex items-center justify-center h-14 w-full max-w-14 relative rounded-md border",
                      //     col === 0
                      //       ? "mr-auto"
                      //       : col === cols - 1
                      //         ? "ml-auto"
                      //         : "mx-auto",
                      //   )}
                      // >
                      //   <X className="text-muted-foreground/30" />
                      // </div>
                      <div
                        key={`empty-${_row}-${col}`}
                        className="h-14 w-full max-w-14 mx-auto relative"
                      />
                    );
                  }

                  const status = getSeatStatus(seat.seatCode);
                  const style = getSeatStyle(status, seat.type);

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      onClick={() => handleSeatClick(seat.seatCode, status)}
                      disabled={status === 'BOOKED' || status === 'LOCKED'}
                      className={cn(
                        'flex h-14 w-full max-w-14 flex-col items-center justify-center rounded-md border text-xs transition-colors',
                        col === 0 ? 'mr-auto' : col === cols - 1 ? 'ml-auto' : 'mx-auto',
                        'relative',
                        style,
                      )}
                    >
                      <span className="font-semibold">{seat.seatCode}</span>
                      {status === 'SELECTED' && <User className="h-3 w-3 absolute top-1 right-1" />}
                    </button>
                  );
                }}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
