"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  customerService,
  CreateCustomerData,
} from "@/services/customer.service";

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: customerService.getAll,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.getById(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerData) => customerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("เพิ่มลูกค้าสำเร็จ");
    },
    onError: () => {
      toast.error("เพิ่มลูกค้าไม่สำเร็จ");
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateCustomerData>;
    }) => customerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("อัพเดตลูกค้าสำเร็จ");
    },
    onError: () => {
      toast.error("อัพเดตลูกค้าไม่สำเร็จ");
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("ลบลูกค้าสำเร็จ");
    },
    onError: () => {
      toast.error("ลบลูกค้าไม่สำเร็จ");
    },
  });
}
