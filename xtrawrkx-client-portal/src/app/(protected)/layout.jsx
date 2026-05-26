"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth";
import { MainLayout } from "@/components/layout/MainLayout";

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Wait for auth check to complete
    if (status === "loading") {
      return;
    }

    // Redirect unauthenticated users to login — keep website handoff query params
    // (email, from, intent) so /communities?email=…&from=xtrawrkx-website prefills sign-in.
    if (status === "unauthenticated") {
      if (typeof window === "undefined") {
        router.push("/auth");
        return;
      }
      const handoffKeys = ["email", "from", "intent"];
      const next = new URLSearchParams();
      const src = new URL(window.location.href).searchParams;
      for (const key of handoffKeys) {
        const v = src.get(key);
        if (v) {
          next.set(key, v);
        }
      }
      const qs = next.toString();
      router.push(qs ? `/auth?${qs}` : "/auth");
      return;
    }

    if (status === "authenticated" && typeof window !== "undefined") {
      const role = String(
        session?.user?.role || session?.account?.role || session?.role || ""
      ).toUpperCase();
      const pathname = window.location.pathname || "";
      const isRestrictedForMember =
        role !== "ADMIN" &&
        role !== "MANAGER" &&
        role !== "CLIENT" &&
        (pathname.startsWith("/company") || pathname.startsWith("/billing"));
      if (isRestrictedForMember) {
        router.push("/dashboard");
      }
    }
  }, [status, router, session]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-xtrawrkx-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated (redirect is in progress)
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-xtrawrkx-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Render protected content only if authenticated
  return <MainLayout>{children}</MainLayout>;
}
