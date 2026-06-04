import strapiClient from "../strapiClient";

function getAccountId() {
  if (typeof window === "undefined") {
    return null;
  }

  const accountId = strapiClient.getCurrentAccountId();
  if (accountId) {
    return accountId;
  }

  try {
    const raw = localStorage.getItem("client_account");
    if (!raw) {
      return null;
    }
    const account = JSON.parse(raw);
    return account?.id || account?.documentId || null;
  } catch {
    return null;
  }
}

async function parseResponse(response) {
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      json?.error?.message || json?.message || "Request failed"
    );
  }
  return json;
}

function authUrl(path) {
  return `${strapiClient.baseURL}${strapiClient.apiPath}/auth${path}`;
}

export async function listCompanyMembersManaged() {
  const accountId = getAccountId();
  if (!accountId) {
    return { data: [], roles: [] };
  }

  const [memberResponse, contactsResponse] = await Promise.all([
    fetch(
      `${authUrl("/company-members")}?accountId=${encodeURIComponent(
        String(accountId)
      )}`,
      {
        method: "GET",
        headers: strapiClient.getHeaders(),
        cache: "no-store",
      }
    ).then(parseResponse),
    strapiClient.get(`/contacts/client-account/${accountId}`, {
      populate: ["portalAccess", "clientAccount"],
    }),
  ]);

  const contacts = Array.isArray(contactsResponse?.data)
    ? contactsResponse.data
    : Array.isArray(contactsResponse)
      ? contactsResponse
      : [];

  const contactMap = new Map(
    contacts.map((contact) => [String(contact.id), contact])
  );

  const data = (Array.isArray(memberResponse?.data) ? memberResponse.data : []).map(
    (member) => {
      const contact = contactMap.get(String(member.id));
      return {
        ...member,
        phone: contact?.phone || null,
        location: contact?.location || null,
        portalAccessLevel: contact?.portalAccessLevel || "READ_ONLY",
        role: member?.role || contact?.portalAccess?.roleName || "MEMBER",
      };
    }
  );

  return { ...memberResponse, data };
}

export async function createCompanyRole({ name, permissions = [] }) {
  const accountId = getAccountId();
  if (!accountId) {
    throw new Error("No account ID found");
  }

  const response = await fetch(authUrl("/company-roles"), {
    method: "POST",
    headers: strapiClient.getHeaders(),
    body: JSON.stringify({ accountId, name, permissions }),
  });
  return parseResponse(response);
}

export async function addCompanyMemberManaged(payload) {
  const accountId = getAccountId();
  if (!accountId) {
    throw new Error("No account ID found");
  }

  const body = {
    accountId,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    password: payload.password,
  };
  if (payload.loginId && String(payload.loginId).trim()) {
    body.loginId = String(payload.loginId).trim();
  }

  const response = await fetch(authUrl("/company-members"), {
    method: "POST",
    headers: strapiClient.getHeaders(),
    body: JSON.stringify(body),
  });

  return parseResponse(response);
}

export async function updateCompanyMemberManaged(memberId, payload) {
  const response = await fetch(authUrl(`/company-members/${memberId}`), {
    method: "PUT",
    headers: strapiClient.getHeaders(),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function deleteCompanyMemberManaged(memberId) {
  const response = await fetch(authUrl(`/company-members/${memberId}`), {
    method: "DELETE",
    headers: strapiClient.getHeaders(),
  });
  return parseResponse(response);
}

export async function getContactById(memberId) {
  return strapiClient.get(`/contacts/${memberId}`, {
    populate: ["portalAccess", "clientAccount"],
  });
}

export async function updateContactById(memberId, data) {
  return strapiClient.put(`/contacts/${memberId}`, data);
}

