/** Production xtrawrkx marketing site (Next.js + Firebase events API). */
export const PRODUCTION_WEBSITE_URL = "https://xtrawrkx.com";

const DEV_LOCAL_WEBSITE_URL = "http://localhost:3000";

/**
 * Base URL for event images and external links to the marketing site.
 */
export function getWebsiteBaseUrl() {
  const explicit =
    process.env.NEXT_PUBLIC_XTRAWRKX_WEBSITE_URL ||
    process.env.NEXT_PUBLIC_WEBSITE_URL;
  if (explicit) {
    return String(explicit).replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_WEBSITE_URL;
  }
  return DEV_LOCAL_WEBSITE_URL;
}

/**
 * Upstream bases to try when proxying API calls (local dev, then production).
 */
export function getWebsiteUpstreamCandidates() {
  const primary = getWebsiteBaseUrl();
  if (primary === PRODUCTION_WEBSITE_URL) {
    return [primary];
  }
  return [primary, PRODUCTION_WEBSITE_URL];
}

/**
 * Fetch a path on the marketing site API, with production fallback in development.
 */
export async function fetchWebsiteUpstream(pathWithQuery, init = {}) {
  const candidates = getWebsiteUpstreamCandidates();
  let lastError;

  for (const base of candidates) {
    const url = `${base}${pathWithQuery}`;
    try {
      const res = await fetch(url, { ...init, cache: "no-store" });
      if (res.ok) return res;
      if (res.status < 500) return res;
      lastError = new Error(
        `Events upstream returned ${res.status} (${base})`
      );
    } catch (err) {
      lastError = err;
    }
  }

  const hint =
    candidates.length > 1
      ? " Start the marketing site (`client` app on port 3000) or set NEXT_PUBLIC_XTRAWRKX_WEBSITE_URL."
      : "";
  throw new Error(
    (lastError?.message || "Could not reach the events service.") + hint
  );
}
