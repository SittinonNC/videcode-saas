"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  bookingService,
  CreateBookingData,
  GetBookingsParams,
} from "@/services/booking.service";
import { Booking } from "@/types";

export function useBookings(params?: GetBookingsParams) {
  return useQuery<Booking[]>({
    queryKey: ["bookings", params],
    queryFn: () => bookingService.getAll(params),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: () => bookingService.getById(id),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBookingData) => bookingService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("สร้างการจองสำเร็จ");
    },
    onError: () => {
      toast.error("สร้างการจองไม่สำเร็จ");
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      bookingService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("อัพเดตสถานะสำเร็จ");
    },
    onError: () => {
      toast.error("อัพเดตสถานะไม่สำเร็จ");
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bookingService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("ยกเลิกการจองสำเร็จ");
    },
    onError: () => {
      toast.error("ยกเลิกการจองไม่สำเร็จ");
    },
  });
}
