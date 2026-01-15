import api from "./api";
import { Service, PaginatedResponse } from "@/types";

export interface CreateServiceData {
  name: string;
  description?: string;
  category: string;
  durationMinutes: number;
  price: number;
  imageUrl?: string;
  displayOrder?: number;
}

export const serviceService = {
  getAll: async (): Promise<Service[]> => {
    const response = await api.get<PaginatedResponse<Service>>("/services");
    return response.data.data;
  },

  getById: async (id: string): Promise<Service> => {
    const response = await api.get<Service>(`/services/${id}`);
    return response.data;
  },

  create: async (data: CreateServiceData): Promise<Service> => {
    const response = await api.post<Service>("/services", data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateServiceData>
  ): Promise<Service> => {
    const response = await api.put<Service>(`/services/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/services/${id}`);
  },
};
