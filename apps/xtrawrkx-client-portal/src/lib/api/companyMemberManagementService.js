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

function cacheContacts(members) {
  if (typeof window === "undefined" || !Array.isArray(members)) {
    return;
  }

  try {
    const contacts = members.map((member) => ({
      id: member.id,
      firstName: member.firstName || String(member.name || "").split(/\s+/)[0] || "Member",
      lastName:
        member.lastName ||
        String(member.name || "")
          .trim()
          .split(/\s+/)
          .slice(1)
          .join(" ") ||
        "",
      email: member.email,
      phone: member.phone,
      role: member.role,
      portalAccessLevel: member.portalAccessLevel,
      status: member.status,
    }));
    localStorage.setItem("client_contacts", JSON.stringify(contacts));
  } catch {
    // Best-effort cache refresh.
  }
}

export async function listCompanyMembersManaged() {
  const accountId = getAccountId();
  if (!accountId) {
    return { data: [], roles: [] };
  }

  const response = await fetch(
    `${authUrl("/company-members")}?accountId=${encodeURIComponent(
      String(accountId)
    )}`,
    {
      method: "GET",
      headers: strapiClient.getHeaders(),
      cache: "no-store",
    }
  ).then(parseResponse);

  const data = Array.isArray(response?.data) ? response.data : [];
  cacheContacts(data);
  return response;
}

export async function createCompanyRole({ name, permissions = [] }) {
  const response = await fetch(authUrl("/company-roles"), {
    method: "POST",
    headers: strapiClient.getHeaders(),
    body: JSON.stringify({ name, permissions }),
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
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    role: payload.role,
    portalAccessLevel: payload.portalAccessLevel,
    password: payload.password,
  };
  if (payload.loginId && String(payload.loginId).trim()) {
    body.loginId = String(payload.loginId).trim();
  }
  if (payload.isCustomRole) {
    body.isCustomRole = true;
    body.permissions = payload.permissions;
  }

  const response = await fetch(authUrl("/company-members"), {
    method: "POST",
    headers: strapiClient.getHeaders(),
    body: JSON.stringify(body),
  });

  const result = await parseResponse(response);
  await listCompanyMembersManaged().catch(() => null);
  return result;
}

export async function updateCompanyMemberManaged(memberId, payload) {
  const response = await fetch(authUrl(`/company-members/${memberId}`), {
    method: "PUT",
    headers: strapiClient.getHeaders(),
    body: JSON.stringify(payload),
  });
  const result = await parseResponse(response);
  await listCompanyMembersManaged().catch(() => null);
  return result;
}

export async function deleteCompanyMemberManaged(memberId) {
  const response = await fetch(authUrl(`/company-members/${memberId}`), {
    method: "DELETE",
    headers: strapiClient.getHeaders(),
  });
  const result = await parseResponse(response);
  await listCompanyMembersManaged().catch(() => null);
  return result;
}

export async function suspendCompanyMemberManaged(memberId, suspend = true) {
  const response = await fetch(
    authUrl(`/company-members/${memberId}/suspend`),
    {
      method: "PUT",
      headers: strapiClient.getHeaders(),
      body: JSON.stringify({ suspend }),
    }
  );
  const result = await parseResponse(response);
  await listCompanyMembersManaged().catch(() => null);
  return result;
}

export async function getContactById(memberId) {
  const response = await fetch(authUrl(`/company-members/${memberId}`), {
    method: "GET",
    headers: strapiClient.getHeaders(),
    cache: "no-store",
  });
  return parseResponse(response);
}

export async function updateContactById(memberId, data) {
  return updateCompanyMemberManaged(memberId, data);
}
