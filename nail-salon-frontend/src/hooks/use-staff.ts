"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { staffService, CreateStaffData } from "@/services/staff.service";

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: staffService.getAll,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStaffData) => staffService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("เพิ่มพนักงานสำเร็จ");
    },
    onError: () => {
      toast.error("เพิ่มพนักงานไม่สำเร็จ");
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateStaffData>;
    }) => staffService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("อัพเดตพนักงานสำเร็จ");
    },
    onError: () => {
      toast.error("อัพเดตพนักงานไม่สำเร็จ");
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => staffService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("ลบพนักงานสำเร็จ");
    },
    onError: () => {
      toast.error("ลบพนักงานไม่สำเร็จ");
    },
  });
}
