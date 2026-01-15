import api from "./api";
import { LoginFormData, RegisterFormData } from "@/schemas/auth.schema";

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "OWNER" | "MANAGER" | "STAFF" | "CUSTOMER";
    tenantId: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  tenant: {
    id: string;
    subdomain: string;
  };
  owner: {
    id: string;
    email: string;
  };
}

export const authService = {
  login: async (data: LoginFormData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  register: async (data: RegisterFormData): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>(
      "/auth/register-tenant",
      data
    );
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};
