import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { BusLayoutWizard } from '../components/BusLayoutWizard';
import { useBusLayout } from '../hooks';
import { useBusLayoutStore } from '../store/useBusLayoutStore';
import { type SeatCell, type SeatType } from '../types';

export const BusLayoutCreatePage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: layout, isLoading } = useBusLayout(id);
  const loadLayout = useBusLayoutStore((state) => state.loadLayout);
  const resetStore = useBusLayoutStore((state) => state.resetStore);

  useEffect(() => {
    if (id && layout) {
      const seatsData = layout.seats || [];

      const config = {
        name: layout.name,
        busType: layout.busType,
        totalFloors: layout.totalFloors,
        totalRows:
          layout.totalRows ??
          (seatsData.length > 0 ? Math.max(...seatsData.map((s) => s.row)) + 2 : 10),
        totalCols:
          layout.totalCols ??
          (seatsData.length > 0 ? Math.max(...seatsData.map((s) => s.col)) + 2 : 3),
        description: layout.description,
      };

      const seats: SeatCell[] = seatsData.map((s) => ({
        id: `${s.floor}-${s.row}-${s.col}`,
        row: s.row,
        col: s.col,
        floor: s.floor,
        seatCode: s.seatCode,
        type: s.type as SeatType,
      }));

      // loadLayout will handle rotation of gridDimensions from config
      loadLayout(config, seats);
    } else if (!id) {
      resetStore();
    }
  }, [id, layout, loadLayout, resetStore]);

  if (id && isLoading) {
    return <div className="p-4">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="flex flex-col gap-8 p-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {id ? 'Cập nhật sơ đồ xe' : 'Trình tạo sơ đồ xe'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {id
            ? 'Chỉnh sửa thông tin và sơ đồ ghế.'
            : 'Cấu hình thông tin xe và vẽ sơ đồ ghế trực quan trước khi lưu.'}
        </p>
      </div>

      <BusLayoutWizard layoutId={id} />
    </div>
  );
};
