import {
  createLayout,
  deleteLayout,
  getAllLayouts,
  getLayout,
  updateLayoutMetadata,
  updateLayoutSeats,
} from '@/features/api/bus-layout-controller/bus-layout-controller';
import type {
  BusLayout as ApiBusLayout,
  BusLayoutRequest,
  BusLayoutResponse,
  LayoutSeatDto,
} from '@/model';

import { type BusLayout, type CreateBusLayoutPayload, type SeatCell, type SeatType } from './types';

const toSeatCell = (seat: LayoutSeatDto, idx: number): SeatCell => ({
  id: seat.seatCode ?? `seat-${idx}`,
  seatCode: seat.seatCode ?? '',
  type: (seat.type as SeatType) ?? 'NORMAL',
  floor: seat.floor ?? 0,
  row: seat.row ?? 0,
  col: seat.col ?? 0,
});

const toBusLayout = (layout: ApiBusLayout): BusLayout => ({
  id: layout.id ?? '',
  name: layout.name ?? '',
  busType: layout.busType ?? '',
  totalSeats: layout.totalSeats ?? 0,
  totalFloors: layout.totalFloors ?? 1,
  totalRows: layout.totalRows ?? undefined,
  totalCols: layout.totalCols ?? undefined,
  description: layout.description ?? '',
  seats: undefined,
});

const toBusLayoutWithSeats = (layout: BusLayoutResponse): BusLayout => ({
  id: layout.id ?? '',
  name: layout.name ?? '',
  busType: layout.busType ?? '',
  totalSeats: layout.totalSeats ?? 0,
  totalFloors: layout.totalFloors ?? 1,
  totalRows: layout.totalRows ?? undefined,
  totalCols: layout.totalCols ?? undefined,
  description: layout.description ?? '',
  seats: (layout.seats ?? []).map(toSeatCell),
});

export const getBusLayouts = async () => {
  const resp = await getAllLayouts();
  return (resp ?? []).map(toBusLayout);
};

export const getBusLayout = async (id: string) => {
  const resp = await getLayout(id);
  return toBusLayoutWithSeats(resp);
};

export const createBusLayout = async (data: CreateBusLayoutPayload) => {
  // 1. Create layout metadata
  const busLayoutRequest: BusLayoutRequest = {
    name: data.config.name,
    busType: data.config.busType,
    totalFloors: data.config.totalFloors,
    totalRows: data.config.totalRows,
    totalCols: data.config.totalCols,
    description: data.config.description,
  };
  const layout = await createLayout(busLayoutRequest);
  const layoutId = layout.id ?? '';

  // 2. Update seats
  if (layoutId && data.seats && data.seats.length > 0) {
    const seats: LayoutSeatDto[] = data.seats.map((s) => ({
      seatCode: s.seatCode,
      type: s.type,
      floor: s.floor,
      row: s.row,
      col: s.col,
    }));
    await updateLayoutSeats(layoutId, { seats });
  }

  return toBusLayout(layout);
};

export const updateBusLayout = async (id: string, data: CreateBusLayoutPayload) => {
  // 1. Update metadata
  const busLayoutRequest: BusLayoutRequest = {
    name: data.config.name,
    busType: data.config.busType,
    totalFloors: data.config.totalFloors,
    totalRows: data.config.totalRows,
    totalCols: data.config.totalCols,
    description: data.config.description,
  };
  const layout = await updateLayoutMetadata(id, busLayoutRequest);

  // 2. Update seats
  if (data.seats) {
    const seats: LayoutSeatDto[] = data.seats.map((s) => ({
      seatCode: s.seatCode,
      type: s.type,
      floor: s.floor,
      row: s.row,
      col: s.col,
    }));
    await updateLayoutSeats(id, { seats });
  }

  return toBusLayout(layout);
};

export const deleteBusLayout = async (id: string) => {
  await deleteLayout(id);
};
