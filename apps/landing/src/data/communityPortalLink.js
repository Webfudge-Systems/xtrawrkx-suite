/**
 * Client-portal `/communities/[id]` ids — keep in sync with
 * `xtrawrkx-client-portal/src/data/communitiesCatalog.js`.
 */
export const COMMUNITY_ENUM_TO_PORTAL_ID = {
  XEN: 1,
  XEVFIN: 2,
  XEVTG: 3,
  XDD: 4,
};

export function portalCommunityIdFromMembership(membership) {
  if (!membership || typeof membership !== "object") return null;
  if (membership.portalId != null && membership.portalId !== "") {
    const n = Number(membership.portalId);
    return Number.isFinite(n) ? n : null;
  }
  const code = String(membership.community || "").trim().toUpperCase();
  return COMMUNITY_ENUM_TO_PORTAL_ID[code] ?? null;
}
