import { create } from 'zustand';

import { type BusLayoutConfig, type SeatCell, type SeatTool } from '../types';
import { createSeatId } from '../utils';

const defaultConfig: BusLayoutConfig = {
  name: '',
  busType: '',
  totalFloors: 1,
  description: '',
};

type State = {
  step: 1 | 2;
  config: BusLayoutConfig;
  gridDimensions: {
    rows: number;
    cols: number;
  };
  seats: SeatCell[];
  currentFloor: number;
  selectedTool: SeatTool;
};

type Actions = {
  setConfig: (data: BusLayoutConfig & { totalRows?: number; totalCols?: number }) => void;
  setGridDimensions: (rows: number, cols: number) => void;
  addSeat: (seat: Omit<SeatCell, 'id'> & { id?: string }) => void;
  removeSeat: (row: number, col: number, floor: number) => void;
  updateSeat: (seat: SeatCell) => void;
  setTool: (tool: SeatTool) => void;
  setCurrentFloor: (floor: number) => void;
  setStep: (step: 1 | 2) => void;
  resetStore: () => void;
  loadLayout: (
    config: BusLayoutConfig,
    seats: SeatCell[],
    gridDims?: { rows: number; cols: number },
  ) => void;
};

const createInitialState = (): State => ({
  step: 1,
  config: { ...defaultConfig },
  gridDimensions: { rows: 10, cols: 4 },
  seats: [],
  currentFloor: 1,
  selectedTool: 'NORMAL',
});

export const useBusLayoutStore = create<State & Actions>()((set) => ({
  ...createInitialState(),
  setConfig: (data) =>
    set((state) => {
      const { totalRows, totalCols, ...apiConfig } = data;
      const logicalRows = totalRows ?? state.config.totalRows ?? state.gridDimensions.rows;
      const logicalCols = totalCols ?? state.config.totalCols ?? state.gridDimensions.cols;

      const nextGrid = {
        rows: logicalRows,
        cols: logicalCols,
      };

      // Include logical totalRows and totalCols in config for API
      const nextConfig = {
        ...state.config,
        ...apiConfig,
        totalRows: logicalRows,
        totalCols: logicalCols,
      };

      // Filter seats using logical dimensions
      const filteredSeats = state.seats.filter(
        (seat) =>
          seat.floor <= nextConfig.totalFloors && seat.row < logicalRows && seat.col < logicalCols,
      );

      return {
        config: nextConfig,
        gridDimensions: nextGrid,
        seats: filteredSeats,
        currentFloor: Math.min(state.currentFloor, nextConfig.totalFloors),
        step: 2,
      };
    }),
  setGridDimensions: (rows, cols) =>
    set({
      gridDimensions: { rows, cols },
    }),
  addSeat: (seatInput) =>
    set((state) => {
      const seatId = seatInput.id ?? createSeatId();
      const seats = state.seats.filter(
        (seat) =>
          !(
            seat.floor === seatInput.floor &&
            seat.row === seatInput.row &&
            seat.col === seatInput.col
          ),
      );

      seats.push({ ...seatInput, id: seatId });
      return { seats };
    }),
  removeSeat: (row, col, floor) =>
    set((state) => ({
      seats: state.seats.filter(
        (seat) => !(seat.row === row && seat.col === col && seat.floor === floor),
      ),
    })),
  updateSeat: (updatedSeat) =>
    set((state) => ({
      seats: state.seats.map((seat) =>
        seat.floor === updatedSeat.floor &&
        seat.row === updatedSeat.row &&
        seat.col === updatedSeat.col
          ? { ...seat, ...updatedSeat }
          : seat,
      ),
    })),
  setTool: (tool) => set({ selectedTool: tool }),
  setCurrentFloor: (floor) => set({ currentFloor: floor }),
  setStep: (step) => set({ step }),
  resetStore: () => set(() => createInitialState()),
  loadLayout: (config, seats, gridDims) =>
    set({
      config,
      seats,
      gridDimensions: gridDims || {
        rows: config.totalRows || 10,
        cols: config.totalCols || 4,
      },
      step: 1,
    }),
}));
