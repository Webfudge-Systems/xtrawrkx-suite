import { createEmailTransporter } from "./emailTransporter";
import { getAccountTransactionalMailOptions } from "./transactionalEmail";
import {
  buildClientPortalAuthUrl,
  buildClientPortalDashboardUrl,
} from "./clientPortalUrls";

export { buildClientPortalAuthUrl, buildClientPortalDashboardUrl };

export function getAccountOnboardingEmailTemplate(data) {
  const {
    primaryContactName,
    companyName,
    primaryContactEmail,
    portalUrl,
    dashboardUrl,
  } = data;

  const greetingName =
    primaryContactName && String(primaryContactName).trim()
      ? primaryContactName
      : "there";

  const subject = `Welcome to xtrawrkx — your onboarding is confirmed`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Onboarding Confirmed</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
        .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%); color: white; padding: 36px 28px; text-align: center; }
        .header h1 { margin: 0 0 8px; font-size: 26px; font-weight: 700; }
        .header p { margin: 0; opacity: 0.95; font-size: 15px; }
        .content { padding: 32px 28px; }
        .content h2 { margin: 0 0 12px; font-size: 20px; color: #111827; }
        .content p { margin: 0 0 16px; color: #4b5563; }
        .info-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin: 24px 0; }
        .info-row { margin: 8px 0; font-size: 14px; }
        .info-label { font-weight: 600; color: #9a3412; }
        .steps { background: #f9fafb; border-radius: 8px; padding: 20px 20px 20px 12px; margin: 24px 0; }
        .steps h3 { margin: 0 0 12px; font-size: 16px; color: #111827; }
        .steps ol { margin: 0; padding-left: 20px; color: #374151; }
        .steps li { margin-bottom: 10px; }
        .btn-wrap { text-align: center; margin: 28px 0 8px; }
        .btn { display: inline-block; padding: 14px 32px; background: #ea580c; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
        .btn-secondary { display: inline-block; margin-top: 12px; color: #ea580c !important; text-decoration: none; font-size: 14px; }
        .footer { background: #f9fafb; padding: 24px 28px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; }
        .footer a { color: #ea580c; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <h1>Welcome to xtrawrkx</h1>
            <p>Your account and onboarding workspace are ready</p>
          </div>

          <div class="content">
            <h2>Hello ${greetingName},</h2>
            <p>
              Thank you for creating your account on xtrawrkx. We've set up your company profile
              and onboarding workspace${companyName ? ` for <strong>${companyName}</strong>` : ""}.
            </p>
            <p>
              You can sign in to the <strong>Client Portal</strong> anytime to manage projects,
              communities, and your company profile.
            </p>

            <div class="info-box">
              <div class="info-row"><span class="info-label">Sign-in email:</span> ${primaryContactEmail}</div>
              ${companyName ? `<div class="info-row"><span class="info-label">Company:</span> ${companyName}</div>` : ""}
            </div>

            <div class="btn-wrap">
              <a href="${portalUrl}" class="btn">Open Client Portal</a>
              <br>
              <a href="${dashboardUrl}" class="btn-secondary">Go to dashboard after sign-in →</a>
            </div>

            <div class="steps">
              <h3>Your next steps</h3>
              <ol>
                <li><strong>Sign in</strong> to the Client Portal using the email and password you created on xtrawrkx.com.</li>
                <li><strong>Complete your profile</strong> — add company details, team members, and contact information.</li>
                <li><strong>Explore communities</strong> — discover and join relevant xtrawrkx communities for your industry.</li>
                <li><strong>Track onboarding</strong> — your onboarding project is ready in the portal; our team will guide you from there.</li>
              </ol>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
              If you have questions, reply to this email or contact us at
              <a href="mailto:info@xtrawrkx.com" style="color: #ea580c;">info@xtrawrkx.com</a>.
            </p>
          </div>

          <div class="footer">
            <p><strong>xtrawrkx</strong><br>Empowering Professional Growth</p>
            <p>
              <a href="https://xtrawrkx.com">xtrawrkx.com</a>
              &nbsp;·&nbsp;
              <a href="mailto:info@xtrawrkx.com">info@xtrawrkx.com</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

/**
 * Send onboarding confirmation to the user's personal email after website signup.
 * Best-effort: failures are logged and do not block account creation.
 *
 * @param {{ email: string, firstName?: string, lastName?: string, displayName?: string, companyName?: string }} params
 */
export async function sendAccountOnboardingEmail(params) {
  const email = String(params?.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, skipped: true, error: "Invalid email." };
  }

  const firstName = String(params?.firstName || "").trim();
  const lastName = String(params?.lastName || "").trim();
  const displayName = String(params?.displayName || "").trim();
  const primaryContactName =
    displayName || [firstName, lastName].filter(Boolean).join(" ") || email.split("@")[0];
  const companyName = String(params?.companyName || params?.company || "").trim();

  const portalUrl = buildClientPortalAuthUrl(email);
  const dashboardUrl = buildClientPortalDashboardUrl(email);
  const emailTemplate = getAccountOnboardingEmailTemplate({
    primaryContactName,
    companyName,
    primaryContactEmail: email,
    portalUrl,
    dashboardUrl,
  });

  const { from, replyTo } = getAccountTransactionalMailOptions();
  const transporter = createEmailTransporter();

  await transporter.sendMail({
    from,
    replyTo,
    to: email,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
  });

  return { ok: true, skipped: false, recipient: email };
}
