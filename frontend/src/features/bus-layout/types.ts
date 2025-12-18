import { type SeatType } from '@/features/catalog/types';

export type { SeatType };

export type SeatTool = 'CURSOR' | 'NORMAL' | 'VIP' | 'ERASER';

export type BusLayoutConfig = {
    name: string;
    busType: string;
    totalFloors: number;
    totalRows?: number;
    totalCols?: number;
    description?: string;
};

export type SeatCell = {
    id: string;
    seatCode: string;
    type: SeatType;
    floor: number;
    row: number;
    col: number;
};

export type BusLayout = {
    id: string;
    name: string;
    busType: string;
    totalSeats: number;
    totalFloors: number;
    totalRows?: number;
    totalCols?: number;
    description: string;
    seats?: SeatCell[];
};

export type CreateBusLayoutPayload = {
    config: BusLayoutConfig;
    seats: SeatCell[];
};
