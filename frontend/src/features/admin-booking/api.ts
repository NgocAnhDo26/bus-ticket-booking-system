import { apiClient } from '@/lib/api-client';

import { type AdminBookingFilters, type BookingResponse } from './types';

interface AdminBookingApiResponse {
    content?: BookingResponse[];
    totalPages?: number;
    total_pages?: number;
    totalElements?: number;
    total_elements?: number;
    page?: {
        totalPages?: number;
        total_pages?: number;
        totalElements?: number;
        total_elements?: number;
    };
}

export const getAdminBookings = async (
    params: AdminBookingFilters & { page: number; size: number },
): Promise<{
    content: BookingResponse[];
    totalPages: number;
    totalElements: number;
}> => {
    const response = await apiClient.get<AdminBookingApiResponse>('/api/bookings/admin', {
        params,
    });
    const data = response.data;
    return {
        content: data.content || [],
        totalPages:
            data.totalPages ?? data.total_pages ?? data.page?.totalPages ?? data.page?.total_pages ?? 0,
        totalElements:
            data.totalElements ??
            data.total_elements ??
            data.page?.totalElements ??
            data.page?.total_elements ??
            0,
    };
};

export const refundBooking = async (id: string): Promise<BookingResponse> => {
    const response = await apiClient.post<BookingResponse>(`/api/bookings/${id}/refund`);
    return response.data;
};
