const CRM_PORTAL_URL =
  process.env.NEXT_PUBLIC_CRM_PORTAL_URL || "http://localhost:3001";

/** Local client portal (sign-in / join community). Override in production with NEXT_PUBLIC_CLIENT_PORTAL_URL. */
const CLIENT_PORTAL_URL =
  process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL || "http://localhost:3002";

/** Path on the client portal host for sign-in (Next.js app route). */
const CLIENT_PORTAL_AUTH_PATH =
  process.env.NEXT_PUBLIC_CLIENT_PORTAL_AUTH_PATH || "/auth";

/** Protected dashboard route after sign-in (must match client-portal app). */
const CLIENT_PORTAL_DASHBOARD_PATH =
  process.env.NEXT_PUBLIC_CLIENT_PORTAL_DASHBOARD_PATH || "/dashboard";

/** Communities list in client portal (member workspaces). */
const CLIENT_PORTAL_COMMUNITIES_PATH =
  process.env.NEXT_PUBLIC_CLIENT_PORTAL_COMMUNITIES_PATH || "/communities";

/** Path on the CRM host for sign-in. */
const CRM_PORTAL_LOGIN_PATH = process.env.NEXT_PUBLIC_CRM_PORTAL_LOGIN_PATH || "/login";

/**
 * @param {{ email?: string | null, intent?: string | null }} [query] — email may be a legacy string-only argument
 */
function buildUrl(base, path, query) {
  const normalizedBase = String(base || "").replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const q =
    typeof query === "string"
      ? { email: query }
      : query && typeof query === "object"
        ? query
        : {};
  const email = q.email;
  const intent = q.intent;

  try {
    const url = new URL(`${normalizedBase}${normalizedPath}`);
    if (email && typeof email === "string" && email.includes("@")) {
      url.searchParams.set("email", email.trim());
      url.searchParams.set("from", "xtrawrkx-website");
    }
    if (intent && typeof intent === "string" && intent.trim()) {
      url.searchParams.set("intent", intent.trim());
    }
    return url.toString();
  } catch {
    return `${normalizedBase}${normalizedPath}`;
  }
}

/**
 * @param {string} url
 * @param {boolean} [newTab]
 */
function goToPortalUrl(url, newTab = false) {
  if (typeof window === "undefined") return;
  if (newTab) {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    // Never assign `window.location` here: if this runs after an `await`, the
    // popup is often blocked and we must not navigate the current (website) tab.
    if (!opened) {
      return;
    }
  } else {
    window.location.href = url;
  }
}

export const communityPortalService = {
  getCrmPortalUrl() {
    return CRM_PORTAL_URL;
  },

  getClientPortalUrl() {
    return CLIENT_PORTAL_URL;
  },

  /**
   * Auth URL string (no navigation). Use when you must `await` before opening:
   * open `about:blank` synchronously from the click handler, then set
   * `tab.location.href` to this URL after async work.
   *
   * @param {{ email?: string | null, intent?: string | null }} [options]
   */
  getClientPortalAuthUrl(options = {}) {
    const email = options.email || null;
    const intent = options.intent || null;
    return buildUrl(CLIENT_PORTAL_URL, CLIENT_PORTAL_AUTH_PATH, {
      email,
      intent,
    });
  },

  /**
   * Deep-link URL string for a path on the client portal host.
   *
   * @param {string} path
   * @param {{ email?: string | null, intent?: string | null }} [options]
   */
  getClientPortalAtUrl(path, options = {}) {
    const normalized =
      path && String(path).startsWith("/") ? String(path) : `/${path || ""}`;
    const email = options.email || null;
    const intent = options.intent || null;
    return buildUrl(CLIENT_PORTAL_URL, normalized, { email, intent });
  },

  /**
   * @param {Window | null} tab — return value of synchronous `window.open("about:blank", "_blank")`
   * @param {string} url
   */
  assignPreparedPortalTab(tab, url) {
    if (typeof window === "undefined" || !tab || tab.closed || !url) {
      return false;
    }
    try {
      tab.opener = null;
    } catch {
      // ignore
    }
    tab.location.href = url;
    return true;
  },

  /**
   * @param {{ email?: string | null }} [options] — prefills CRM login when email is set
   */
  openCrmPortal(options = {}) {
    if (typeof window === "undefined") return;
    const email = options.email || null;
    window.location.href = buildUrl(CRM_PORTAL_URL, CRM_PORTAL_LOGIN_PATH, {
      email,
    });
  },

  /**
   * @param {{ email?: string | null, intent?: string | null, newTab?: boolean }} [options] — prefills client portal sign-in when email is set; optional intent for auth UI (e.g. complete-setup)
   */
  openClientPortal(options = {}) {
    const email = options.email || null;
    const intent = options.intent || null;
    const newTab = Boolean(options.newTab);
    const url = buildUrl(CLIENT_PORTAL_URL, CLIENT_PORTAL_AUTH_PATH, {
      email,
      intent,
    });
    goToPortalUrl(url, newTab);
  },

  /**
   * Deep-link into the client portal (e.g. /dashboard, /communities/1).
   * Prefills email on auth when the target requires sign-in.
   *
   * @param {string} path
   * @param {{ email?: string | null, intent?: string | null, newTab?: boolean }} [options]
   */
  openClientPortalAt(path, options = {}) {
    const normalized =
      path && String(path).startsWith("/") ? String(path) : `/${path || ""}`;
    const email = options.email || null;
    const intent = options.intent || null;
    const newTab = Boolean(options.newTab);
    const url = buildUrl(CLIENT_PORTAL_URL, normalized, {
      email,
      intent,
    });
    goToPortalUrl(url, newTab);
  },

  openClientPortalDashboard(options = {}) {
    this.openClientPortalAt(CLIENT_PORTAL_DASHBOARD_PATH, options);
  },

  openClientPortalCommunities(options = {}) {
    const intent =
      options.intent != null && String(options.intent).trim() !== ""
        ? String(options.intent).trim()
        : "communities";
    this.openClientPortalAt(CLIENT_PORTAL_COMMUNITIES_PATH, {
      ...options,
      intent,
    });
  },

  /**
   * @param {{ email?: string | null, portalId?: number | string | null, community?: string | null, newTab?: boolean, intent?: string | null }} options
   */
  openClientPortalCommunity(options = {}) {
    const id = options.portalId;
    const path =
      id != null && String(id).trim() !== ""
        ? `/communities/${String(id).trim()}`
        : "/communities";
    const intent =
      options.intent != null && String(options.intent).trim() !== ""
        ? String(options.intent).trim()
        : "communities";
    this.openClientPortalAt(path, {
      email: options.email || null,
      newTab: options.newTab,
      intent,
    });
  },
};
