"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { usePublicAuth } from "@/src/contexts/PublicAuthContext";

export default function PublicProtectedRoute({ children }) {
  const router = useRouter();
  const { loading, isAuthenticated } = usePublicAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth?mode=login&redirect=%2Fprofile");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Icon
            icon="solar:loading-bold"
            width={42}
            className="mx-auto animate-spin text-brand-primary"
          />
          <p className="mt-4 text-sm text-slate-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
