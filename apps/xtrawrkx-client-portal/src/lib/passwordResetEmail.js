import { sendPasswordResetEmail } from "@webfudge/utils/email";
import { getClientPortalPasswordResetUrl } from "./passwordReset";

export function getPasswordResetContinueUrl(overrideUrl) {
  const custom = String(overrideUrl || "").trim();
  if (custom) {
    try {
      const parsed = new URL(custom);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return custom.replace(/\/$/, "");
      }
    } catch {
      // fall through
    }
  }
  return getClientPortalPasswordResetUrl();
}

export async function sendPortalPasswordResetEmail({ email, resetLink }) {
  return sendPasswordResetEmail({ email, resetLink });
}
