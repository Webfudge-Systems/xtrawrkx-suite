 "use client";

import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import Button from "../common/Button";
import SearchableSelect from "../common/SearchableSelect";
import { FormSkipLink, SignupStepNav } from "./FormNavButtons";
import {
  COMPANY_TYPES,
  getSubTypesForCompanyType,
  INDUSTRIES,
} from "@/src/data/companyRegistrationOptions";
import { usePublicAuth } from "@/src/contexts/PublicAuthContext";
import { commonToasts, toastUtils } from "@/src/utils/toast";

const signupInitialState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  company: "",
  companyName: "",
  companyEmail: "",
  companyPhone: "",
  companyType: "",
  companySubType: "",
  industry: "",
  website: "",
  companyDescription: "",
  jobTitle: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  location: "",
  linkedin: "",
  xProfile: "",
  interests: "",
  lookingFor: "",
  bio: "",
};

const loginInitialState = {
  email: "",
  password: "",
};

/** After login or signup on the standalone `/auth` page, always land on the public profile. */
const POST_AUTH_PAGE_PATH = "/profile";

export default function AuthForm({
  initialMode = "signup",
  onSuccess,
  onClose,
  isPage = false,
  redirectTo = "/profile",
}) {
  const { signIn, signUp, authBusy, error, clearError } = usePublicAuth();
  const [mode, setMode] = useState(initialMode);
  const [loginData, setLoginData] = useState(loginInitialState);
  const [signupData, setSignupData] = useState(signupInitialState);
  const [signupStep, setSignupStep] = useState(0);
  const [skippedSteps, setSkippedSteps] = useState({ address: false, social: false });
  const [localError, setLocalError] = useState("");
  const signupSteps = [
    "Personal",
    "Company Information",
    "Address Information",
    "Social & Additional Information",
  ];

  const isSignup = mode === "signup";

  const activeTitle = useMemo(
    () =>
      isSignup
        ? "Create your xtrawrkx account"
        : "Sign in to your xtrawrkx account",
    [isSignup]
  );

  const handleModeChange = (nextMode) => {
    clearError();
    setLocalError("");
    setMode(nextMode);
    setSignupStep(0);
    setSkippedSteps({ address: false, social: false });
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginData((current) => ({ ...current, [name]: value }));
  };

  const handleSignupChange = (event) => {
    const { name, value } = event.target;
    setSignupData((current) => ({ ...current, [name]: value }));
  };

  const handleSignupSelectChange = (event) => {
    const { name, value } = event.target;
    if (name === "companyType") {
      setSignupData((current) => ({
        ...current,
        companyType: value,
        companySubType: "",
      }));
      return;
    }
    setSignupData((current) => ({ ...current, [name]: value }));
  };

  const companySubTypeOptions = useMemo(
    () => getSubTypesForCompanyType(signupData.companyType),
    [signupData.companyType]
  );

  const validateSignup = ({ addressSkipped, socialSkipped } = {}) => {
    const addressStepSkipped = addressSkipped ?? skippedSteps.address;
    const socialStepSkipped = socialSkipped ?? skippedSteps.social;

    if (!signupData.firstName.trim() || !signupData.lastName.trim()) return "Please complete your personal details.";
    if (!signupData.email.trim() || !signupData.password.trim()) return "Please provide your account email and password.";
    if (!signupData.companyName.trim() || !signupData.companyEmail.trim() || !signupData.industry.trim()) return "Please complete required company details.";
    if (
      !addressStepSkipped &&
      (!signupData.addressLine1.trim() || !signupData.city.trim() || !signupData.country.trim())
    ) {
      return "Please complete required address details.";
    }
    if (!signupData.jobTitle.trim()) return "Please complete your role / title.";
    if (!socialStepSkipped && !signupData.lookingFor.trim()) {
      return "Please share what you are looking for in the ecosystem.";
    }
    if (signupData.password.length < 6) {
      return "Password must be at least 6 characters long.";
    }

    return "";
  };

  const completeSignup = async ({ addressSkipped, socialSkipped } = {}) => {
    clearError();
    setLocalError("");

    const validationError = validateSignup({ addressSkipped, socialSkipped });
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    try {
      const signupResult = await signUp({
        ...signupData,
        company: signupData.companyName || signupData.company,
        location:
          signupData.location ||
          [signupData.city, signupData.state, signupData.country]
            .filter(Boolean)
            .join(", "),
      });
      commonToasts.saveSuccess();
      if (signupResult?.clientAccountSetup?.ok === false) {
        toastUtils.warning(
          `${signupResult.clientAccountSetup.error} Open your profile and use Retry Setup.`
        );
      }

      if (onSuccess) {
        onSuccess();
      } else if (isPage && typeof window !== "undefined") {
        window.location.href = POST_AUTH_PAGE_PATH;
      }

      onClose?.();
    } catch (submitError) {
      setLocalError(submitError.message || "Unable to continue right now.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearError();
    setLocalError("");

    try {
      if (isSignup) {
        await completeSignup();
      } else {
        if (!loginData.email.trim() || !loginData.password.trim()) {
          setLocalError("Please enter your email and password.");
          return;
        }

        await signIn(loginData.email, loginData.password);
        commonToasts.loginSuccess();

        if (onSuccess) {
          onSuccess();
        } else if (isPage && typeof window !== "undefined") {
          window.location.href = POST_AUTH_PAGE_PATH;
        }

        onClose?.();
      }
    } catch (submitError) {
      setLocalError(submitError.message || "Unable to continue right now.");
    }
  };

  const validateCurrentSignupStep = () => {
    if (signupStep === 0) {
      if (!signupData.firstName.trim() || !signupData.lastName.trim() || !signupData.email.trim() || !signupData.password.trim()) {
        return "Please complete all required personal fields.";
      }
      if (signupData.password.length < 6) return "Password must be at least 6 characters long.";
    }
    if (signupStep === 1) {
      if (!signupData.companyName.trim() || !signupData.industry.trim() || !signupData.companyEmail.trim() || !signupData.jobTitle.trim()) {
        return "Please complete all required company fields.";
      }
    }
    if (signupStep === 2 && !skippedSteps.address) {
      if (!signupData.addressLine1.trim() || !signupData.city.trim() || !signupData.country.trim()) {
        return "Please complete required address fields.";
      }
    }
    if (signupStep === 3 && !skippedSteps.social && !signupData.lookingFor.trim()) {
      return "Please share what you are looking for in the ecosystem.";
    }
    return "";
  };

  const goToNextSignupStep = () => {
    const validationError = validateCurrentSignupStep();
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError("");
    setSignupStep((current) => Math.min(current + 1, signupSteps.length - 1));
  };

  const goBackSignupStep = () => {
    setLocalError("");
    if (signupStep === 3) {
      setSkippedSteps((steps) => ({ ...steps, social: false }));
    }
    if (signupStep === 2) {
      setSkippedSteps((steps) => ({ ...steps, address: false }));
    }
    setSignupStep((current) => Math.max(current - 1, 0));
  };

  const skipAddressStep = () => {
    setLocalError("");
    setSkippedSteps((steps) => ({ ...steps, address: true }));
    setSignupStep(3);
  };

  const skipSocialStep = async () => {
    setLocalError("");
    setSkippedSteps((steps) => ({ ...steps, social: true }));
    await completeSignup({ socialSkipped: true });
  };

  const isSignupLastStep = signupStep === signupSteps.length - 1;
  const showSkipButton = signupStep === 2 || signupStep === 3;

  const surfaceClassName = isPage
    ? "w-full overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 shadow-[0_32px_80px_rgba(15,23,42,0.14)] backdrop-blur"
    : "w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.24)]";

  return (
    <div className={surfaceClassName}>
      <div className="grid lg:min-h-[760px] lg:grid-cols-[1fr_0.94fr]">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-sky-900 to-slate-700 px-6 py-10 text-white sm:px-10 lg:px-12 lg:py-14">
          <div className="absolute inset-0">
            <video
              src="/mountain_vid1.webm"
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover opacity-30"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-sky-900/60 to-pink-500/30" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <div>
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-white/90">
                xtrawrkx access
              </span>
              <h2 className="mt-5 max-w-md font-heading text-4xl leading-tight sm:text-5xl">
                From complexity to clarity.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/85 sm:text-base">
                Build your public profile, keep your details in sync, and move
                into the right community experience from one place.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Icon icon="solar:user-id-bold" width={18} />
                  Profile ready
                </div>
                <p className="text-sm text-white/80">
                  Capture portal-style identity and company details during
                  signup.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Icon icon="solar:users-group-rounded-bold" width={18} />
                  Community aware
                </div>
                <p className="text-sm text-white/80">
                  Membership status is checked after sign-in so users get the
                  right next step.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="mx-auto max-w-[520px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-primary">
                Welcome
              </p>
              <h3 className="mt-3 text-3xl font-semibold leading-tight text-slate-900">
                {activeTitle}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                {isSignup
                  ? "Set up your account to unlock your profile page and community routing."
                  : "Use your email and password to continue to your profile and community access."}
              </p>
            </div>
            {!isPage && onClose ? (
              <button
                type="button"
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                onClick={onClose}
                aria-label="Close authentication"
              >
                <Icon icon="solar:close-circle-linear" width={22} />
              </button>
            ) : null}
          </div>

          <div className="mt-8 grid grid-cols-2 rounded-[1.15rem] border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                !isSignup
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              onClick={() => handleModeChange("login")}
            >
              I already have an account
            </button>
            <button
              type="button"
              className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                isSignup
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              onClick={() => handleModeChange("signup")}
            >
              I need to register
            </button>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {isSignup ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                <div className="mb-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{signupSteps[signupStep]}</p>
                    <p className="text-xs font-medium text-slate-500">Step {signupStep + 1} of {signupSteps.length}</p>
                  </div>
                  <div className="flex gap-2">
                    {signupSteps.map((step, index) => (
                      <span key={step} className={`h-1.5 flex-1 rounded-full ${index <= signupStep ? "bg-brand-primary" : "bg-slate-200"}`} />
                    ))}
                  </div>
                </div>

                {signupStep === 0 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">First name *</span><input name="firstName" value={signupData.firstName} onChange={handleSignupChange} className="input" placeholder="Alex" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Last name *</span><input name="lastName" value={signupData.lastName} onChange={handleSignupChange} className="input" placeholder="Johnson" /></label>
                    <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">Email *</span><input name="email" type="email" value={signupData.email} onChange={handleSignupChange} className="input" placeholder="alex@company.com" /></label>
                    <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">Password *</span><input name="password" type="password" value={signupData.password} onChange={handleSignupChange} className="input" placeholder="At least 6 characters" /></label>
                    <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">Phone</span><input name="phone" value={signupData.phone} onChange={handleSignupChange} className="input" placeholder="+1 (555) 123-4567" /></label>
                  </div>
                )}

                {signupStep === 1 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">Company name *</span><input name="companyName" value={signupData.companyName} onChange={handleSignupChange} className="input" placeholder="Enter company name" /></label>
                    <SearchableSelect
                      className="block"
                      label="Industry"
                      name="industry"
                      value={signupData.industry}
                      onChange={handleSignupSelectChange}
                      options={INDUSTRIES}
                      placeholder="Select industry"
                      required
                    />
                    <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Role / title *</span><input name="jobTitle" value={signupData.jobTitle} onChange={handleSignupChange} className="input" placeholder="Founder" /></label>
                    <SearchableSelect
                      className="block"
                      label="Company type"
                      name="companyType"
                      value={signupData.companyType}
                      onChange={handleSignupSelectChange}
                      options={COMPANY_TYPES}
                      placeholder="Select company type"
                    />
                    <SearchableSelect
                      className="block"
                      label="Sub-type"
                      name="companySubType"
                      value={signupData.companySubType}
                      onChange={handleSignupSelectChange}
                      options={companySubTypeOptions}
                      placeholder="Select sub-type"
                      disabledPlaceholder="Select company type first"
                      disabled={!signupData.companyType}
                    />
                    <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Company email *</span><input name="companyEmail" type="email" value={signupData.companyEmail} onChange={handleSignupChange} className="input" placeholder="contact@company.com" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Company phone</span><input name="companyPhone" value={signupData.companyPhone} onChange={handleSignupChange} className="input" placeholder="+1 (555) 123-4567" /></label>
                    <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">Website</span><input name="website" value={signupData.website} onChange={handleSignupChange} className="input" placeholder="https://company.com" /></label>
                    <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">Company description</span><textarea name="companyDescription" value={signupData.companyDescription} onChange={handleSignupChange} className="input min-h-24 resize-none" placeholder="Brief description of your company" /></label>
                  </div>
                )}

                {signupStep === 2 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <p className="sm:col-span-2 text-xs text-slate-500">
                      Address details are optional — you can complete them later using Skip for Now.
                    </p>
                    <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">Address line 1</span><input name="addressLine1" value={signupData.addressLine1} onChange={handleSignupChange} className="input" placeholder="Street address" /></label>
                    <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">Address line 2</span><input name="addressLine2" value={signupData.addressLine2} onChange={handleSignupChange} className="input" placeholder="Suite / floor (optional)" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">City</span><input name="city" value={signupData.city} onChange={handleSignupChange} className="input" placeholder="Toronto" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">State / region</span><input name="state" value={signupData.state} onChange={handleSignupChange} className="input" placeholder="Ontario" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Country</span><input name="country" value={signupData.country} onChange={handleSignupChange} className="input" placeholder="Canada" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">Postal code</span><input name="postalCode" value={signupData.postalCode} onChange={handleSignupChange} className="input" placeholder="M5V 2T6" /></label>
                  </div>
                )}

                {signupStep === 3 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <p className="sm:col-span-2 text-xs text-slate-500">
                      Social and additional details are optional — add them now or skip and update your profile later.
                    </p>
                    <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">LinkedIn</span><input name="linkedin" value={signupData.linkedin} onChange={handleSignupChange} className="input" placeholder="linkedin.com/in/username" /></label>
                    <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">X / Twitter</span><input name="xProfile" value={signupData.xProfile} onChange={handleSignupChange} className="input" placeholder="x.com/username" /></label>
                    <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">Interests & focus areas</span><input name="interests" value={signupData.interests} onChange={handleSignupChange} className="input" placeholder="Technologies, sectors, themes" /></label>
                    <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">What are you looking for?</span><textarea name="lookingFor" value={signupData.lookingFor} onChange={handleSignupChange} className="input min-h-24 resize-none" placeholder="Networking, hiring, funding, partnerships" /></label>
                    <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">Short bio</span><textarea name="bio" value={signupData.bio} onChange={handleSignupChange} className="input min-h-24 resize-none" placeholder="Tell us a little about your work and goals." /></label>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Login details
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter your credentials to continue to your profile.
                  </p>
                </div>
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Email
                    </span>
                    <input
                      name="email"
                      type="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      className="input"
                      placeholder="alex@company.com"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Password
                    </span>
                    <input
                      name="password"
                      type="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      className="input"
                      placeholder="Enter your password"
                    />
                  </label>
                </div>
              </div>
            )}

            {localError || error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {localError || error}
              </div>
            ) : null}

            {isSignup ? (
              <SignupStepNav
                showBack={signupStep > 0}
                onBack={goBackSignupStep}
                continueText={isSignupLastStep ? "Create Account" : "Continue"}
                htmlType={isSignupLastStep ? "submit" : "button"}
                onContinue={isSignupLastStep ? undefined : goToNextSignupStep}
                loading={authBusy}
                disabled={authBusy}
              />
            ) : (
              <Button
                text="Login"
                type="primary"
                className="w-full justify-center"
                hideArrow={authBusy}
                disabled={authBusy}
                htmlType="submit"
                icon={authBusy ? "solar:loading-bold" : undefined}
              />
            )}
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-slate-500">
            <p>
              {isSignup ? "Already have an account?" : "Need an account?"}{" "}
              <button
                type="button"
                className="font-medium text-brand-primary transition hover:text-brand-secondary"
                onClick={() => handleModeChange(isSignup ? "login" : "signup")}
              >
                {isSignup ? "Sign in here" : "Register here"}
              </button>
            </p>
            {isSignup && showSkipButton ? (
              <FormSkipLink
                onClick={signupStep === 2 ? skipAddressStep : skipSocialStep}
                disabled={authBusy}
              />
            ) : null}
          </div>
          {!isPage ? (
            <p className="mt-3 text-xs leading-6 text-slate-400">
              You can also continue on the full auth page at{" "}
              <a
                href={`/auth?mode=${isSignup ? "signup" : "login"}&redirect=${encodeURIComponent(
                  redirectTo
                )}`}
                className="font-medium text-brand-primary"
              >
                /auth
              </a>
              .
            </p>
          ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
