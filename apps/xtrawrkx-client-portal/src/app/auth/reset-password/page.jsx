"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button, Input, LoginMobileBrandHeader } from "@webfudge/ui";
import { PORTAL_SITE } from "@/lib/site";
import {
  completePasswordReset,
  verifyPasswordResetCode,
} from "@/lib/api/authService";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [oobCode, setOobCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const code = searchParams.get("oobCode") || searchParams.get("oobcode") || "";
    if (!code) {
      setError(
        "This reset link is invalid or incomplete. Request a new link from the sign-in page."
      );
      setVerifying(false);
      return;
    }

    setOobCode(code);
    verifyPasswordResetCode(code)
      .then((verifiedEmail) => {
        setEmail(verifiedEmail);
        setError("");
      })
      .catch((verifyError) => {
        setError(verifyError.message || "This reset link is invalid or has expired.");
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await completePasswordReset(oobCode, password);
      setSuccess(true);
    } catch (submitError) {
      setError(submitError.message || "Unable to reset your password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        <LoginMobileBrandHeader
          brandIconPath={PORTAL_SITE.logoPath}
          brandName={PORTAL_SITE.brandName}
          productName={PORTAL_SITE.name}
        />

        {success ? (
          <>
            <h1 className="text-3xl font-semibold text-brand-dark mb-2">Password updated</h1>
            <p className="text-gray-600 mb-8">
              Your password has been reset. You can sign in on the Client Portal or xtrawrkx
              marketing site with your new password.
            </p>
            <Button
              type="button"
              variant="primary"
              className="w-full"
              onClick={() => router.push("/auth")}
            >
              Back to sign in
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold text-brand-dark mb-2">Choose a new password</h1>
            <p className="text-gray-600 mb-8">
              {email
                ? `Set a new password for ${email}.`
                : "Set a new password for your xtrawrkx account."}
            </p>

            {verifying ? (
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying reset link...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error ? (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                ) : null}

                {error && !email ? (
                  <Link
                    href="/auth?mode=forgot"
                    className="inline-block text-sm font-medium text-brand-primary hover:text-orange-600"
                  >
                    Request a new reset link
                  </Link>
                ) : null}

                {email ? (
                  <>
                    <div>
                      <label
                        htmlFor="new-password"
                        className="block text-sm font-medium text-brand-dark mb-1.5"
                      >
                        New password
                      </label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          autoComplete="new-password"
                          className="w-full pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-dark"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="block text-sm font-medium text-brand-dark mb-1.5"
                      >
                        Confirm password
                      </label>
                      <Input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        className="w-full"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting || !oobCode}
                      className="w-full"
                      variant="primary"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating...
                        </span>
                      ) : (
                        "Update password"
                      )}
                    </Button>
                  </>
                ) : null}
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
      Loading...
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
