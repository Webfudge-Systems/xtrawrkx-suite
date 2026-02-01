"use client";

import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount and sync on storage events
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem("currentUser");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            // Only set if we have valid user data with required fields
            if (parsed && (parsed.email || parsed.token)) {
              setCurrentUser(parsed);
            } else {
              console.warn("Stored user data is incomplete, but keeping it in localStorage");
            }
          } catch (error) {
            console.error("Error parsing stored user:", error);
            // Don't remove localStorage on parse errors - it might be a temporary issue
            // Only clear if the data is completely invalid JSON
            try {
              // Try to validate it's actually JSON
              JSON.parse(storedUser);
            } catch {
              // Only clear if it's truly invalid JSON
              console.warn("Invalid JSON in localStorage, clearing...");
              localStorage.removeItem("currentUser");
            }
          }
        }
      } catch (error) {
        console.error("Error accessing localStorage:", error);
        // Don't clear on localStorage access errors (might be privacy mode)
      }
      setIsLoading(false);
    };

    // Load on mount
    loadUserFromStorage();

    // Listen for storage changes (e.g., from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === "currentUser") {
        loadUserFromStorage();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = (userData) => {
    setCurrentUser(userData);
    try {
      localStorage.setItem("currentUser", JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    // Clear both currentUser and authToken on logout
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;

    // Define detailed permissions for each module/feature
    const modulePermissions = {
      dashboard: [
        "Super Admin",
        "Admin",
        "Manager",
        "Sales Manager",
        "Sales Representative",
        "Account Manager",
        "Project Manager",
        "Finance Manager",
        "Developer",
        "Read-only User",
      ],
      users: [
        "Super Admin",
        "Admin",
        "Manager",
        "Sales Manager",
        "Project Manager",
      ],
      permissions: ["Super Admin", "Admin"],
      teams: ["Super Admin", "Admin", "Manager", "Sales Manager"],
      leads: [
        "Super Admin",
        "Admin",
        "Manager",
        "Sales Manager",
        "Sales Representative",
        "Account Manager",
        "Project Manager",
        "Finance Manager",
        "Developer",
        "Read-only User",
      ],
      accounts: [
        "Super Admin",
        "Admin",
        "Manager",
        "Sales Manager",
        "Sales Representative",
        "Account Manager",
        "Project Manager",
        "Finance Manager",
        "Developer",
        "Read-only User",
      ],
      projects: [
        "Super Admin",
        "Admin",
        "Manager",
        "Sales Manager",
        "Sales Representative",
        "Account Manager",
        "Project Manager",
        "Finance Manager",
        "Developer",
        "Read-only User",
      ],
      tasks: [
        "Super Admin",
        "Admin",
        "Manager",
        "Sales Manager",
        "Sales Representative",
        "Account Manager",
        "Project Manager",
        "Finance Manager",
        "Developer",
        "Read-only User",
      ],
      reports: [
        "Super Admin",
        "Admin",
        "Manager",
        "Sales Manager",
        "Sales Representative",
        "Account Manager",
        "Project Manager",
        "Finance Manager",
        "Developer",
        "Read-only User",
      ],
      imports: [
        "Super Admin",
        "Admin",
        "Manager",
        "Sales Manager",
        "Finance Manager",
      ],
      auditLogs: ["Super Admin", "Admin"],
      settings: [
        "Super Admin",
        "Admin",
        "Manager",
        "Sales Manager",
        "Project Manager",
        "Finance Manager",
      ],
      profile: [
        "Super Admin",
        "Admin",
        "Manager",
        "Sales Manager",
        "Sales Representative",
        "Account Manager",
        "Project Manager",
        "Finance Manager",
        "Developer",
      ],
    };

    // Get current user's role display name
    const userRoleDisplayName = getRoleDisplayName();

    // Check if user has permission for the requested module
    const allowedRoles = modulePermissions[permission] || [];
    return allowedRoles.includes(userRoleDisplayName);
  };

  const getVisibilityLevel = () => {
    if (!currentUser) return "none";

    const visibilityLevels = {
      super_admin: "organization",
      admin: "organization",
      manager: "team",
      sales_manager: "team",
      project_manager: "team",
      finance: "team",
      sales_rep: "private",
      account_manager: "private",
      developer: "private",
      read_only: "private",
    };

    return visibilityLevels[currentUser.role] || "private";
  };

  const getRoleDisplayName = () => {
    if (!currentUser) return "";

    const roleNames = {
      super_admin: "Super Administrator",
      admin: "Administrator",
      manager: "Manager",
      sales_manager: "Sales Manager",
      sales_rep: "Sales Representative",
      account_manager: "Account Manager",
      project_manager: "Project Manager",
      finance: "Finance Manager",
      developer: "Developer",
      read_only: "Read-only User",
    };

    // Handle direct role names from backend (fallback)
    if (currentUser.role === "Super Admin") {
      return "Super Admin";
    }

    return roleNames[currentUser.role] || currentUser.role;
  };

  const value = {
    currentUser,
    isLoading,
    login,
    logout,
    hasPermission,
    getVisibilityLevel,
    getRoleDisplayName,
    isAuthenticated: !!currentUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
