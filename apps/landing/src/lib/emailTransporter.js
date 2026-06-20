import nodemailer from "nodemailer";

/** Shared SMTP transporter for landing-site transactional emails. */
export function createEmailTransporter() {
  const user = process.env.EMAIL_USER || "hiten@xtrawrkx.com";
  const pass = process.env.EMAIL_PASS || "yhws dmzi qtcc icgr";

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}
