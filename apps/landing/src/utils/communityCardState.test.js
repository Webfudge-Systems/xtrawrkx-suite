import { describe, expect, it } from "vitest";
import {
  deriveHasClientAccount,
  getCommunityCardState,
  getProfileCommunitySurfaceState,
} from "./communityCardState";

const ALL_STATUSES = [
  "REGISTERED",
  "COMMUNITY_MEMBER",
  "COMMUNITY_PAID",
  "COMMUNITY_NON_PAID",
  "ON_HOLD",
  "LOST",
  "STOPPED",
  "ACTIVE",
  "INACTIVE",
  "CHURNED",
];

describe("getCommunityCardState", () => {
  it.each(ALL_STATUSES)("maps status %s with stable ctaAction", (status) => {
    const state = getCommunityCardState(status, "ONBOARDING", true);
    expect(state.title).toBeTruthy();
    expect(state.ctaLabel).toBeTruthy();
    expect(state.ctaAction).toBeTruthy();
    expect(state.tone).toBeTruthy();
  });

  it("maps REGISTERED + ONBOARDING to Continue Onboarding", () => {
    const state = getCommunityCardState("REGISTERED", "ONBOARDING", true);
    expect(state.title).toBe("Complete community onboarding");
    expect(state.ctaLabel).toBe("Continue Onboarding");
    expect(state.ctaAction).toBe("join_community");
  });

  it("maps REGISTERED + non-ONBOARDING source to Join Community", () => {
    const manual = getCommunityCardState("REGISTERED", "MANUAL", true);
    const api = getCommunityCardState("REGISTERED", "API", true);
    expect(manual.ctaLabel).toBe("Join Community");
    expect(api.ctaLabel).toBe("Join Community");
    expect(manual.ctaAction).toBe("join_community");
  });

  it("maps REGISTERED + IMPORT to Join Community", () => {
    const state = getCommunityCardState("REGISTERED", "IMPORT", true);
    expect(state.ctaLabel).toBe("Join Community");
  });

  it("maps COMMUNITY_MEMBER to manage membership", () => {
    const state = getCommunityCardState("COMMUNITY_MEMBER", "MANUAL", true);
    expect(state.title).toBe("Community member");
    expect(state.ctaLabel).toBe("Manage Membership");
    expect(state.ctaAction).toBe("manage_membership");
  });

  it("maps COMMUNITY_PAID", () => {
    const state = getCommunityCardState("COMMUNITY_PAID", "ONBOARDING", true);
    expect(state.title).toBe("Paid member");
    expect(state.ctaLabel).toBe("View Plan");
    expect(state.ctaAction).toBe("view_plan");
  });

  it("maps COMMUNITY_NON_PAID", () => {
    const state = getCommunityCardState("COMMUNITY_NON_PAID", "ONBOARDING", true);
    expect(state.title).toBe("Free member");
    expect(state.ctaLabel).toBe("Upgrade");
    expect(state.ctaAction).toBe("upgrade_membership");
  });

  it("maps ON_HOLD", () => {
    const state = getCommunityCardState("ON_HOLD", "ONBOARDING", true);
    expect(state.title).toBe("Membership on hold");
    expect(state.ctaLabel).toBe("Reactivate");
    expect(state.ctaAction).toBe("reactivate_membership");
  });

  it("maps LOST and STOPPED to inactive", () => {
    const lostState = getCommunityCardState("LOST", "MANUAL", true);
    const stoppedState = getCommunityCardState("STOPPED", "MANUAL", true);
    expect(lostState.title).toBe("Membership inactive");
    expect(stoppedState.title).toBe("Membership inactive");
    expect(lostState.ctaLabel).toBe("Contact Support");
    expect(stoppedState.ctaLabel).toBe("Contact Support");
    expect(lostState.ctaAction).toBe("contact_support");
    expect(stoppedState.ctaAction).toBe("contact_support");
  });

  it("supports legacy ACTIVE fallback", () => {
    const state = getCommunityCardState("ACTIVE", "IMPORT", true);
    expect(state.title).toBe("Community member");
    expect(state.ctaLabel).toBe("Manage Membership");
    expect(state.ctaAction).toBe("manage_membership");
  });

  it("supports legacy INACTIVE and CHURNED fallback", () => {
    const inactiveState = getCommunityCardState("INACTIVE", "IMPORT", true);
    const churnedState = getCommunityCardState("CHURNED", "IMPORT", true);
    expect(inactiveState.title).toBe("Membership inactive");
    expect(churnedState.title).toBe("Membership inactive");
    expect(inactiveState.ctaLabel).toBe("Contact Support");
    expect(churnedState.ctaLabel).toBe("Contact Support");
  });

  it("returns recovery state when client-account is missing", () => {
    const state = getCommunityCardState("REGISTERED", "ONBOARDING", false);
    expect(state.title).toBe("Setting up your community profile");
    expect(state.ctaLabel).toBe("Retry Setup");
    expect(state.ctaAction).toBe("retry_setup");
  });

  it("recovery state ignores status until client-account exists", () => {
    const state = getCommunityCardState("COMMUNITY_PAID", "API", false);
    expect(state.title).toBe("Setting up your community profile");
    expect(state.ctaAction).toBe("retry_setup");
  });

  it("returns unavailable fallback for unknown status", () => {
    const state = getCommunityCardState("SOMETHING_NEW", "API", true);
    expect(state.title).toBe("Community status unavailable");
    expect(state.ctaLabel).toBe("Refresh");
    expect(state.ctaAction).toBe("refresh_status");
  });

  it("returns unavailable fallback for null status", () => {
    const state = getCommunityCardState(null, null, true);
    expect(state.title).toBe("Community status unavailable");
    expect(state.ctaLabel).toBe("Refresh");
  });

  it("returns unavailable fallback for empty string status", () => {
    const state = getCommunityCardState("   ", "ONBOARDING", true);
    expect(state.title).toBe("Community status unavailable");
    expect(state.ctaAction).toBe("refresh_status");
  });

  it("normalizes status and source case-insensitively", () => {
    const state = getCommunityCardState("community_paid", "onboarding", true);
    expect(state.title).toBe("Paid member");
    const reg = getCommunityCardState("registered", "OnBoarding", true);
    expect(reg.ctaLabel).toBe("Continue Onboarding");
  });
});

describe("getProfileCommunitySurfaceState", () => {
  it("shows client portal CTA when user has client-account but no community", () => {
    const state = getProfileCommunitySurfaceState({
      hasClientAccount: true,
      hasCommunity: false,
      loadingError: null,
      status: "REGISTERED",
      source: "ONBOARDING",
    });
    expect(state.title).toBe("Join the community");
    expect(state.ctaLabel).toBe("Join community");
    expect(state.ctaAction).toBe("client_portal_community");
  });

  it("shows view your community CTA when user is in a community", () => {
    const state = getProfileCommunitySurfaceState({
      hasClientAccount: true,
      hasCommunity: true,
      loadingError: null,
      status: "COMMUNITY_MEMBER",
      source: "ONBOARDING",
    });
    expect(state.title).toBe("Community");
    expect(state.ctaLabel).toBe("Open client portal");
    expect(state.ctaAction).toBe("view_client_portal_community");
  });

  it("uses compact header copy when memberships are returned (names appear on cards)", () => {
    const state = getProfileCommunitySurfaceState({
      hasClientAccount: true,
      hasCommunity: true,
      loadingError: null,
      status: "REGISTERED",
      source: "WEBSITE",
      memberships: [
        { id: 1, community: "XEN", label: "XEN" },
        { id: 2, community: "XEVTG", label: "XEVTG" },
      ],
    });
    expect(state.title).toBe("Communities");
    expect(state.description).toContain("Tap a card");
    expect(state.description).toContain("New tab");
    expect(state.ctaLabel).toBe("Open client portal");
    expect(state.ctaAction).toBe("view_client_portal_community");
  });

  it("preserves recovery when client-account is missing", () => {
    const state = getProfileCommunitySurfaceState({
      hasClientAccount: false,
      hasCommunity: false,
      loadingError: null,
      status: "REGISTERED",
      source: "ONBOARDING",
    });
    expect(state.title).toBe("Setting up your community profile");
    expect(state.ctaAction).toBe("retry_setup");
  });

  it("surfaces fetch errors with refresh CTA", () => {
    const state = getProfileCommunitySurfaceState({
      hasClientAccount: true,
      hasCommunity: false,
      loadingError: "Upstream timeout",
      status: "REGISTERED",
      source: "ONBOARDING",
    });
    expect(state.description).toBe("Upstream timeout");
    expect(state.ctaAction).toBe("refresh_status");
  });
});

describe("deriveHasClientAccount", () => {
  it("returns true when communityStatus is null (pre-fetch)", () => {
    expect(deriveHasClientAccount(null)).toBe(true);
    expect(deriveHasClientAccount(undefined)).toBe(true);
  });

  it("returns true when loadingError is set (avoid false recovery)", () => {
    expect(
      deriveHasClientAccount({
        loadingError: "Network error",
        hasClientAccount: false,
      })
    ).toBe(true);
  });

  it("uses explicit hasClientAccount from API", () => {
    expect(deriveHasClientAccount({ hasClientAccount: false })).toBe(false);
    expect(deriveHasClientAccount({ hasClientAccount: true })).toBe(true);
  });

  it("falls back to clientAccount object when hasClientAccount omitted", () => {
    expect(
      deriveHasClientAccount({
        clientAccount: { id: 1, status: "REGISTERED" },
      })
    ).toBe(true);
    expect(
      deriveHasClientAccount({
        clientAccount: null,
      })
    ).toBe(false);
  });
});
