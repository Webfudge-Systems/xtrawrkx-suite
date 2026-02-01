"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../lib/authService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state on mount (matches CRM exactly)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const token = authService.getToken();

        // Check if there's a cookie but no localStorage token (stale cookie scenario)
        // This happens when cookie exists but localStorage was cleared
        if (!token && typeof document !== "undefined") {
          const cookies = document.cookie.split(";");
          const hasAuthCookie = cookies.some((cookie) =>
            cookie.trim().startsWith("xtrawrkx-authToken=")
          );

          if (hasAuthCookie) {
            // Cookie exists but no localStorage token - clear the stale cookie
            authService.logout();
            setUser(null);
            setIsAuthenticated(false);
            setLoading(false);
            return;
          }
        }

        if (token) {
          // Verify token by getting current user
          try {
            const userData = await authService.getCurrentUser();
            if (userData) {
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              // Token is invalid, clear it
              authService.logout();
              setUser(null);
              setIsAuthenticated(false);
            }
          } catch (apiError) {
            console.error("Token verification failed:", apiError);
            // If API call fails, assume token is invalid
            authService.logout();
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // No token found, user is not authenticated
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    // Don't set loading state here - let the page handle its own loading state
    // This prevents the full-screen loader from covering error messages
    try {
      const response = await authService.login(email, password);

      if (response.user && response.token) {
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true, user: response.user };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Login error in AuthContext:", error);
      console.error("Error message:", error.message);
      console.error("Error object:", error);
      setUser(null);
      setIsAuthenticated(false);

      // Extract error message properly
      let errorMessage = "Login failed. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }

      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (module, action) => {
    if (!user) return false;
    return authService.hasPermission(module, action);
  };

  const hasRole = (roleName) => {
    if (!user) return false;
    return authService.hasRole(roleName);
  };

  const isAdmin = () => {
    if (!user) return false;
    return authService.isAdmin();
  };

  const value = {
    user,
    setUser,
    isAuthenticated,
    loading,
    login,
    logout,
    hasPermission,
    hasRole,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
