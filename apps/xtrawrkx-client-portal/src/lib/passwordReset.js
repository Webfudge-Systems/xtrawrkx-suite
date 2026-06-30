import { PORTAL_SITE } from "./site";

/** Reset-password landing page on the Client Portal (linked from reset emails). */
export function getClientPortalPasswordResetUrl() {
  return `${PORTAL_SITE.url}/auth/reset-password`;
}
