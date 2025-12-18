import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createBooking,
    getBookingById,
    getUserBookings,
    getBookedSeatsForTrip,
    confirmBooking,
    cancelBooking,
    createPayment,
    type CreatePaymentRequest,
} from "./api";
import type { CreateBookingRequest } from "./types";

export const useBookingById = (id: string | undefined) => {
    return useQuery({
        queryKey: ["booking", id],
        queryFn: () => getBookingById(id!),
        enabled: !!id,
        retry: false, // Don't retry on error to prevent infinite loading
    });
};

export const useUserBookings = (page = 0, size = 10) => {
    return useQuery({
        queryKey: ["bookings", "user", page, size],
        queryFn: () => getUserBookings(page, size),
    });
};

export const useBookedSeats = (tripId: string | undefined) => {
    return useQuery({
        queryKey: ["bookedSeats", tripId],
        queryFn: () => getBookedSeatsForTrip(tripId!),
        enabled: !!tripId,
        staleTime: 30000, // 30 seconds
        refetchInterval: 30000, // Refresh every 30 seconds to catch seat changes
    });
};

export const useCreateBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: CreateBookingRequest) => createBooking(request),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
            queryClient.invalidateQueries({ queryKey: ["bookedSeats", data.trip.id] });
        },
    });
};

export const useConfirmBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => confirmBooking(id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["booking", data.id] });
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
        },
    });
};

export const useCancelBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => cancelBooking(id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["booking", data.id] });
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
            queryClient.invalidateQueries({ queryKey: ["bookedSeats", data.trip.id] });
        },
    });
};

export const useCreatePayment = () => {
    return useMutation({
        mutationFn: (request: CreatePaymentRequest) => createPayment(request),
    });
};
