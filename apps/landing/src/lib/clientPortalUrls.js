const CLIENT_PORTAL_URL =
  process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3002"
    : "https://portal.xtrawrkx.com");

const CLIENT_PORTAL_AUTH_PATH =
  process.env.NEXT_PUBLIC_CLIENT_PORTAL_AUTH_PATH || "/auth";

const CLIENT_PORTAL_DASHBOARD_PATH =
  process.env.NEXT_PUBLIC_CLIENT_PORTAL_DASHBOARD_PATH || "/dashboard";

export function buildClientPortalAuthUrl(email) {
  const base = String(CLIENT_PORTAL_URL).replace(/\/$/, "");
  const path = CLIENT_PORTAL_AUTH_PATH.startsWith("/")
    ? CLIENT_PORTAL_AUTH_PATH
    : `/${CLIENT_PORTAL_AUTH_PATH}`;

  try {
    const url = new URL(`${base}${path}`);
    if (email && String(email).includes("@")) {
      url.searchParams.set("email", String(email).trim());
      url.searchParams.set("from", "xtrawrkx-website");
      url.searchParams.set("intent", "onboarding");
    }
    return url.toString();
  } catch {
    return `${base}${path}`;
  }
}

export function buildClientPortalDashboardUrl(email) {
  const base = String(CLIENT_PORTAL_URL).replace(/\/$/, "");
  const path = CLIENT_PORTAL_DASHBOARD_PATH.startsWith("/")
    ? CLIENT_PORTAL_DASHBOARD_PATH
    : `/${CLIENT_PORTAL_DASHBOARD_PATH}`;

  try {
    const url = new URL(`${base}${path}`);
    if (email && String(email).includes("@")) {
      url.searchParams.set("email", String(email).trim());
      url.searchParams.set("from", "xtrawrkx-website");
    }
    return url.toString();
  } catch {
    return `${base}${path}`;
  }
}
