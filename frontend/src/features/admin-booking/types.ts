import { type BookingResponse, type BookingStatus } from '@/features/booking/types';

export type { BookingResponse, BookingStatus };

export type AdminBookingFilters = {
  search?: string;
  statuses?: BookingStatus[];
  startDate?: string; // ISO string
  endDate?: string; // ISO string
};
