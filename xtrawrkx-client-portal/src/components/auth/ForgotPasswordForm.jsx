"use client";

import { useState } from "react";
import AuthCard from "./AuthCard";
import AuthInput from "./AuthInput";
import AuthButton from "./AuthButton";
import AuthToggle from "./AuthToggle";

export default function ForgotPasswordForm({
  onSignIn,
  onSubmit,
  className = "",
}) {
  const [formData, setFormData] = useState({
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

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
    setLoading(true);
    setErrors({});

    // Basic validation
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      if (onSubmit) {
        await onSubmit(formData);
        setSuccess(true);
      } else {
        // Default behavior - just log for now
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
        setSuccess(true);
      }
    } catch (error) {
      setErrors({
        general:
          error.message || "Failed to send reset link. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`w-full max-w-full overflow-hidden ${className}`}>
        <AuthCard
          title="Check Your Email"
          subtitle="We've sent password reset instructions to your email address."
        >
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-success-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <p className="text-neutral-600 text-sm">
                If an account with <strong>{formData.email}</strong> exists,
                you'll receive an email with reset instructions shortly.
              </p>
              <p className="text-neutral-500 text-xs">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>

            <AuthButton onClick={() => setSuccess(false)} variant="outline" size="lg">
              Try Different Email
            </AuthButton>

            <AuthToggle
              text="Remembered your password?"
              linkText="Sign In"
              onClick={onSignIn}
              className="mt-4"
            />
          </div>
        </AuthCard>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-full overflow-hidden ${className}`}>
      <AuthCard
        title="Reset Your Password"
        subtitle="Enter your email and we'll send reset instructions"
      >
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 w-full">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errors.general}
            </div>
          )}

          <AuthInput
            type="email"
            name="email"
            label="Email Address"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            required
          />

          <AuthButton type="submit" loading={loading} disabled={loading} size="lg">
            Send Reset Link
          </AuthButton>

          <AuthToggle
            text="Remembered your password?"
            linkText="Back to Login"
            onClick={onSignIn}
            className="mt-4"
          />
        </form>
      </AuthCard>
    </div>
  );
}
