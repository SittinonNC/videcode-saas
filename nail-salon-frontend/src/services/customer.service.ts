import api from "./api";
import { Customer, PaginatedResponse } from "@/types";

export interface CreateCustomerData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  notes?: string;
}

export const customerService = {
  getAll: async (): Promise<Customer[]> => {
    const response = await api.get<PaginatedResponse<Customer>>("/customers");
    return response.data.data;
  },

  getById: async (id: string): Promise<Customer> => {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  create: async (data: CreateCustomerData): Promise<Customer> => {
    const response = await api.post<Customer>("/customers", data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateCustomerData>
  ): Promise<Customer> => {
    const response = await api.put<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },
};
