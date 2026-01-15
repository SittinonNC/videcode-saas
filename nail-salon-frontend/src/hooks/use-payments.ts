"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { paymentService } from "@/services/payment.service";

export {
  useTenant,
  useSubscription,
  useUpdatePaymentSettings,
  useCreateSubscription,
  useUpdateTenant,
} from "@/hooks/use-tenant";

export function useBankInfo(bookingId: string) {
  return useQuery({
    queryKey: ["bank-info", bookingId],
    queryFn: () => paymentService.getBankInfo(bookingId),
    enabled: !!bookingId,
  });
}

export function useVerifySlip() {
  return useMutation({
    mutationFn: ({
      bookingId,
      slipImage,
    }: {
      bookingId: string;
      slipImage: File;
    }) => paymentService.verifySlip(bookingId, slipImage),
    onSuccess: () => {
      toast.success("ตรวจสอบสลิปสำเร็จ");
    },
    onError: (error: Error) => {
      toast.error("ตรวจสอบสลิปไม่สำเร็จ", {
        description: error.message,
      });
    },
  });
}
