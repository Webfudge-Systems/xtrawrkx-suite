"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { toastUtils } from "@/src/utils/toast";
import Image from "next/image";
import { Icon } from "@iconify/react";

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const { signIn, user, isStrapiAvailable, loading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user?.isAdmin) {
      router.push("/admin/dashboard");
    }
  }, [user, loading, router]);

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
    // Clear login error when user starts typing
    if (loginError) {
      setLoginError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (!isStrapiAvailable) {
      const errorMessage =
        "Strapi backend is not available. Please check your configuration and try again.";
      setLoginError(errorMessage);
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(formData.email, formData.password);
      toastUtils.success("Successfully logged in! Welcome back.");
      router.push("/admin/dashboard");
    } catch (error) {
      let errorMessage = "Login failed. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }

      setLoginError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state during initial auth check
  if (loading && !isSubmitting) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Full Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-300 via-pink-400 to-pink-600">
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-200/30 via-pink-300/20 to-pink-500/30"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-orange-400/20 via-pink-400/15 to-pink-600/25"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="flex items-center space-x-3 bg-white px-6 py-4 rounded-2xl shadow-lg border border-gray-100">
            <Icon
              icon="solar:refresh-bold"
              className="w-6 h-6 animate-spin text-pink-600"
            />
            <span className="text-gray-900 font-medium">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
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
            <div className="w-20 h-20 mr-4 relative">
              <Image
                src="/logo_full.png"
                alt="Xtrawrkx Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-lg">
            <h1 className="text-6xl font-bold text-white mb-8 leading-tight">
              Hey, Hello!
            </h1>
            <h2 className="text-2xl text-white/90 mb-8 font-medium">
              Welcome to Xtrawrkx Admin Portal
            </h2>
            <p className="text-white/80 text-xl leading-relaxed">
              We provide all the advantages that can simplify all your
              business operations and content management without any further
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
                        <Icon
                          icon="solar:danger-circle-bold"
                          className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
                        />
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

                    {/* Email Field */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Icon
                            icon="solar:letter-bold"
                            className="h-5 w-5 text-gray-400"
                          />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`block w-full pl-12 pr-4 py-3 text-base border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF4A74] focus:border-[#FF4A74] transition-all duration-200 text-gray-900 ${
                            errors.email
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          placeholder="Enter your username"
                          disabled={isSubmitting || !isStrapiAvailable}
                        />
                      </div>
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
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Icon
                            icon="solar:lock-keyhole-bold"
                            className="h-5 w-5 text-gray-400"
                          />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`block w-full pl-12 pr-12 py-3 text-base border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF4A74] focus:border-[#FF4A74] transition-all duration-200 text-gray-900 ${
                            errors.password
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          placeholder="Enter your password"
                          disabled={isSubmitting || !isStrapiAvailable}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isSubmitting || !isStrapiAvailable}
                        >
                          {showPassword ? (
                            <Icon
                              icon="solar:eye-closed-bold"
                              className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                            />
                          ) : (
                            <Icon
                              icon="solar:eye-bold"
                              className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                            />
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
                        disabled={isSubmitting || !isStrapiAvailable}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-[#FF4A74] hover:bg-[#FF4A74]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center space-x-2">
                            <Icon
                              icon="solar:refresh-bold"
                              className="w-5 h-5 animate-spin"
                            />
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
                    Don't have an account? Contact your administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
