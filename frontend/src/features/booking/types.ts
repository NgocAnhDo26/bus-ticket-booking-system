export type SeatStatus = "LOCKED" | "AVAILABLE" | "BOOKED";

export type SeatStatusMessage = {
  seatCode: string;
  status: SeatStatus;
  lockedByUserId?: string;
};

export type LockSeatRequest = {
  tripId: string;
  seatCode: string;
};

