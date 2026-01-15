import api from "./api";
import { Tenant } from "@/types";

export interface UpdateTenantData {
  name?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}

export interface UpdatePaymentSettingsData {
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  lineUserId?: string;
}

export interface CreateSubscriptionData {
  plan: "BASIC" | "PROFESSIONAL" | "ENTERPRISE";
  paymentMethod?: "PROMPTPAY" | "QR_CODE" | "CREDIT_CARD" | "BANK_TRANSFER";
}

export interface SubscriptionCheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

export const tenantService = {
  // Get current tenant
  getCurrent: async (): Promise<Tenant> => {
    const response = await api.get<Tenant>("/tenant");
    return response.data;
  },

  // Update tenant details
  update: async (data: UpdateTenantData): Promise<Tenant> => {
    const response = await api.put<Tenant>("/tenant", data);
    return response.data;
  },

  // Update payment settings
  updatePaymentSettings: async (
    data: UpdatePaymentSettingsData
  ): Promise<Tenant> => {
    const response = await api.put<Tenant>("/tenant/payment-settings", data);
    return response.data;
  },

  // Update subscription (admin only - for testing)
  updateSubscription: async (plan: string): Promise<Tenant> => {
    const response = await api.put<Tenant>("/tenant/subscription", { plan });
    return response.data;
  },

  // Create subscription checkout session (Stripe)
  createSubscription: async (
    data: CreateSubscriptionData
  ): Promise<SubscriptionCheckoutResponse> => {
    const response = await api.post<SubscriptionCheckoutResponse>(
      "/payments/subscription",
      {
        plan: data.plan,
        paymentMethod: data.paymentMethod || "CREDIT_CARD",
      }
    );
    return response.data;
  },

  // Verify subscription payment
  verifySubscriptionPayment: async (referenceNo: string): Promise<any> => {
    const response = await api.post(
      `/payments/subscription/${referenceNo}/verify`
    );
    return response.data;
  },
};
