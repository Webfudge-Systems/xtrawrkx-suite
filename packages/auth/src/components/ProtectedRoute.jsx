"use client";

import { useAuth } from "./AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Protected Route wrapper component
 * Redirects to login if user is not authenticated
 */
export function ProtectedRoute({ 
  children, 
  requiredRole = null,
  redirectTo = "/login"
}) {
  const { isAuthenticated, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push(redirectTo);
      } else if (requiredRole && !hasRole(requiredRole)) {
        router.push("/unauthorized");
      }
    }
  }, [isAuthenticated, loading, requiredRole, hasRole, router, redirectTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return null;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
