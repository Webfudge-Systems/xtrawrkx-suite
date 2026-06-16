import { resolveClientAccountCompanyName } from "@/utils/clientAccountCompany";

function resolveContactFullName(onboardingData = {}, contacts = []) {
  const displayName =
    (typeof onboardingData.displayName === "string" && onboardingData.displayName.trim()) || "";
  if (displayName) return displayName;

  const firstName =
    (typeof onboardingData.firstName === "string" && onboardingData.firstName.trim()) || "";
  const lastName =
    (typeof onboardingData.lastName === "string" && onboardingData.lastName.trim()) || "";
  const fromOnboarding = `${firstName} ${lastName}`.trim();
  if (fromOnboarding) return fromOnboarding;

  const primary =
    contacts.find((c) => c?.isPrimaryContact) ||
    contacts.find((c) => c?.contactRole === "PRIMARY_CONTACT") ||
    contacts[0];
  if (primary) {
    const contactName = `${primary.firstName || ""} ${primary.lastName || ""}`.trim();
    if (contactName) return contactName;
    if (primary.name) return String(primary.name).trim();
  }

  return "";
}

function readStoredContacts() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("client_contacts");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Prefill payload for community join registration from stored client account. */
export function resolveCommunityJoinDefaults(accountOverride = null) {
  let acc = accountOverride;
  if (!acc && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("client_account");
      if (raw) acc = JSON.parse(raw);
    } catch {
      acc = null;
    }
  }
  if (!acc || typeof acc !== "object") {
    return emptyCommunityJoinDefaults();
  }

  const attrs = acc.attributes || acc;
  const onboardingData =
    attrs.onboardingData && typeof attrs.onboardingData === "object"
      ? attrs.onboardingData
      : {};

  return {
    fullName: resolveContactFullName(onboardingData, readStoredContacts()),
    company:
      resolveClientAccountCompanyName(acc) ||
      resolveClientAccountCompanyName(attrs) ||
      "",
    companyEmail: onboardingData.companyEmail || attrs.companyEmail || "",
    jobTitle: onboardingData.jobTitle || attrs.jobTitle || acc.jobTitle || "",
    phone:
      onboardingData.phone ||
      attrs.phone ||
      acc.phone ||
      onboardingData.companyPhone ||
      "",
    companyPhone: onboardingData.companyPhone || attrs.companyPhone || "",
    website: onboardingData.website || attrs.website || "",
    companyType: onboardingData.companyType || attrs.companyType || "",
    companySubType: onboardingData.companySubType || attrs.companySubType || "",
    companyDescription:
      onboardingData.companyDescription || attrs.companyDescription || "",
    addressLine1: onboardingData.addressLine1 || attrs.addressLine1 || "",
    addressLine2: onboardingData.addressLine2 || attrs.addressLine2 || "",
    city: onboardingData.city || attrs.city || "",
    state: onboardingData.state || attrs.state || "",
    country: onboardingData.country || attrs.country || "",
    postalCode: onboardingData.postalCode || attrs.postalCode || "",
    linkedin: onboardingData.linkedin || attrs.linkedin || "",
    xProfile: onboardingData.xProfile || attrs.xProfile || "",
    interests: onboardingData.interests || attrs.interests || "",
    registrationLookingFor:
      onboardingData.lookingFor || attrs.lookingFor || "",
    bio: onboardingData.bio || attrs.bio || "",
  };
}

export function emptyCommunityJoinDefaults() {
  return {
    fullName: "",
    company: "",
    companyEmail: "",
    jobTitle: "",
    phone: "",
    companyPhone: "",
    website: "",
    companyType: "",
    companySubType: "",
    companyDescription: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    linkedin: "",
    xProfile: "",
    interests: "",
    registrationLookingFor: "",
    bio: "",
  };
}
