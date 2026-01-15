"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { serviceService, CreateServiceData } from "@/services/service.service";

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: serviceService.getAll,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceData) => serviceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("เพิ่มบริการสำเร็จ");
    },
    onError: () => {
      toast.error("เพิ่มบริการไม่สำเร็จ");
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateServiceData>;
    }) => serviceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("อัพเดตบริการสำเร็จ");
    },
    onError: () => {
      toast.error("อัพเดตบริการไม่สำเร็จ");
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => serviceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("ลบบริการสำเร็จ");
    },
    onError: () => {
      toast.error("ลบบริการไม่สำเร็จ");
    },
  });
}
