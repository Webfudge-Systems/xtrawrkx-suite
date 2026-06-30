import nodemailer from "nodemailer";

/** SMTP credentials for xtrawrkx transactional email (events, password reset, onboarding). */
export function getEmailCredentials() {
  return {
    user: process.env.EMAIL_USER || "hiten@xtrawrkx.com",
    pass: process.env.EMAIL_PASS || "yhws dmzi qtcc icgr",
  };
}

export function getTransactionalEmailAddress() {
  return getEmailCredentials().user;
}

/** Shared Gmail SMTP transporter used by landing and client portal. */
export function createEmailTransporter() {
  const { user, pass } = getEmailCredentials();

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

let smtpVerified = null;
let smtpVerifiedAt = 0;
const SMTP_VERIFY_TTL_MS = 5 * 60 * 1000;

/** Returns true when Gmail SMTP credentials are accepted. Cached briefly to avoid repeated handshakes. */
export async function isSmtpConfigured() {
  const { user, pass } = getEmailCredentials();
  if (!user || !pass) return false;

  const now = Date.now();
  if (smtpVerified !== null && now - smtpVerifiedAt < SMTP_VERIFY_TTL_MS) {
    return smtpVerified;
  }

  try {
    const transporter = createEmailTransporter();
    await transporter.verify();
    smtpVerified = true;
  } catch {
    smtpVerified = false;
  }
  smtpVerifiedAt = now;
  return smtpVerified;
}
