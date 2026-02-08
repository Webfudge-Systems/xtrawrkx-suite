"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  AlertCircle,
  Loader2,
  Building,
  Users,
  Globe,
} from "lucide-react";
import { useUser } from "../../components/UserContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (error) setError("");
  };

  // Safe error setter that ensures error is always a string
  const setSafeError = (errorValue) => {

    if (!errorValue) {
      setError("");
      return;
    }

    let errorString = "";
    if (typeof errorValue === "string") {
      errorString = errorValue;
    } else if (errorValue.message) {
      errorString = errorValue.message;
    } else if (errorValue.error) {
      if (typeof errorValue.error === "string") {
        errorString = errorValue.error;
      } else if (errorValue.error.message) {
        errorString = errorValue.error.message;
      }
    } else {
      errorString = "An unexpected error occurred";
    }

    setError(String(errorString));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Call our Strapi backend API
      // Prefer explicit NEXT_PUBLIC_STRAPI_URL. If not set, use localhost in development,
      // otherwise fall back to production URL.
      const backendUrl =
        process.env.NEXT_PUBLIC_STRAPI_URL ||
        (process.env.NODE_ENV === "development"
          ? "http://localhost:1337"
          : "https://xtrawrkxsuits-production.up.railway.app");
      const response = await fetch(`${backendUrl}/api/auth/internal/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        // Handle non-200 responses
        let errorMessage = "Login failed. Please try again.";
        try {
          const errorData = await response.json();
          // Handle Strapi error structure
          if (errorData.error) {
            if (typeof errorData.error === "string") {
              errorMessage = errorData.error;
            } else if (errorData.error.message) {
              errorMessage = errorData.error.message;
            } else if (errorData.error.name) {
              errorMessage = errorData.error.name;
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        setError(String(errorMessage));
        return;
      }

      const data = await response.json();

      // Ensure we have the expected data structure
      if (!data || !data.user) {
        setSafeError("Invalid response from server. Please try again.");
        return;
      }

      // Map backend roles to frontend roles
      const roleMapping = {
        ADMIN: "Admin",
        admin: "Admin",
        SUPER_ADMIN: "Super Admin",
        super_admin: "Super Admin",
        "Super Admin": "Super Admin", // New role from user-role content type
        Admin: "Admin", // New role from user-role content type
        MANAGER: "Manager",
        Manager: "Manager", // Handle "Manager" role properly
        PROJECT_MANAGER: "Project Manager",
        "Project Manager": "Project Manager",
        DEVELOPER: "Developer",
        Developer: "Developer",
        SALES_REP: "Sales Representative",
        "Sales Representative": "Sales Representative",
        SALES_MANAGER: "Sales Manager",
        "Sales Manager": "Sales Manager",
        "Account Manager": "Account Manager",
        "Finance Manager": "Finance Manager",
        "Read-only User": "Read-only User",
        READ_ONLY: "Read-only User",
      };

      const mappedRole = roleMapping[data.user.role] || "Read-only User";

      // Store user info and token using AuthService
      const AuthService = (await import("@/lib/authService")).default;

      // Import PermissionsService to check role rank
      const PermissionsService = (await import("@/lib/permissionsService")).default;
      
      // Check if user has admin access based on rank (rank <= 5 = full permissions)
      // Ranks 0-5: Super Admin, Admin, Manager, Sales Manager, Project Manager, Developer
      // Support custom roles by checking primaryRole object if available
      const primaryRole = data.user.primaryRole;
      const roleRank = primaryRole ? PermissionsService.getRoleLevel(primaryRole) : PermissionsService.getRoleLevel(mappedRole);
      const hasAdminAccess = roleRank <= 5;

      const userData = {
        email: data.user.email || formData.email,
        firstName: data.user.firstName || "",
        lastName: data.user.lastName || "",
        role: mappedRole,
        primaryRole: primaryRole, // Include primaryRole object for custom roles
        department: data.user.department || "",
        name:
          data.user.name ||
          `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim() ||
          data.user.email,
        permissions: hasAdminAccess ? "full" : "limited",
        loginTime: new Date().toISOString(),
        token: data.token,
      };

      // Store using AuthService (stores in 'currentUser' key)
      AuthService.setUserData(userData);

      // Also store in context for backward compatibility
      login(userData);

      // Keep authToken for backward compatibility (will be migrated on next getToken call)
      localStorage.setItem("authToken", data.token);

      // Redirect to dashboard
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      // Ensure error message is a string, not an object
      let errorMessage = "Unable to connect to server. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error.toString && typeof error.toString === "function") {
        errorMessage = error.toString();
      }

      setSafeError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: "Secure Access",
      description: "Your account is protected with enterprise-grade security",
    },
    {
      icon: Users,
      title: "Centralized Control",
      description: "Manage everything from a single, unified dashboard",
    },
    {
      icon: Building,
      title: "Always Available",
      description: "Access your admin panel anytime, anywhere",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-main flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400" />
        <div className="absolute inset-0 bg-black/20" />

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-40 right-20 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/15 rounded-full blur-lg" />

        <div className="relative z-10 flex flex-col justify-center px-16 py-20">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Xtrawrkx</h1>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Welcome Back</h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Access your secure admin portal and take control of your
              organization's operations from one powerful platform.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-white/80 text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 grid grid-cols-3 gap-6"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-white/80 text-sm">Access</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-white/80 text-sm">Secure</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">Fast</div>
              <div className="text-white/80 text-sm">Login</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Xtrawrkx</h1>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="glass-card rounded-2xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
              <p className="text-gray-600">
                Enter your credentials to access the admin panel
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700 text-sm">
                  {typeof error === "string" ? error : "An error occurred"}
                </p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="w-full pl-10 pr-12 py-3 glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Remember me</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
