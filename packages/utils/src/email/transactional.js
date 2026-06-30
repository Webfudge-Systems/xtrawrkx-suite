import { getTransactionalEmailAddress } from "./transporter.js";

/**
 * Event registration / payment emails use the xtrawrkx Events identity.
 * Password reset uses the same sender so clients recognize the email.
 */
export function getEventsTransactionalMailOptions() {
  const address = getTransactionalEmailAddress();
  return {
    from: `"xtrawrkx Events" <${address}>`,
    replyTo: "xsos@xtrawrkx.com",
  };
}

/** Account onboarding and general marketing account emails. */
export function getAccountTransactionalMailOptions() {
  const address = getTransactionalEmailAddress();
  return {
    from: `"xtrawrkx" <${address}>`,
    replyTo: "info@xtrawrkx.com",
  };
}
