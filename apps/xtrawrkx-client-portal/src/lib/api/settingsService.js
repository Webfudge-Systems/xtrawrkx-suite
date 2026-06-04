import { STRAPI_BASE_URL } from "@/config/api";

function getAuthToken() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("client_token") || localStorage.getItem("auth_token")
  );
}

function authHeaders(json = true) {
  const token = getAuthToken();
  const headers = {};
  if (json) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

export const TIMEZONE_OPTIONS = [
  { value: "America/Los_Angeles", label: "UTC-8 (Pacific Time)" },
  { value: "America/Denver", label: "UTC-7 (Mountain Time)" },
  { value: "America/Chicago", label: "UTC-6 (Central Time)" },
  { value: "America/New_York", label: "UTC-5 (Eastern Time)" },
  { value: "UTC", label: "UTC+0 (GMT)" },
  { value: "Europe/London", label: "UTC+0 (London)" },
  { value: "Europe/Paris", label: "UTC+1 (Central European Time)" },
  { value: "Asia/Kolkata", label: "UTC+5:30 (India)" },
  { value: "Asia/Singapore", label: "UTC+8 (Singapore)" },
];

/**
 * Load profile + preferences for the settings page.
 */
export async function fetchSettingsProfile() {
  const response = await fetch(
    `${STRAPI_BASE_URL}/api/auth/me?_=${Date.now()}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    }
  );

  const data = await parseJsonResponse(response);

  if (data.type !== "client" || !data.profile) {
    throw new Error("Could not load client profile settings");
  }

  return {
    account: data.account,
    profile: data.profile,
    contacts: data.contacts || [],
  };
}

/**
 * @param {object} payload
 */
export async function updateSettingsProfile(payload) {
  const response = await fetch(`${STRAPI_BASE_URL}/api/auth/update-profile`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonResponse(response);

  if (typeof window !== "undefined" && data.profile) {
    const existingRaw = localStorage.getItem("client_account");
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    localStorage.setItem(
      "client_account",
      JSON.stringify({
        ...existing,
        phone: data.profile.phone || existing.phone,
        onboardingData: {
          ...(existing.onboardingData || {}),
          bio: data.profile.bio,
          preferences: {
            ...((existing.onboardingData || {}).preferences || {}),
            timezone: data.profile.timezone,
            notifications: data.profile.notifications,
            appearance: data.profile.appearance,
            language: data.profile.language,
          },
        },
      })
    );
  }

  return data;
}

export async function changeSettingsPassword(currentPassword, newPassword) {
  const response = await fetch(`${STRAPI_BASE_URL}/api/auth/change-password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  return parseJsonResponse(response);
}

/**
 * @param {File} file
 */
export async function uploadSettingsAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch(`${STRAPI_BASE_URL}/api/auth/upload-avatar`, {
    method: "POST",
    headers: authHeaders(false),
    body: formData,
  });

  return parseJsonResponse(response);
}

export function resolveAvatarSrc(avatarUrl) {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http")) return avatarUrl;
  return `${STRAPI_BASE_URL}${avatarUrl.startsWith("/") ? "" : "/"}${avatarUrl}`;
}
