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

    // If seat is in the confirmed booked list, it is BOOKED
    if (alreadyBookedSeats.includes(seatCode)) return 'BOOKED';

    const statusString = seatStatusMap[seatCode];
    if (!statusString) return 'AVAILABLE';

    // If socket says BOOKED (realtime update), it's BOOKED
    if (statusString === 'BOOKED') return 'BOOKED';

    // If it's locked but NOT by me (since I checked selectedSeats above), then it's LOCKED (gray)
    if (statusString.startsWith('LOCKED:')) {
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            {floors.map((floor) => (
              <TabsTrigger key={floor} value={`floor-${floor}`}>
                Tầng {floor}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Square className="h-3 w-3 fill-emerald-100 text-emerald-500" />
              <span>Thường</span>
            </div>
            <div className="flex items-center gap-1">
              <Square className="h-3 w-3 fill-amber-100 text-amber-500" />
              <span>VIP</span>
            </div>
            <div className="flex items-center gap-1">
              <Square className="h-3 w-3 fill-primary text-primary" />
              <span>Đang chọn</span>
            </div>
            <div className="flex items-center gap-1">
              <Square className="h-3 w-3 fill-muted text-muted" />
              <span>Đã đặt</span>
            </div>
          </div>
        </div>

        {floors.map((floor) => (
          <TabsContent key={floor} value={`floor-${floor}`} className="mt-2">
            <div className="flex justify-center">
              <SeatGrid
                rows={rows}
                cols={cols}
                floor={floor}
                seats={seats}
                renderCell={(_row, col, _floor, seat) => {
                  const alignment =
                    col === 0 ? 'mr-auto' : col === cols - 1 ? 'ml-auto' : 'mx-auto';

                  if (!seat) {
                    return (
                      <div key={`empty-${_row}-${col}`} className={cn('h-9 w-9', alignment)} />
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
                        'flex h-9 w-9 items-center justify-center rounded border text-[10px] font-medium transition-colors',
                        alignment,
                        style,
                      )}
                    >
                      <span>{seat.seatCode}</span>
                      {status === 'SELECTED' && (
                        <User className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5" />
                      )}
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
