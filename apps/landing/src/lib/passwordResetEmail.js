import { sendPasswordResetEmail as sendSharedPasswordResetEmail } from "@webfudge/utils/email";

function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://xtrawrkx.com"
  ).replace(/\/$/, "");
}

export function getPasswordResetContinueUrl(overrideUrl) {
  const custom = String(overrideUrl || "").trim();
  if (custom) {
    try {
      const parsed = new URL(custom);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return custom.replace(/\/$/, "");
      }
    } catch {
      // fall through to default
    }
  }
  return `${getAppBaseUrl()}/auth/reset-password`;
}

export { getPasswordResetEmailTemplate } from "@webfudge/utils/email";

export async function sendPasswordResetEmail({ email, resetLink }) {
  return sendSharedPasswordResetEmail({ email, resetLink });
}
