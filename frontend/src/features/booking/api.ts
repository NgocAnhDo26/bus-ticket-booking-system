import { apiClient } from "@/lib/api-client";
import { type LockSeatRequest } from "./types";
import { type Trip } from "@/features/catalog/types";

export const bookingApi = {
  lockSeat: async (data: LockSeatRequest) => {
    return apiClient.post("/bookings/seats/lock", data);
  },

  unlockSeat: async (data: LockSeatRequest) => {
    return apiClient.post("/bookings/seats/unlock", data);
  },

  getSeatStatus: async (tripId: string) => {
    const response = await apiClient.get<Record<string, string>>(`/bookings/seats/${tripId}`);
    return response.data; // Map<seatCode, statusString> e.g. "LOCKED:userId" or "BOOKED"
  },

  getTrip: async (tripId: string) => {
    const response = await apiClient.get<Trip>(`/trips/${tripId}`);
    return response.data;
  },
};
