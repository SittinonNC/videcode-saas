import api from "./api";
import { Tenant, BankInfo } from "@/types";

export interface UpdatePaymentSettingsData {
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  lineUserId?: string;
}

export interface VerifySlipResponse {
  success: boolean;
  paymentId?: string;
  amount?: number;
  error?: string;
}

export const paymentService = {
  // Get tenant payment settings
  getTenant: async (): Promise<Tenant> => {
    const response = await api.get<Tenant>("/tenant");
    return response.data;
  },

  // Update payment settings
  updatePaymentSettings: async (
    data: UpdatePaymentSettingsData
  ): Promise<Tenant> => {
    const response = await api.put<Tenant>("/tenant/payment-settings", data);
    return response.data;
  },

  // Get bank info for payment (public)
  getBankInfo: async (bookingId: string): Promise<BankInfo> => {
    const response = await api.get<BankInfo>(
      `/payments/booking/${bookingId}/bank-info`
    );
    return response.data;
  },

  // Upload and verify slip (public)
  verifySlip: async (
    bookingId: string,
    slipImage: File
  ): Promise<VerifySlipResponse> => {
    const formData = new FormData();
    formData.append("slipImage", slipImage);

    const response = await api.post<VerifySlipResponse>(
      `/payments/booking/${bookingId}/verify-slip`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },
};
