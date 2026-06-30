import { createEmailTransporter } from "./transporter.js";
import { getEventsTransactionalMailOptions } from "./transactional.js";

export function getPasswordResetEmailTemplate({ email, resetLink }) {
  const subject = "Reset your xtrawrkx password";

  const text = [
    "We received a request to reset the password for your xtrawrkx account.",
    "",
    `Sign-in email: ${email}`,
    "",
    `Reset your password: ${resetLink}`,
    "",
    "This link expires in 1 hour. If you did not request a reset, you can ignore this email.",
    "",
    "— xtrawrkx",
  ].join("\n");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset your password</title>
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
        .info-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin: 24px 0; font-size: 14px; }
        .btn-wrap { text-align: center; margin: 28px 0 8px; }
        .btn { display: inline-block; padding: 14px 32px; background: #ea580c; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
        .footer { background: #f9fafb; padding: 24px 28px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; }
        .footer a { color: #ea580c; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <h1>Reset your password</h1>
            <p>xtrawrkx account access</p>
          </div>
          <div class="content">
            <h2>Password reset requested</h2>
            <p>
              We received a request to reset the password for your xtrawrkx account.
              Click the button below to choose a new password.
            </p>
            <div class="info-box">
              <strong>Sign-in email:</strong> ${email}
            </div>
            <div class="btn-wrap">
              <a href="${resetLink}" class="btn">Reset password</a>
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              This link expires in 1 hour. If you did not request a password reset,
              you can safely ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>If the button does not work, copy and paste this link into your browser:</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, text, html };
}

export async function sendPasswordResetEmail({ email, resetLink }) {
  const transporter = createEmailTransporter();
  const { from, replyTo } = getEventsTransactionalMailOptions();
  const { subject, text, html } = getPasswordResetEmailTemplate({ email, resetLink });

  await transporter.sendMail({
    from,
    replyTo,
    to: email,
    subject,
    text,
    html,
  });
}
