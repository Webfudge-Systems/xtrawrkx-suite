import strapiClient from "../strapiClient";
import { listCompanyMembersManaged } from "./companyMemberManagementService";

function normalizeMember(member) {
  if (!member || typeof member !== "object") {
    return null;
  }

  const firstName =
    member.firstName || String(member.name || "").trim().split(/\s+/)[0] || "";
  const lastName =
    member.lastName ||
    String(member.name || "")
      .trim()
      .split(/\s+/)
      .slice(1)
      .join(" ") ||
    "";
  const role = member.role || member.portalAccessLevel || "MEMBER";
  const fullName = `${firstName} ${lastName}`.trim();
  const fallbackName = member.name || member.email?.split("@")[0] || "Unknown";

  return {
    id:
      member.id ||
      member.documentId ||
      member.email ||
      `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: fullName || fallbackName,
    role: String(role).replaceAll("_", " "),
    email: member.email || null,
  };
}

function readStoredContacts() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawContacts = localStorage.getItem("client_contacts");
    if (!rawContacts) {
      return [];
    }

    const parsed = JSON.parse(rawContacts);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeMember).filter(Boolean);
  } catch (error) {
    console.warn("Failed to read cached client contacts", error);
    return [];
  }
}

export async function listCompanyMembers() {
  try {
    const response = await listCompanyMembersManaged();
    const contacts = Array.isArray(response?.data) ? response.data : [];
    const members = contacts.map(normalizeMember).filter(Boolean);
    return { data: members };
  } catch (error) {
    console.warn("Failed to fetch company members", error);
    const cachedMembers = readStoredContacts();
    return { data: cachedMembers };
  }
}

export async function refreshCompanyMembersCache() {
  try {
    const response = await fetch(
      `${strapiClient.baseURL}${strapiClient.apiPath}/auth/me`,
      {
        method: "GET",
        headers: strapiClient.getHeaders(),
        cache: "no-store",
      }
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (data?.type === "client" && Array.isArray(data.contacts)) {
      if (typeof window !== "undefined") {
        localStorage.setItem("client_contacts", JSON.stringify(data.contacts));
      }
      return data.contacts;
    }
    return null;
  } catch {
    return null;
  }
}
