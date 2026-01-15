"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, hydrate } = useAuthStore();

  useEffect(() => {
    // Hydrate auth state from cookies
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on role
      if (
        user.role === "OWNER" ||
        user.role === "MANAGER" ||
        user.role === "STAFF"
      ) {
        router.replace("/dashboard");
      } else {
        router.replace("/customer");
      }
    } else {
      // Not authenticated, go to login
      router.replace("/login");
    }
  }, [isAuthenticated, user, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0FFDF] to-[#FFD8DF]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">กำลังโหลด...</p>
      </div>
    </main>
  );
}
