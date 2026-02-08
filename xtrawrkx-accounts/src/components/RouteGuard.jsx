"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, Lock } from "lucide-react";
import PermissionsService from "../lib/permissionsService";

/**
 * RouteGuard Component
 * Protects routes based on user roles and authentication status
 */
export default function RouteGuard({
  children,
  requiredRole = null,
  requiredLevel = null,
  fallbackRoute = "/auth/login",
  showAccessDenied = true,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    checkAccess();
  }, [pathname, requiredRole, requiredLevel]);

  const checkAccess = () => {
    setIsChecking(true);

    try {
      // Get current user from localStorage
      const userData = localStorage.getItem("currentUser");

      if (!userData) {
        router.push(fallbackRoute);
        return;
      }

      const user = JSON.parse(userData);
      setCurrentUser(user);

      // Check if user is authenticated
      if (!user || !user.role) {
        router.push(fallbackRoute);
        return;
      }

      // Check role-based access
      if (requiredRole) {
        if (user.role !== requiredRole) {
          setHasAccess(false);
          setIsChecking(false);
          return;
        }
      }

      // Check level-based access (rank-based: lower number = higher authority)
      // Support custom roles by using primaryRole object if available
      if (requiredLevel) {
        const userRoleOrObject = user.primaryRole || user.role;
        const userRank = PermissionsService.getRoleLevel(userRoleOrObject);
        const requiredRankValue =
          PermissionsService.getRoleLevel(requiredLevel);

        // Deny access if user's rank is HIGHER (numerically greater = lower authority)
        if (userRank > requiredRankValue) {
          setHasAccess(false);
          setIsChecking(false);
          return;
        }
      }

      // Check specific route permissions
      // Use primaryRole object if available (for custom roles)
      const userRoleOrObject = user.primaryRole || user.role;
      if (!checkRoutePermissions(pathname, userRoleOrObject)) {
        setHasAccess(false);
        setIsChecking(false);
        return;
      }

      setHasAccess(true);
      setIsChecking(false);
    } catch (error) {
      console.error("Error checking access:", error);
      router.push(fallbackRoute);
    }
  };

  const checkRoutePermissions = (route, userRoleOrObject) => {
    // Support both role names (string) and role objects with rank property
    const userRank = PermissionsService.getRoleLevel(userRoleOrObject);

    // Rank-based route permissions
    // Ranks 0-5 (Super Admin to Developer) have admin access
    // Rank 0 (Super Admin) only for advanced routes
    
    // Super Admin only routes (rank 0)
    const superAdminRoutes = ["/settings/advanced", "/system"];
    if (superAdminRoutes.some(r => route.startsWith(r))) {
      return userRank === 0;
    }

    // Admin routes (rank <= 5: Super Admin, Admin, Manager, Sales Manager, Project Manager, Developer)
    const adminRoutes = [
      "/users",
      "/users/new", 
      "/users/roles",
      "/organization",
      "/organization/departments",
      "/settings",
      "/settings/general",
      "/settings/notifications",
      "/settings/integrations"
    ];
    if (adminRoutes.some(r => route.startsWith(r))) {
      return userRank <= 5;
    }

    // Public routes (all authenticated users with any rank)
    const publicRoutes = ["/", "/profile", "/activity"];
    if (publicRoutes.some(r => route.startsWith(r))) {
      return true; // All authenticated users can access public routes
    }

    // If no specific route found, allow access (fallback for other routes)
    return true;
  };

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-main">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-8 text-center"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-primary-500 animate-pulse" />
            <span className="text-gray-700 font-medium">
              Checking Access...
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full animate-pulse"
              style={{ width: "60%" }}
            ></div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show access denied page
  if (!hasAccess && showAccessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-main">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 text-center max-w-md mx-4"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>

          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Your current role (
            {currentUser?.role}) doesn't have the required privileges.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => router.back()}
              className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Go Back
            </button>

            <button
              onClick={() => router.push("/")}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Security Notice</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              This access attempt has been logged for security purposes.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render children if access is granted
  if (hasAccess) {
    return children;
  }

  // Fallback: redirect if access denied and no UI shown
  if (!hasAccess && !showAccessDenied) {
    router.push(fallbackRoute);
    return null;
  }

  return null;
}
