import api from "./api";
import { Staff, PaginatedResponse } from "@/types";

export interface CreateStaffData {
  firstName: string;
  lastName: string;
  nickname?: string;
  email?: string;
  phone?: string;
  specialties?: string[];
}

export const staffService = {
  getAll: async (): Promise<Staff[]> => {
    const response = await api.get<PaginatedResponse<Staff>>("/staff");
    return response.data.data;
  },

  getById: async (id: string): Promise<Staff> => {
    const response = await api.get<Staff>(`/staff/${id}`);
    return response.data;
  },

  create: async (data: CreateStaffData): Promise<Staff> => {
    const response = await api.post<Staff>("/staff", data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateStaffData>
  ): Promise<Staff> => {
    const response = await api.put<Staff>(`/staff/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/staff/${id}`);
  },
};
