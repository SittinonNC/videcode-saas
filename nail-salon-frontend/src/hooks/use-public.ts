"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { publicService, PublicBookingData } from "@/services/public.service";

export function usePublicServices(subdomain: string) {
  return useQuery({
    queryKey: ["public-services", subdomain],
    queryFn: () => publicService.getServices(subdomain),
    enabled: !!subdomain,
  });
}

export function usePublicStaff(subdomain: string) {
  return useQuery({
    queryKey: ["public-staff", subdomain],
    queryFn: () => publicService.getStaff(subdomain),
    enabled: !!subdomain,
  });
}

export function usePublicBooking(subdomain: string) {
  return useMutation({
    mutationFn: (data: PublicBookingData) =>
      publicService.createBooking(subdomain, data),
  });
}
