"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import {
  Button,
  Input,
  LoginBrandCorner,
  LoginMobileBrandHeader,
} from "@webfudge/ui";
import { useAuth, useSession } from "@/lib/auth";
import { PORTAL_SITE } from "@/lib/site";

function readWebsiteHandoff() {
  if (typeof window === "undefined") return false;
  try {
    const p = new URLSearchParams(window.location.search);
    return (
      p.get("from") === "xtrawrkx-website" &&
      (p.get("email") || "").includes("@")
    );
  } catch {
    return false;
  }
}

function readInviteHandoff() {
  if (typeof window === "undefined") return false;
  try {
    const p = new URLSearchParams(window.location.search);
    return p.get("from") === "invite" || p.get("switch_user") === "1";
  } catch {
    return false;
  }
}

function readHandoffIntent() {
  if (typeof window === "undefined") return "";
  try {
    return (new URLSearchParams(window.location.search).get("intent") || "").trim();
  } catch {
    return "";
  }
}

const POST_AUTH_LANDING_COMMUNITIES_KEY = "xtrawrkx_portal_post_auth_communities";
const INVITE_AUTOLOGIN_STORE_KEY = "xtrawrkx_invite_autologin_once";

function setPostAuthLandingCommunities() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(POST_AUTH_LANDING_COMMUNITIES_KEY, "1");
  } catch {
    // ignore
  }
}

function takePostAuthLandingCommunities() {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(POST_AUTH_LANDING_COMMUNITIES_KEY) === "1") {
      sessionStorage.removeItem(POST_AUTH_LANDING_COMMUNITIES_KEY);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

function clearPostAuthLandingCommunities() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(POST_AUTH_LANDING_COMMUNITIES_KEY);
  } catch {
    // ignore
  }
}

function getPostAuthLandingPath() {
  if (typeof window === "undefined") return "/dashboard";
  const intent = readHandoffIntent();
  if (
    intent === "complete-setup" ||
    intent === "communities" ||
    intent === "join"
  ) {
    return "/communities";
  }
  if (readWebsiteHandoff()) {
    return "/communities";
  }
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.get("from") === "xtrawrkx-website") {
      return "/communities";
    }
  } catch {
    // ignore
  }
  if (takePostAuthLandingCommunities()) {
    return "/communities";
  }
  return "/dashboard";
}

const testimonials = [
  {
    quote:
      "Authentication made simple. The OTP system works flawlessly and keeps our accounts secure.",
  },
  {
    quote:
      "Quick and secure login process. Love the seamless experience from sign-in to dashboard.",
  },
  {
    quote:
      "The security features give us confidence in managing our business data.",
  },
  {
    quote:
      "Smooth onboarding that gets us started quickly with all the tools we need.",
  },
];

function SignInPanel({
  initialEmail,
  websiteHandoff,
  handoffIntent,
  onForgotPassword,
  onSubmit,
}) {
  const [email, setEmail] = useState(
    typeof initialEmail === "string" ? initialEmail.trim() : ""
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (typeof initialEmail === "string" && initialEmail.trim()) {
      setEmail(initialEmail.trim());
    }
  }, [initialEmail]);

  const validate = () => {
    const next = {};
    if (!email) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = "Enter a valid email";
    if (!password) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ email, password });
    } catch (error) {
      setLoginError(error.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {websiteHandoff && handoffIntent === "complete-setup" ? (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm">
          <p className="font-semibold text-amber-900">Finish client portal setup</p>
          <p className="mt-1.5 leading-relaxed text-amber-900/85">
            Your website account is linked. Sign in with the same email and password
            you use on the xtrawrkx site. After sign-in you can continue onboarding
            and join communities.
          </p>
        </div>
      ) : null}

      <LoginMobileBrandHeader
        brandIconPath={PORTAL_SITE.logoPath}
        brandName={PORTAL_SITE.brandName}
        productName={PORTAL_SITE.name}
        creatorLine={PORTAL_SITE.creatorLine}
      />

      <h2 className="text-3xl font-semibold text-brand-dark mb-2">Sign in</h2>
      <p className="text-gray-600 mb-8">
        Enter your credentials to access your projects.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {loginError && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Login failed</p>
              <p className="text-sm text-red-700 mt-1">{loginError}</p>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-brand-dark mb-1.5">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            error={errors.email}
            className="w-full"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-brand-dark mb-1.5">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              error={errors.password}
              className="w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-dark"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-brand-primary hover:text-orange-600 font-medium transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full" variant="primary">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Need access? Contact your administrator.
      </p>
    </>
  );
}

function ForgotPasswordPanel({ onBackToSignIn }) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validate = () => {
    const next = {};
    if (!email) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = "Enter a valid email";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccess(true);
    } catch (error) {
      setSubmitError(error.message || "Failed to send reset link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <LoginMobileBrandHeader
          brandIconPath={PORTAL_SITE.logoPath}
          brandName={PORTAL_SITE.brandName}
          productName={PORTAL_SITE.name}
          creatorLine={PORTAL_SITE.creatorLine}
        />
        <h2 className="text-3xl font-semibold text-brand-dark mb-2">Check your email</h2>
        <p className="text-gray-600 mb-8">
          If an account with <strong>{email}</strong> exists, you will receive reset
          instructions shortly.
        </p>
        <Button type="button" variant="outline" className="w-full" onClick={onBackToSignIn}>
          Back to sign in
        </Button>
      </>
    );
  }

  return (
    <>
      <LoginMobileBrandHeader
        brandIconPath={PORTAL_SITE.logoPath}
        brandName={PORTAL_SITE.brandName}
        productName={PORTAL_SITE.name}
        creatorLine={PORTAL_SITE.creatorLine}
      />
      <h2 className="text-3xl font-semibold text-brand-dark mb-2">Reset your password</h2>
      <p className="text-gray-600 mb-8">
        Enter your email and we&apos;ll send reset instructions.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {submitError && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        <div>
          <label htmlFor="reset-email" className="block text-sm font-medium text-brand-dark mb-1.5">
            Email
          </label>
          <Input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            error={errors.email}
            className="w-full"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full" variant="primary">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </span>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Remembered your password?{" "}
        <button
          type="button"
          onClick={onBackToSignIn}
          className="font-medium text-brand-primary hover:text-orange-600"
        >
          Back to sign in
        </button>
      </p>
    </>
  );
}

export default function AuthPage() {
  const [activeForm, setActiveForm] = useState("signin");
  const [websitePrefillEmail, setWebsitePrefillEmail] = useState("");
  const [websiteHandoff, setWebsiteHandoff] = useState(readWebsiteHandoff);
  const [handoffIntent, setHandoffIntent] = useState(readHandoffIntent);
  const inviteAutoLoginAttempted = useRef(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const router = useRouter();
  const { signIn, checkAuth } = useAuth();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    const rawEmail = params.get("email");
    const intentRaw = (params.get("intent") || "").trim();
    setHandoffIntent(intentRaw);
    setWebsiteHandoff(readWebsiteHandoff());
    if (rawEmail && rawEmail.trim()) {
      const decoded = decodeURIComponent(rawEmail.trim());
      setWebsitePrefillEmail(decoded);
      if (from === "xtrawrkx-website" || from === "invite") {
        setActiveForm("signin");
      }
    }

    const markCommunitiesLanding =
      from === "xtrawrkx-website" ||
      intentRaw === "complete-setup" ||
      intentRaw === "communities" ||
      intentRaw === "join";
    if (markCommunitiesLanding) {
      setPostAuthLandingCommunities();
    } else if (!from && !intentRaw) {
      clearPostAuthLandingCommunities();
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("from") !== "invite") return;
      const rawEmail = params.get("email");
      const rawPassword = params.get("password");
      if (!rawEmail?.trim() || !rawPassword) return;
      const email = decodeURIComponent(rawEmail.trim());
      const password = decodeURIComponent(rawPassword);
      sessionStorage.setItem(
        INVITE_AUTOLOGIN_STORE_KEY,
        JSON.stringify({ email, password })
      );
      window.history.replaceState({}, "", "/auth?from=invite");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || inviteAutoLoginAttempted.current) return;
    let payload = null;
    try {
      const raw = sessionStorage.getItem(INVITE_AUTOLOGIN_STORE_KEY);
      if (!raw) return;
      sessionStorage.removeItem(INVITE_AUTOLOGIN_STORE_KEY);
      payload = JSON.parse(raw);
    } catch {
      return;
    }
    if (!payload?.email || !payload?.password) return;
    inviteAutoLoginAttempted.current = true;
    (async () => {
      try {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("client_token");
        localStorage.removeItem("client_account");
        localStorage.removeItem("client_contacts");
        localStorage.removeItem("demo_user");
        await signIn(payload.email, payload.password);
        router.push(getPostAuthLandingPath());
      } catch (e) {
        console.error("Invite auto sign-in failed:", e);
        inviteAutoLoginAttempted.current = false;
        alert(
          "Could not sign in from this link. Use your email and temporary password on this page."
        );
        setWebsitePrefillEmail(payload.email);
        setActiveForm("signin");
      }
    })();
  }, [signIn, router]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated" && session?.user && !readInviteHandoff()) {
      router.push(getPostAuthLandingPath());
    }
  }, [status, session, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSignIn = async (formData) => {
    await signIn(formData.email, formData.password);
    await checkAuth();
    router.push(getPostAuthLandingPath());
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-lg border border-gray-100">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          <span className="font-medium text-brand-dark">Loading...</span>
        </div>
      </div>
    );
  }

  if (status === "authenticated" && !websiteHandoff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-light">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-lg border border-gray-100">
          <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          <span className="font-medium text-brand-dark">Redirecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="min-h-screen flex relative">
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
          <LoginBrandCorner
            brandIconPath={PORTAL_SITE.logoPath}
            brandName={PORTAL_SITE.brandName}
          />

          <div className="relative z-10">
            <div className="mb-16 mt-20">
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  Xtrawrkx
                </span>
                .
              </h1>
              <p className="text-white/90 text-xl leading-relaxed max-w-md drop-shadow-md">
                {PORTAL_SITE.tagline}
              </p>
            </div>

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
                    <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/40 ring-1 ring-white/20">
                      <div className="flex items-start space-x-5">
                        <Image
                          src={PORTAL_SITE.logoPath}
                          alt=""
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-2xl object-contain flex-shrink-0 bg-white/65 backdrop-blur-md border border-white/50 p-2"
                          priority
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white text-lg drop-shadow-md">
                              Xtrawrkx
                            </h4>
                            <span className="text-sm text-white/70">1 min ago</span>
                          </div>
                          <p className="text-sm text-white/80 font-medium mb-3">
                            Success Alert
                          </p>
                          <p className="text-sm text-white/90 leading-relaxed">
                            {testimonial.quote}
                          </p>
                        </div>

                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center border border-red-300/30">
                            <Icon icon="mdi:heart" className="text-red-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

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

        <motion.div
          className="w-full lg:w-3/5 bg-white p-4 sm:p-6 lg:p-8 space-y-6 ml-0 lg:ml-[40%] min-h-screen overflow-y-auto flex items-center justify-center"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="max-w-md w-full px-2 sm:px-4">
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
                {activeForm === "signin" ? (
                  <SignInPanel
                    initialEmail={websitePrefillEmail}
                    websiteHandoff={websiteHandoff}
                    handoffIntent={handoffIntent}
                    onForgotPassword={() => setActiveForm("forgot-password")}
                    onSubmit={handleSignIn}
                  />
                ) : (
                  <ForgotPasswordPanel onBackToSignIn={() => setActiveForm("signin")} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
