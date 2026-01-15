import api from "./api";
import { Booking, PaginatedResponse } from "@/types";

export interface CreateBookingData {
  customerId: string;
  staffId: string;
  startTime: string;
  services: { serviceId: string }[];
  notes?: string;
}

export interface GetBookingsParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  staffId?: string;
  status?: string;
}

export const bookingService = {
  getAll: async (params?: GetBookingsParams): Promise<Booking[]> => {
    const response = await api.get<PaginatedResponse<Booking>>("/bookings", {
      params,
    });
    return response.data.data;
  },

  getById: async (id: string): Promise<Booking> => {
    const response = await api.get<Booking>(`/bookings/${id}`);
    return response.data;
  },

  create: async (data: CreateBookingData): Promise<Booking> => {
    const response = await api.post<Booking>("/bookings", data);
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<Booking> => {
    const response = await api.put<Booking>(`/bookings/${id}/status`, {
      status,
    });
    return response.data;
  },

  cancel: async (id: string): Promise<void> => {
    await api.delete(`/bookings/${id}`);
  },
};
