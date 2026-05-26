const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  "http://localhost:1337";

export function resolveMediaUrl(media) {
  if (!media) return null;
  const file = media?.url ? media : media?.data?.attributes || media?.attributes;
  if (!file?.url) return null;
  const url = file.url;
  if (url.startsWith("http")) return url;
  return `${String(API_BASE).replace(/\/$/, "")}${url}`;
}

export function normalizeDedicatedPoc(source) {
  if (!source) return null;

  const entity =
    source.attributes != null
      ? { id: source.id, documentId: source.documentId, ...source.attributes }
      : source;

  if (!entity || (!entity.id && !entity.fullName && !entity.email)) return null;

  const role =
    entity.designation ||
    entity.primaryRole?.name ||
    entity.primaryRole?.data?.attributes?.name ||
    entity.primaryRole?.attributes?.name ||
    entity.role ||
    "Dedicated POC";

  const department =
    entity.department?.name ||
    entity.department?.data?.attributes?.name ||
    entity.department?.attributes?.name ||
    entity.department ||
    null;

  const fullName =
    entity.fullName ||
    `${entity.firstName || ""} ${entity.lastName || ""}`.trim() ||
    entity.username ||
    entity.email ||
    "Dedicated POC";

  return {
    id: entity.id,
    documentId: entity.documentId,
    firstName: entity.firstName,
    lastName: entity.lastName,
    fullName,
    email: entity.email || "",
    phone: entity.phone || "",
    designation: role,
    department,
    teamName: entity.teamName || department || "Customer Success",
    isActive: entity.isActive !== false,
    avatarUrl: entity.avatarUrl || resolveMediaUrl(entity.avatar),
  };
}

export function isPocAssigned(account) {
  if (!account) return false;
  if (account.pocAssigned === true) return true;
  if (account.dedicatedPoc?.id || account.dedicatedPoc?.fullName) return true;
  if (account.pocAssignmentStatus === "ASSIGNED") return true;
  if (account.accountManager?.id || account.accountManager?.data?.id) return true;
  if (typeof account.accountManager === "number") return true;
  return false;
}

export function getDedicatedPoc(account) {
  if (!account) return null;

  const fromDedicated = normalizeDedicatedPoc(account.dedicatedPoc);
  if (fromDedicated?.id || fromDedicated?.email || fromDedicated?.fullName) {
    return fromDedicated;
  }

  const manager = account.accountManager?.data?.attributes
    ? { id: account.accountManager.id, ...account.accountManager.data.attributes }
    : account.accountManager;

  return normalizeDedicatedPoc(manager);
}

export function getClientAccountFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("client_account");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getUserInitials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
}
