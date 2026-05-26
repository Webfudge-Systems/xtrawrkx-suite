const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  "http://localhost:1337";

function getToken() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("client_token") ||
    localStorage.getItem("auth_token") ||
    null
  );
}

export function resolveDocumentUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const base = API_BASE_URL.replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

export function getAttachments(doc) {
  const raw = doc?.documents;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (raw.data) return Array.isArray(raw.data) ? raw.data : [raw.data];
  return [];
}

export async function fetchClientDocuments() {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/auth/client/documents?_=${Date.now()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load documents");
  }

  const json = await response.json();
  return json.data || [];
}
