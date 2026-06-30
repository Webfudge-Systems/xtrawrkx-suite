"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useSearchParams } from "next/navigation";
import Button from "@/src/components/common/Button";
import { publicUserService } from "@/src/services/publicUserService";

export default function ResetPasswordClient() {
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
      setError("This reset link is invalid or incomplete. Request a new link from the sign-in page.");
      setVerifying(false);
      return;
    }

    setOobCode(code);
    publicUserService
      .verifyPasswordResetCode(code)
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
      await publicUserService.completePasswordReset(oobCode, password);
      setSuccess(true);
    } catch (submitError) {
      setError(submitError.message || "Unable to reset your password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-12">
        <Link href="/" className="mb-10 inline-flex items-center gap-3">
          <Image
            src="/logo/xtrawrkx_logo_full.png"
            alt="xtrawrkx"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="text-sm font-semibold text-slate-900">xtrawrkx</span>
        </Link>

        {success ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-8">
            <h1 className="text-3xl font-semibold text-slate-900">Password updated</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your password has been reset. You can sign in on the marketing site or Client Portal
              with your new password.
            </p>
            <Link href="/auth?mode=login" className="mt-8 inline-block">
              <Button text="Back to sign in" type="primary" className="justify-center" />
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-semibold text-slate-900">Choose a new password</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {email
                ? `Set a new password for ${email}.`
                : "Set a new password for your xtrawrkx account."}
            </p>

            {verifying ? (
              <div className="mt-8 flex items-center gap-3 text-sm text-slate-500">
                <Icon icon="solar:loading-bold" className="animate-spin" width={18} />
                Verifying reset link...
              </div>
            ) : (
              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                {error && !email ? (
                  <Link href="/auth?mode=forgot" className="inline-block text-sm font-medium text-brand-primary">
                    Request a new reset link
                  </Link>
                ) : email ? (
                  <>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">New password</span>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className="input pr-12"
                          placeholder="At least 6 characters"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                          onClick={() => setShowPassword((current) => !current)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          <Icon icon={showPassword ? "solar:eye-closed-linear" : "solar:eye-linear"} width={20} />
                        </button>
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Confirm password</span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className="input"
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                      />
                    </label>

                    <Button
                      text="Update password"
                      type="primary"
                      className="w-full justify-center"
                      hideArrow={submitting}
                      disabled={submitting || !oobCode}
                      htmlType="submit"
                      icon={submitting ? "solar:loading-bold" : undefined}
                    />
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
