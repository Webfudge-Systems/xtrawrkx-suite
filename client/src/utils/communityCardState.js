const normalizeStatus = (status) => {
  if (!status || typeof status !== "string") {
    return "";
  }

  return status.trim().toUpperCase();
};

const normalizeSource = (source) => {
  if (!source || typeof source !== "string") {
    return "";
  }

  return source.trim().toUpperCase();
};

/** Exported for profile widgets that share tone styling with the community card. */
export const COMMUNITY_CARD_TONES = {
  positive: "positive",
  neutral: "neutral",
  warning: "warning",
  critical: "critical",
  info: "info",
};

const CARD_TONES = COMMUNITY_CARD_TONES;

const buildState = ({
  badge,
  title,
  description,
  ctaLabel,
  ctaAction,
  tone,
  heroTitle = null,
  headerSubtitle = null,
  panelTitle = null,
  panelBody = null,
}) => ({
  badge,
  title,
  description,
  ctaLabel,
  ctaAction,
  tone,
  heroTitle,
  headerSubtitle,
  panelTitle,
  panelBody,
});

/**
 * Resolves whether a website user has a linked `client-account` for card logic.
 * - null/undefined status payload: assume unknown (avoid a false "recovery" flash before fetch).
 * - fetch errors: treat as unknown so the card uses null-status / refresh messaging, not recovery.
 * - explicit false from API: recovery / retry setup.
 *
 * @param {object | null | undefined} communityStatus
 * @returns {boolean}
 */
export function deriveHasClientAccount(communityStatus) {
  if (communityStatus == null) {
    return true;
  }

  if (communityStatus.loadingError) {
    return true;
  }

  if (communityStatus.hasClientAccount !== undefined) {
    return Boolean(communityStatus.hasClientAccount);
  }

  return Boolean(communityStatus.clientAccount);
}

/**
 * Pure UI state for profile community widgets. Primary: `status`; secondary: `source`
 * (e.g. REGISTERED + ONBOARDING => "Continue Onboarding" vs "Join Community").
 *
 * @param {string | null | undefined} status
 * @param {string | null | undefined} source
 * @param {boolean} [hasClientAccount=true]
 * @returns {{ badge: string, title: string, description: string, ctaLabel: string, ctaAction: string, tone: string }}
 */
export function getCommunityCardState(status, source, hasClientAccount = true) {
  const normalizedStatus = normalizeStatus(status);
  const normalizedSource = normalizeSource(source);

  if (!hasClientAccount) {
    return buildState({
      badge: "Recovery",
      title: "Setting up your community profile",
      description:
        "Your website account exists, but your client account is still being provisioned. Retry setup to complete onboarding.",
      ctaLabel: "Retry Setup",
      ctaAction: "retry_setup",
      tone: CARD_TONES.warning,
    });
  }

  switch (normalizedStatus) {
    case "REGISTERED": {
      const isOnboardingSource = normalizedSource === "ONBOARDING";
      return buildState({
        badge: "Onboarding",
        title: "Complete community onboarding",
        description: isOnboardingSource
          ? "Your website registration is complete. Continue community onboarding to activate membership."
          : normalizedSource
            ? "Your client record is registered. Join the community workspace to finish onboarding."
            : "Your account is registered. Continue onboarding to unlock community membership.",
        ctaLabel: isOnboardingSource ? "Continue Onboarding" : "Join Community",
        ctaAction: "join_community",
        tone: CARD_TONES.info,
      });
    }
    case "COMMUNITY_MEMBER":
      return buildState({
        badge: "Member",
        title: "Community member",
        description:
          "Your membership is active. Open your member workspace to manage your community access.",
        ctaLabel: "Manage Membership",
        ctaAction: "manage_membership",
        tone: CARD_TONES.positive,
      });
    case "COMMUNITY_PAID":
      return buildState({
        badge: "Paid",
        title: "Paid member",
        description:
          "You are on a paid membership plan with full access to community features.",
        ctaLabel: "View Plan",
        ctaAction: "view_plan",
        tone: CARD_TONES.positive,
      });
    case "COMMUNITY_NON_PAID":
      return buildState({
        badge: "Free",
        title: "Free member",
        description:
          "You are on a free community membership. Upgrade anytime for expanded access.",
        ctaLabel: "Upgrade",
        ctaAction: "upgrade_membership",
        tone: CARD_TONES.neutral,
      });
    case "ON_HOLD":
      return buildState({
        badge: "Paused",
        title: "Membership on hold",
        description:
          "Your membership is currently paused. Reactivate to resume full community access.",
        ctaLabel: "Reactivate",
        ctaAction: "reactivate_membership",
        tone: CARD_TONES.warning,
      });
    case "LOST":
    case "STOPPED":
      return buildState({
        badge: "Inactive",
        title: "Membership inactive",
        description:
          "Your membership is inactive. Contact support to review next steps.",
        ctaLabel: "Contact Support",
        ctaAction: "contact_support",
        tone: CARD_TONES.critical,
      });
    case "ACTIVE":
      return buildState({
        badge: "Legacy",
        title: "Community member",
        description:
          "Your status is from a legacy model and is treated as member-compatible.",
        ctaLabel: "Manage Membership",
        ctaAction: "manage_membership",
        tone: CARD_TONES.positive,
      });
    case "INACTIVE":
    case "CHURNED":
      return buildState({
        badge: "Legacy",
        title: "Membership inactive",
        description:
          "Your status is from a legacy model and is treated as inactive. Contact support to continue.",
        ctaLabel: "Contact Support",
        ctaAction: "contact_support",
        tone: CARD_TONES.critical,
      });
    default:
      return buildState({
        badge: "Unknown",
        title: "Community status unavailable",
        description:
          "We could not determine your community status right now. Refresh to retry.",
        ctaLabel: "Refresh",
        ctaAction: "refresh_status",
        tone: CARD_TONES.neutral,
      });
  }
}

/**
 * Profile-page community widget: prioritize membership (CRM) vs onboarding (client portal),
 * while preserving recovery when `client-account` is missing and a clear error when status cannot load.
 */
export function getProfileCommunitySurfaceState({
  hasClientAccount,
  hasCommunity,
  loadingError,
  status,
  source,
  memberships = [],
}) {
  if (loadingError) {
    const fallback = getCommunityCardState(null, null, true);
    return {
      ...fallback,
      description: loadingError,
      heroTitle: "Status unavailable",
      headerSubtitle: "Check your connection and try again.",
      panelTitle: "Error",
      panelBody: loadingError,
    };
  }

  if (!hasClientAccount) {
    const base = getCommunityCardState(status, source, false);
    return {
      ...base,
      heroTitle: "Finish setup",
      headerSubtitle: "Your client workspace is still being provisioned.",
      panelTitle: "What this means",
      panelBody: base.description,
    };
  }

  if (!hasCommunity) {
    return buildState({
      badge: "Community",
      title: "Join the community",
      description:
        "Same email and password as here. Opens client portal sign-in with your email prefilled.",
      heroTitle: "Join us",
      headerSubtitle: "Member tools live in the client portal.",
      panelTitle: "What opens",
      panelBody:
        "We open client portal sign-in in a new tab with your email prefilled. Use the same password as on this site.",
      ctaLabel: "Join community",
      ctaAction: "client_portal_community",
      tone: CARD_TONES.info,
    });
  }

  const labels = memberships
    .map((m) => m.label || m.community)
    .filter(Boolean)
    .join(", ");

  const memberCount = memberships.length;

  if (memberCount > 0) {
    return buildState({
      badge: "Member",
      title: labels ? "Communities" : "Community",
      description: "Tap a card or the button. New tab.",
      heroTitle: labels ? "Your communities" : "Community",
      headerSubtitle:
        "Tap a community to open its workspace in the client portal, or use the button for the full list. Opens in a new tab with your email prefilled.",
      panelTitle: null,
      panelBody: null,
      ctaLabel: "Open client portal",
      ctaAction: "view_client_portal_community",
      tone: CARD_TONES.positive,
    });
  }

  return buildState({
    badge: "Member",
    title: "Community",
    description: "Opens in a new tab; email prefilled.",
    heroTitle: "Community",
    headerSubtitle: "You're connected.",
    panelTitle: "In the portal",
    panelBody:
      "Manage membership, settings, and billing in the client portal (new tab, email prefilled).",
    ctaLabel: "Open client portal",
    ctaAction: "view_client_portal_community",
    tone: CARD_TONES.positive,
  });
}

