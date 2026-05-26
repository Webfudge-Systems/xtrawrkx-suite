import strapiClient from "../strapiClient";

function normalizeMember(member) {
  if (!member || typeof member !== "object") {
    return null;
  }

  const role = member.role || member.portalAccessLevel || "MEMBER";
  const firstName = member.firstName || "";
  const lastName = member.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const fallbackName = member.name || member.email?.split("@")[0] || "Unknown";

  return {
    id:
      member.id ||
      member.documentId ||
      member.email ||
      `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: fullName || fallbackName,
    role: role.replaceAll("_", " "),
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
  const cachedMembers = readStoredContacts();
  if (cachedMembers.length > 0) {
    return { data: cachedMembers };
  }

  try {
    const response = await strapiClient.getAccountContacts();
    const contacts = Array.isArray(response?.contacts)
      ? response.contacts
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

    const members = contacts.map(normalizeMember).filter(Boolean);
    return { data: members };
  } catch (error) {
    console.warn("Failed to fetch company members", error);
    return { data: [] };
  }
}

