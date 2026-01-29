"use client";

import { useState, useEffect } from "react";
import SEO from "../../components/SEO";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated (like CRM)
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(formData.email, formData.password);


      if (result.success) {
        // Force immediate redirect after successful login
        // Small delay to ensure localStorage is saved
        setTimeout(() => {
          window.location.href = "/";
        }, 100);
      } else {
        // Extract error message properly
        let errorMessage = "Login failed. Please try again.";

        if (result.error) {
          if (typeof result.error === "string") {
            errorMessage = result.error;
          } else if (result.error.message) {
            errorMessage = result.error.message;
          } else if (result.error.error?.message) {
            errorMessage = result.error.error.message;
          }
        }

        setLoginError(errorMessage);
        setIsSubmitting(false);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.error("Login error in page:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }

      if (
        errorMessage.includes("CORS") ||
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("Network error")
      ) {
        errorMessage =
          "Cannot connect to the server. Please ensure the backend API is running and CORS is configured correctly.";
      }

      setLoginError(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Only show full-screen loader during initial auth check, not during login attempts
  // Use isSubmitting for login button state instead
  if (loading && !isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Login"
        description="Secure login to Xtrawrkx PM Dashboard. Access your project management system to manage tasks, projects, and team operations."
      />
      <div className="min-h-screen relative overflow-hidden">
        {/* Full Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-300 via-pink-600 to-pink-800">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-200/30 via-pink-300/20 to-pink-500/30"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-orange-400/20 via-pink-400/15 to-pink-600/25"></div>

          {/* Floating Elements */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute top-3/4 right-1/4 w-48 h-48 bg-orange-200/20 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-pink-300/15 rounded-full blur-xl animate-pulse"
            style={{ animationDelay: "4s" }}
          ></div>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex">
          {/* Left Side - Branding Content */}
          <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 py-20">
            {/* Logo */}
            <div className="flex items-center mb-12">
              <div className="w-20 h-20 mr-4">
                <Image
                  src="/logo_full.webp"
                  alt="Xtrawrkx Logo"
                  width={100}
                  height={100}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="max-w-lg">
              <h1 className="text-6xl font-bold text-white mb-8 leading-tight">
                Hey, Hello!
              </h1>
              <h2 className="text-2xl text-white/90 mb-8 font-medium">
                Welcome to Xtrawrkx PM Dashboard
              </h2>
              <p className="text-white/80 text-xl leading-relaxed">
                We provide all the advantages that can simplify all your project
                management operations and team collaboration without any further
                requirements.
              </p>
            </div>
          </div>

          {/* Right Side - Login Form Island */}
          <div className="w-full lg:w-1/2 flex flex-col justify-end py-0 px-0">
            <div className="w-full h-full flex flex-col justify-end">
              {/* Login Form */}
              <div
                className="bg-white shadow-2xl rounded-t-3xl border border-gray-100 overflow-hidden flex flex-col mt-16 mr-16 max-w-xl"
                style={{ height: "calc(100vh - 10rem)" }}
              >
                {/* Header */}
                <div className="text-center py-6 px-6">
                  <h2 className="text-4xl font-semibold text-gray-900">
                    Welcome Back!!
                  </h2>
                </div>

                {/* Form Content */}
                <div className="flex-1 py-8 px-6 flex flex-col justify-between">
                  <div className="flex-1 flex flex-col justify-start">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                      {/* Error Message */}
                      {loginError && loginError.trim() !== "" && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 animate-in fade-in slide-in-from-top-2">
                          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-red-800">
                              Login Failed
                            </h3>
                            <p className="text-sm text-red-700 mt-1">
                              {loginError}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Username Field */}
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Username
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`block w-full px-4 py-3 text-base border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF4A74] focus:border-[#FF4A74] transition-all duration-200 text-gray-900 ${
                            errors.email
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          placeholder="Enter your username"
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Password Field */}
                      <div>
                        <label
                          htmlFor="password"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`block w-full px-4 py-3 text-base border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF4A74] focus:border-[#FF4A74] transition-all duration-200 text-gray-900 ${
                              errors.password
                                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                            )}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.password}
                          </p>
                        )}
                      </div>

                      {/* Submit Button */}
                      <div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-[#FF4A74] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center space-x-2">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Signing in...</span>
                            </div>
                          ) : (
                            "Login"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Footer */}
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">
                      Don&apos;t have an account? Contact your administrator.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
