"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { Icon } from "@iconify/react";

const ProtectedRoute = ({ children, requireAdmin = true }) => {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/admin/login");
      } else if (requireAdmin && !isAdmin) {
        router.push("/");
      }
    }
  }, [user, isAdmin, loading, router, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icon
            icon="solar:loading-bold"
            width={48}
            className="animate-spin text-brand-primary mx-auto mb-4"
          />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (requireAdmin && !isAdmin)) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
