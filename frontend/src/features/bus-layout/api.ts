import { apiClient } from "@/lib/api-client";
import { type CreateBusLayoutPayload, type BusLayout } from "./types";

export const getBusLayouts = async () => {
  const response = await apiClient.get<BusLayout[]>("/bus-layouts");
  return response.data;
};

export const getBusLayout = async (id: string) => {
  const response = await apiClient.get<BusLayout>(`/bus-layouts/${id}`);
  return response.data;
};

export const createBusLayout = async (data: CreateBusLayoutPayload) => {
  // 1. Create layout metadata
  const layoutResponse = await apiClient.post<BusLayout>("/bus-layouts", data.config);
  const layoutId = layoutResponse.data.id;

  // 2. Update seats
  if (data.seats && data.seats.length > 0) {
    await apiClient.put(`/bus-layouts/${layoutId}/seats`, {
      seats: data.seats,
    });
  }

  return layoutResponse.data;
};

export const updateBusLayout = async (id: string, data: CreateBusLayoutPayload) => {
  // 1. Update metadata
  const response = await apiClient.put<BusLayout>(`/bus-layouts/${id}`, data.config);

  // 2. Update seats
  if (data.seats) {
    await apiClient.put(`/bus-layouts/${id}/seats`, {
      seats: data.seats,
    });
  }

  return response.data;
};

export const deleteBusLayout = async (id: string) => {
  await apiClient.delete(`/bus-layouts/${id}`);
};
