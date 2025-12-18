import { useMemo } from 'react';

import { LifeBuoy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

import { type SeatCell } from '../../features/bus-layout/types';
import { seatKey } from '../../features/bus-layout/utils';

type SeatGridProps = {
  rows: number;
  cols: number;
  floor: number;
  seats: SeatCell[];
  renderCell: (
    row: number,
    col: number,
    floor: number,
    seat: SeatCell | undefined,
  ) => React.ReactNode;
  renderLegend?: () => React.ReactNode;
};

export const SeatGrid = ({ rows, cols, floor, seats, renderCell, renderLegend }: SeatGridProps) => {
  const seatMap = useMemo(() => {
    const map = new Map<string, SeatCell>();
    seats.forEach((seat) => {
      if (seat.floor === floor) {
        map.set(seatKey(seat.floor, seat.row, seat.col), seat);
      }
    });
    return map;
  }, [seats, floor]);

  return (
    <div className="space-y-3 md:mt-4">
      {renderLegend && <div className="flex justify-between">{renderLegend()}</div>}

      <div
        className="grid gap-2 rounded-lg border bg-background p-6 shadow-sm min-w-[320px]"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(52px, 1fr))`,
        }}
      >
        <div className="flex items-center justify-between mb-3" style={{ gridColumn: '1 / -1' }}>
          <div className="flex items-center justify-center ml-3">
            <LifeBuoy className="rotate-90" /> {/* Steering wheel */}
          </div>
          <div className="flex items-center justify-center">
            <Badge className="bg-primary/10 text-primary">
              {seats.filter((s) => s.floor === floor).length} ghế
            </Badge>
          </div>
        </div>

        {Array.from({ length: rows }).map((_, rowIdx) =>
          Array.from({ length: cols }).map((__, colIdx) => {
            const key = seatKey(floor, rowIdx, colIdx);
            const seat = seatMap.get(key);
            return renderCell(rowIdx, colIdx, floor, seat);
          }),
        )}
      </div>
    </div>
  );
};
