import {
  cancelBooking as orvalCancelBooking,
  confirmBooking as orvalConfirmBooking,
  createBooking as orvalCreateBooking,
  getBookedSeatsForTrip as orvalGetBookedSeatsForTrip,
  getBookingById as orvalGetBookingById,
  getUserBookings as orvalGetUserBookings,
  lookupBooking as orvalLookupBooking,
} from '@/features/api/bookings/bookings';
import {
  getSeatStatus as orvalGetSeatStatus,
  lockSeat as orvalLockSeat,
  unlockSeat as orvalUnlockSeat,
} from '@/features/api/seat-locks/seat-locks';
import { type Trip } from '@/features/catalog/types';
import { apiClient } from '@/lib/api-client';

import type {
  BookingResponse,
  CreateBookingRequest,
  LockSeatRequest,
  UpdateBookingRequest,
} from './types';

// Booking CRUD APIs
export const createBooking = async (request: CreateBookingRequest): Promise<BookingResponse> => {
  const resp = await orvalCreateBooking(request);
  return resp as unknown as BookingResponse;
};

export const updateBooking = async (
  id: string,
  request: UpdateBookingRequest,
): Promise<BookingResponse> => {
  const response = await apiClient.put<BookingResponse>(`/api/bookings/${id}`, request);
  return response.data;
};

export const getBookingById = async (id: string): Promise<BookingResponse> => {
  const resp = await orvalGetBookingById(id);
  return resp as unknown as BookingResponse;
};

export const getUserBookings = async (
  page = 0,
  size = 10,
): Promise<{
  content: BookingResponse[];
  totalPages: number;
  totalElements: number;
}> => {
  const resp = await orvalGetUserBookings({ pageable: { page, size } });
  return {
    content: (resp.content ?? []) as unknown as BookingResponse[],
    totalPages: resp.page?.totalPages ?? 0,
    totalElements: resp.page?.totalElements ?? 0,
  };
};

export const getBookedSeatsForTrip = async (tripId: string): Promise<string[]> => {
  const resp = await orvalGetBookedSeatsForTrip(tripId);
  return resp ?? [];
};

export const confirmBooking = async (id: string): Promise<BookingResponse> => {
  const resp = await orvalConfirmBooking(id);
  return resp as unknown as BookingResponse;
};

export const cancelBooking = async (id: string): Promise<BookingResponse> => {
  const resp = await orvalCancelBooking(id);
  return resp as unknown as BookingResponse;
};

export const lookupBooking = async (code: string, email: string): Promise<BookingResponse> => {
  const resp = await orvalLookupBooking({ code, email });
  return resp as unknown as BookingResponse;
};

// Payment API
export interface CreatePaymentRequest {
  bookingId: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PaymentResponse {
  id: string;
  bookingId: string;
  orderCode: number;
  amount: number;
  status: string;
  checkoutUrl: string;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
}

export const createPayment = async (request: CreatePaymentRequest): Promise<PaymentResponse> => {
  const response = await apiClient.post<PaymentResponse>('/api/payments', request);
  return response.data;
};

export const getPaymentByBookingId = async (bookingId: string): Promise<PaymentResponse> => {
  const response = await apiClient.get<PaymentResponse>(`/api/payments/booking/${bookingId}`);
  return response.data;
};

export const verifyPayment = async (bookingId: string): Promise<PaymentResponse> => {
  const response = await apiClient.post<PaymentResponse>(`/api/payments/verify/${bookingId}`);
  return response.data;
};

// Seat locking APIs from teammate
export const bookingApi = {
  lockSeat: async (data: LockSeatRequest) => {
    return orvalLockSeat(data);
  },

  unlockSeat: async (data: LockSeatRequest) => {
    return orvalUnlockSeat(data);
  },

  getSeatStatus: async (tripId: string) => {
    const resp = await orvalGetSeatStatus(tripId);
    return resp ?? {};
  },

  getTrip: async (tripId: string) => {
    const response = await apiClient.get<Trip>(`/api/trips/${tripId}`);
    return response.data;
  },
};
