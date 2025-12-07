import { apiClient } from "@/lib/api-client";
import type { BookingResponse, CreateBookingRequest } from "./types";

export const createBooking = async (
    request: CreateBookingRequest
): Promise<BookingResponse> => {
    const response = await apiClient.post<BookingResponse>("/bookings", request);
    return response.data;
};

export const getBookingById = async (id: string): Promise<BookingResponse> => {
    const response = await apiClient.get<BookingResponse>(`/bookings/${id}`);
    return response.data;
};

export const getUserBookings = async (
    page = 0,
    size = 10
): Promise<{ content: BookingResponse[]; totalPages: number; totalElements: number }> => {
    const response = await apiClient.get<{
        content: BookingResponse[];
        totalPages: number;
        totalElements: number;
    }>("/bookings/user", {
        params: { page, size },
    });
    return response.data;
};

export const getBookedSeatsForTrip = async (tripId: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>(`/bookings/trip/${tripId}/seats`);
    return response.data;
};

export const confirmBooking = async (id: string): Promise<BookingResponse> => {
    const response = await apiClient.put<BookingResponse>(`/bookings/${id}/confirm`);
    return response.data;
};

export const cancelBooking = async (id: string): Promise<BookingResponse> => {
    const response = await apiClient.put<BookingResponse>(`/bookings/${id}/cancel`);
    return response.data;
};
