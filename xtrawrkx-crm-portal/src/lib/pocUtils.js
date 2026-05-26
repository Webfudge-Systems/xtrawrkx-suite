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

export function normalizeUser(user) {
  if (!user) return null;
  const entity = user.attributes
    ? { id: user.id, documentId: user.documentId, ...user.attributes }
    : user;

  const role =
    entity.primaryRole?.name ||
    entity.primaryRole?.data?.attributes?.name ||
    entity.primaryRole?.attributes?.name ||
    entity.role ||
    null;

  const department =
    entity.department?.name ||
    entity.department?.data?.attributes?.name ||
    entity.department?.attributes?.name ||
    null;

  const fullName =
    `${entity.firstName || ""} ${entity.lastName || ""}`.trim() ||
    entity.username ||
    entity.email ||
    "Team member";

  return {
    id: entity.id,
    documentId: entity.documentId,
    firstName: entity.firstName,
    lastName: entity.lastName,
    fullName,
    email: entity.email,
    phone: entity.phone,
    designation: role || "Dedicated POC",
    department,
    teamName: department || "Customer Success",
    isActive: entity.isActive !== false,
    avatarUrl: resolveMediaUrl(entity.avatar),
  };
}

export function isPocAssigned(account) {
  if (!account) return false;
  if (account.accountManager?.id || account.accountManager?.data?.id) return true;
  return account.pocAssignmentStatus === "ASSIGNED";
}

export function getDedicatedPoc(account) {
  if (!isPocAssigned(account)) return null;
  const manager = account.accountManager?.data?.attributes
    ? { id: account.accountManager.id, ...account.accountManager.data.attributes }
    : account.accountManager;
  return normalizeUser(manager);
}

export function filterEmployeesForPoc(users, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return users;

  return users.filter((user) => {
    const normalized = normalizeUser(user);
    if (!normalized) return false;
    const haystack = [
      normalized.fullName,
      normalized.email,
      normalized.designation,
      normalized.department,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
