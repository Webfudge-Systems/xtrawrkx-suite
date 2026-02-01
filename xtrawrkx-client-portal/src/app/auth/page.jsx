"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useAuth, useSession } from "@/lib/auth";
import { SignInForm, SignUpForm, ForgotPasswordForm } from "@/components/auth";
import { clientSignup, verifyOTP } from "@/lib/api/authService";

// OTP Verification Component
function OTPVerificationForm({ tempOTP, onVerify, onBack, email }) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await onVerify(otp);
    } catch (error) {
      console.error("OTP verification failed:", error);
      setError(error.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    setOtp(value);
    if (error) setError(""); // Clear error when user starts typing
  };

  return (
    <div className="w-full">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-md">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900">Verify Account</h3>
            <p className="text-base text-gray-600 mt-2">
              Enter the verification code to complete your registration
            </p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          {tempOTP ? (
            <>
              <p className="text-sm text-blue-800 mb-2">
                <strong>Development Mode:</strong> Use the code below to proceed
              </p>
              <p className="text-lg font-mono font-bold text-blue-900 bg-blue-100 px-3 py-2 rounded-lg inline-block">
                {tempOTP}
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Email service not configured. Code shown for testing.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-blue-800 mb-2">
                <strong>Verification Code:</strong> Check your email for the
                verification code
              </p>
              <p className="text-xs text-blue-700">
                The code was sent to <strong>{email || "your email"}</strong>
              </p>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="otp"
              className="block text-base font-medium text-gray-700 mb-2"
            >
              Enter Verification Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={handleOtpChange}
              className={`block w-full rounded-lg border shadow-sm px-4 py-3.5 text-lg font-mono text-center tracking-widest text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200 ${
                error
                  ? "border-red-300 text-red-900"
                  : otp.length === 4
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300"
              }`}
              placeholder="1234"
              maxLength="4"
              required
            />
            {otp.length === 4 && !error && (
              <div className="mt-2 flex items-center text-sm text-green-600">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Code ready! Click to verify.
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center w-full rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting...
                </div>
              ) : (
                "Submit"
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center w-full rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-8 py-4 text-lg"
            >
              Back to Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [activeForm, setActiveForm] = useState("signin");
  const [otpStep, setOtpStep] = useState(false);
  const [otpData, setOtpData] = useState({
    email: "",
    phone: "",
    name: "",
    tempOTP: "",
  });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const router = useRouter();
  const { signIn, checkAuth } = useAuth();
  const { data: session, status } = useSession();

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "authenticated" && session?.user) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const testimonials = [
    {
      name: "Jeremy Winson",
      role: "Founder",
      company: "Elite",
      companyCode: "ELI",
      avatar: "JW",
      quote:
        "Authentication made simple. The OTP system works flawlessly and keeps our accounts secure.",
      bgColor: "from-orange-400 to-pink-500",
    },
    {
      name: "Sarah Chen",
      role: "CEO",
      company: "TechFlow",
      companyCode: "TF",
      avatar: "SC",
      quote:
        "Quick and secure login process. Love the seamless experience from signup to dashboard.",
      bgColor: "from-blue-400 to-cyan-500",
    },
    {
      name: "Alex Rodriguez",
      role: "CTO",
      company: "InnovateLab",
      companyCode: "IL",
      avatar: "AR",
      quote:
        "The security features give us confidence in managing our business data.",
      bgColor: "from-emerald-400 to-teal-500",
    },
    {
      name: "Maya Patel",
      role: "Director",
      company: "GreenTech",
      companyCode: "GT",
      avatar: "MP",
      quote:
        "Smooth registration process that gets us started quickly with all the tools we need.",
      bgColor: "from-rose-400 to-pink-500",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleSignIn = async (formData) => {
    try {
      await signIn(formData.email, formData.password);
      router.push("/dashboard");
    } catch (error) {
      console.error("Sign in error:", error);
      alert("Login failed. Please check your credentials.");
    }
  };

  const handleSignUp = async (formData) => {
    try {
      // Call backend signup endpoint with all form data
      const response = await clientSignup(formData);

      if (response.success) {
        // Show OTP verification step
        // If OTP is returned in response (dev mode or email failed), use it
        const otpCode = response.otp || "";
        setOtpData({
          email: formData.email,
          phone: formData.phone,
          name: formData.name || "",
          tempOTP: otpCode, // OTP from email or dev mode
        });
        setOtpStep(true);
      } else {
        throw new Error(response.message || "Sign up failed");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      alert(error.message || "Sign up failed. Please try again.");
    }
  };

  const handleOTPVerification = async (otp) => {
    try {
      const response = await verifyOTP(otpData.email, otp);

      if (response.success && response.token) {
        await checkAuth();
        window.location.href = "/dashboard";
      } else {
        throw new Error(response.message || "Verification failed");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      throw error;
    }
  };

  const handleBackToSignUp = () => {
    setOtpStep(false);
    setOtpData({ email: "", phone: "", name: "", tempOTP: "" });
  };

  const handleForgotPassword = async (formData) => {
    // TODO: Implement forgot password logic with backend
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4A74] mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, don't show auth page (redirect is handled in useEffect)
  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4A74] mx-auto mb-4"></div>
          <p className="text-white">Redirecting...</p>
        </div>
      </div>
    );
  }

  // If in OTP step, show OTP verification form with split layout
  if (otpStep) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden">
        <div className="min-h-screen flex relative">
          {/* Left side - Welcome Section - Fixed */}
          <motion.div
            className="hidden lg:flex w-2/5 p-8 lg:p-16 flex-col justify-center overflow-hidden fixed left-0 top-0 rounded-3xl h-[calc(100vh-3rem)] m-4 lg:m-6 z-10"
            style={{
              backgroundImage: "url('/images/download (10).png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <div className="relative z-10">
              {/* Logo/Icon */}
              <div className="mb-12">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border border-white/30">
                  <span className="text-white font-bold text-2xl">X</span>
                </div>
              </div>

              {/* Main heading */}
              <div className="mb-16">
                <h1 className="text-5xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                  Almost there!
                </h1>
                <p className="text-white/90 text-xl leading-relaxed max-w-md drop-shadow-md">
                  Just one more step to complete your registration and get
                  started.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right side - OTP Form - Scrollable */}
          <motion.div
            className="w-full lg:w-3/5 bg-white p-4 sm:p-6 lg:p-8 space-y-6 ml-0 lg:ml-[40%] min-h-screen overflow-y-auto flex items-center justify-center"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="max-w-md lg:max-w-2xl w-full px-2 sm:px-4">
              <OTPVerificationForm
                tempOTP={otpData.tempOTP}
                onVerify={handleOTPVerification}
                onBack={handleBackToSignUp}
                email={otpData.email}
              />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Split Layout */}
      <div className="min-h-screen flex relative">
        {/* Left side - Welcome Section - Fixed */}
        <motion.div
          className="hidden lg:flex w-2/5 p-8 lg:p-16 flex-col justify-center overflow-hidden fixed left-0 top-0 rounded-3xl h-[calc(100vh-2rem)] m-4 z-10"
          style={{
            backgroundImage: "url('/images/download (10).png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <div className="relative z-10">
            {/* Logo/Icon */}
            <div className="mb-12">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border border-white/30">
                <span className="text-white font-bold text-2xl">X</span>
              </div>
            </div>

            {/* Main heading */}
            <div className="mb-16">
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  Xtrawrkx
                </span>
                .
              </h1>
              <p className="text-white/90 text-xl leading-relaxed max-w-md drop-shadow-md">
                Sign in to access your projects and collaborate with your team.
              </p>
            </div>

            {/* Notification-style Testimonial Slider */}
            <div className="relative max-w-lg">
              <div className="h-48 overflow-hidden">
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={index}
                    className="absolute inset-0"
                    initial={{ y: 150, opacity: 0 }}
                    animate={{
                      y:
                        index === currentTestimonial
                          ? 0
                          : index > currentTestimonial
                          ? 150
                          : -150,
                      opacity: index === currentTestimonial ? 1 : 0,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: "easeInOut",
                    }}
                  >
                    {/* Glass Notification Card */}
                    <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/40 ring-1 ring-white/20">
                      <div className="flex items-start space-x-5">
                        {/* App Icon */}
                        <div className="w-16 h-16 bg-white/65 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/50">
                          <span className="text-primary-600 font-bold text-2xl">
                            X
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white text-lg drop-shadow-md">
                              Xtrawrkx
                            </h4>
                            <span className="text-sm text-white/70">
                              1 min ago
                            </span>
                          </div>
                          <p className="text-sm text-white/80 font-medium mb-3">
                            Success Alert
                          </p>
                          <p className="text-sm text-white/90 leading-relaxed">
                            {testimonial.quote}
                          </p>
                        </div>

                        {/* Heart Icon */}
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center border border-red-300/30">
                            <span className="text-white text-sm">
                              <Icon icon="mdi:heart" className="text-red-500" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Glass dot indicators */}
              <div className="flex justify-center space-x-3 mt-12">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/30 ${
                      index === currentTestimonial
                        ? "bg-white w-8 shadow-lg"
                        : "bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right side - Forms - Scrollable */}
        <motion.div
          className="w-full lg:w-3/5 bg-white p-4 sm:p-6 lg:p-8 space-y-6 ml-0 lg:ml-[40%] min-h-screen overflow-y-auto flex items-center justify-center"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="max-w-md lg:max-w-2xl w-full px-2 sm:px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeForm}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  duration: 0.4,
                  ease: "easeInOut",
                }}
              >
                {activeForm === "signin" && (
                  <SignInForm
                    onForgotPassword={() => setActiveForm("forgot-password")}
                    onSignUp={() => setActiveForm("signup")}
                    onSubmit={handleSignIn}
                  />
                )}

                {activeForm === "signup" && (
                  <SignUpForm
                    onSignIn={() => setActiveForm("signin")}
                    onSubmit={handleSignUp}
                  />
                )}

                {activeForm === "forgot-password" && (
                  <ForgotPasswordForm
                    onSignIn={() => setActiveForm("signin")}
                    onSubmit={handleForgotPassword}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
