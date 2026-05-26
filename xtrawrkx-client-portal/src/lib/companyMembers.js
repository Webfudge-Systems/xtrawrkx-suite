export const fallbackMembers = [
  {
    id: "m-1",
    firstName: "Rohan",
    lastName: "Sharma",
    email: "rohan@xtrawrkx.com",
    phone: "+91 99876 54321",
    role: "PRIMARY_CONTACT",
    portalAccessLevel: "FULL_ACCESS",
    status: "ACTIVE",
    location: "Mumbai",
    lastActive: "2h ago",
  },
  {
    id: "m-2",
    firstName: "Priya",
    lastName: "Verma",
    email: "priya@xtrawrkx.com",
    phone: "+91 98989 10001",
    role: "MEMBER",
    portalAccessLevel: "STANDARD_ACCESS",
    status: "ACTIVE",
    location: "Delhi",
    lastActive: "1d ago",
  },
  {
    id: "m-3",
    firstName: "Aditya",
    lastName: "Kapoor",
    email: "aditya@xtrawrkx.com",
    phone: "+91 98111 22334",
    role: "FINANCE",
    portalAccessLevel: "BILLING_ONLY",
    status: "INVITED",
    location: "Pune",
    lastActive: "Never",
  },
];

export function getStoredMembers() {
  if (typeof window === "undefined") {
    return fallbackMembers;
  }

  try {
    const raw = localStorage.getItem("client_contacts");
    if (!raw) {
      return fallbackMembers;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return fallbackMembers;
    }

    return parsed.map((member, index) => ({
      id: member.id || member.documentId || `member-${index + 1}`,
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      email: member.email || "unknown@company.com",
      phone: member.phone || "Not provided",
      role: member.role || "MEMBER",
      portalAccessLevel: member.portalAccessLevel || "STANDARD_ACCESS",
      status: member.status || "ACTIVE",
      location: member.location || "Not specified",
      lastActive: member.lastActive || "Recently",
    }));
  } catch {
    return fallbackMembers;
  }
}

export function getMemberById(memberId) {
  const members = getStoredMembers();
  return members.find((member) => String(member.id) === String(memberId)) || null;
}

