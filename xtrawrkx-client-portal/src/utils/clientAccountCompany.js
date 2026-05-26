/**
 * Resolves the business / organization name shown in forms (join community, etc.)
 * from the Strapi-shaped object stored in `localStorage.client_account`.
 *
 * Prefer `onboardingData.signupCompany` (website profile company) when set,
 * then other onboarding company keys, then `companyName`, then `company`.
 */
export function resolveClientAccountCompanyName(account) {
  if (!account || typeof account !== "object") {
    return "";
  }

  const od =
    account.onboardingData && typeof account.onboardingData === "object"
      ? account.onboardingData
      : {};

  const fromSignup =
    typeof od.signupCompany === "string" ? od.signupCompany.trim() : "";
  if (fromSignup) {
    return fromSignup;
  }

  const fromOnboardingCompany =
    typeof od.company === "string" ? od.company.trim() : "";
  if (fromOnboardingCompany) {
    return fromOnboardingCompany;
  }

  const fromOnboardingCompanyName =
    typeof od.companyName === "string" ? od.companyName.trim() : "";
  if (fromOnboardingCompanyName) {
    return fromOnboardingCompanyName;
  }

  const fromOnboardingOrg =
    typeof od.organizationName === "string" ? od.organizationName.trim() : "";
  if (fromOnboardingOrg) {
    return fromOnboardingOrg;
  }

  const cn = String(account.companyName || "").trim();
  if (cn) {
    return cn;
  }

  return String(account.company || "").trim();
}
