"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  tenantService,
  UpdateTenantData,
  UpdatePaymentSettingsData,
  CreateSubscriptionData,
} from "@/services/tenant.service";
import {
  getPlanLimits,
  canAddStaff,
  canAddService,
  hasFeature,
  SubscriptionPlan,
  PlanLimits,
} from "@/lib/plan-limits";

export function useTenant() {
  return useQuery({
    queryKey: ["tenant"],
    queryFn: tenantService.getCurrent,
  });
}

export function useSubscription() {
  const { data: tenant, isLoading } = useTenant();

  const plan = (tenant?.subscriptionPlan || "TRIAL") as SubscriptionPlan;
  const limits = getPlanLimits(plan);

  return {
    plan,
    limits,
    status: tenant?.subscriptionStatus,
    expiresAt: tenant?.subscriptionEndAt,
    isLoading,
    canAddStaff: (currentCount: number) => canAddStaff(plan, currentCount),
    canAddService: (currentCount: number) => canAddService(plan, currentCount),
    hasFeature: (feature: keyof PlanLimits) => hasFeature(plan, feature),
  };
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTenantData) => tenantService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
      toast.success("อัพเดตข้อมูลร้านสำเร็จ");
    },
    onError: () => {
      toast.error("อัพเดตข้อมูลร้านไม่สำเร็จ");
    },
  });
}

export function useUpdatePaymentSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePaymentSettingsData) =>
      tenantService.updatePaymentSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
      toast.success("อัพเดตข้อมูลการชำระเงินสำเร็จ");
    },
    onError: () => {
      toast.error("อัพเดตข้อมูลการชำระเงินไม่สำเร็จ");
    },
  });
}

export function useCreateSubscription() {
  return useMutation({
    mutationFn: (data: CreateSubscriptionData) =>
      tenantService.createSubscription(data),
    onSuccess: (response) => {
      // Redirect to Stripe checkout
      window.location.href = response.checkoutUrl;
    },
    onError: () => {
      toast.error("ไม่สามารถสร้าง checkout session ได้");
    },
  });
}
