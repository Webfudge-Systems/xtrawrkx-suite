const PORTAL_ROLE_LABELS = {
  ADMIN: "Primary Contact",
  MANAGER: "Admin / Manager",
  DEVELOPER: "Developer",
  DEVOPS_ENGINEER: "DevOps Engineer",
  UX_DESIGNER: "UX Designer",
  PRIMARY_CONTACT: "Primary Contact",
  MEMBER: "Member",
};

const PORTAL_ACCESS_LABELS = {
  FULL_ACCESS: "Admin",
  STANDARD_ACCESS: "Manager",
  READ_ONLY: "Member",
};

export function formatMemberRoleLabel(role, isPrimaryContact = false) {
  if (isPrimaryContact) return "Primary Contact";
  const key = String(role || "MEMBER").toUpperCase().replaceAll(" ", "_");
  return PORTAL_ROLE_LABELS[key] || key.replaceAll("_", " ");
}

export function formatPortalAccessLabel(level) {
  const key = String(level || "READ_ONLY").toUpperCase();
  return PORTAL_ACCESS_LABELS[key] || "Member";
}

export function formatMemberStatusLabel(status) {
  const key = String(status || "ACTIVE").toUpperCase();
  if (key === "SUSPENDED") return "Suspended";
  if (key === "INACTIVE") return "Inactive";
  if (key === "INVITED") return "Invited";
  return "Active";
}

export function memberStatusBadgeClass(status) {
  const key = String(status || "ACTIVE").toUpperCase();
  if (key === "ACTIVE") {
    return "border-green-200 bg-green-100 text-green-700";
  }
  if (key === "SUSPENDED") {
    return "border-amber-200 bg-amber-100 text-amber-800";
  }
  if (key === "INACTIVE") {
    return "border-gray-200 bg-gray-100 text-gray-600";
  }
  return "border-yellow-200 bg-yellow-100 text-yellow-700";
}

export function portalAccessBadgeClass(level) {
  const key = String(level || "READ_ONLY").toUpperCase();
  if (key === "FULL_ACCESS") {
    return "border-violet-200 bg-violet-100 text-violet-800";
  }
  if (key === "STANDARD_ACCESS") {
    return "border-blue-200 bg-blue-100 text-blue-700";
  }
  return "border-gray-200 bg-gray-100 text-gray-700";
}
