import axios from "axios";
import { Service, Staff, PaginatedResponse } from "@/types";

const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

export interface PublicBookingData {
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail?: string;
  staffId: string;
  startTime: string;
  services: { serviceId: string }[];
  notes?: string;
}

export interface PublicBookingResponse {
  id: string;
  bookingNumber: string;
  totalAmount: number;
  paymentUrl: string;
}

export const publicService = {
  // Get services for a shop (public)
  getServices: async (subdomain: string): Promise<Service[]> => {
    const response = await publicApi.get<PaginatedResponse<Service>>(
      "/services",
      {
        headers: { "X-Tenant-Subdomain": subdomain },
      }
    );
    return response.data.data;
  },

  // Get staff for a shop (public)
  getStaff: async (subdomain: string): Promise<Staff[]> => {
    const response = await publicApi.get<PaginatedResponse<Staff>>("/staff", {
      headers: { "X-Tenant-Subdomain": subdomain },
    });
    return response.data.data;
  },

  // Create booking (public)
  createBooking: async (
    subdomain: string,
    data: PublicBookingData
  ): Promise<PublicBookingResponse> => {
    const response = await publicApi.post<PublicBookingResponse>(
      "/bookings/public",
      data,
      {
        headers: { "X-Tenant-Subdomain": subdomain },
      }
    );
    return response.data;
  },
};
