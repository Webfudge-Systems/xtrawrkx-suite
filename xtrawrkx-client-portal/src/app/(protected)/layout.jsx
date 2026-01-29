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

    // Redirect unauthenticated users to login
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }
  }, [status, router]);

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
