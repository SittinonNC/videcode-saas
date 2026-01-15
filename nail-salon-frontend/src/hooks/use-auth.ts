"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService, AuthResponse } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { LoginFormData, RegisterFormData } from "@/schemas/auth.schema";

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (data: LoginFormData) => authService.login(data),
    onSuccess: (response: AuthResponse) => {
      setAuth(response.accessToken, response.user);
      toast.success("เข้าสู่ระบบสำเร็จ");

      // Role-based redirect
      const role = response.user.role;
      if (role === "OWNER" || role === "MANAGER" || role === "STAFF") {
        router.push("/dashboard");
      } else {
        router.push("/customer");
      }
    },
    onError: (error: Error) => {
      toast.error("เข้าสู่ระบบไม่สำเร็จ", {
        description: error.message || "กรุณาตรวจสอบอีเมลและรหัสผ่าน",
      });
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterFormData) => authService.register(data),
    onSuccess: () => {
      toast.success("สร้างร้านสำเร็จ", {
        description: "กรุณาเข้าสู่ระบบ",
      });
      router.push("/login");
    },
    onError: (error: Error) => {
      toast.error("สร้างร้านไม่สำเร็จ", {
        description: error.message,
      });
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  return () => {
    logout();
    toast.success("ออกจากระบบสำเร็จ");
    router.push("/login");
  };
}
