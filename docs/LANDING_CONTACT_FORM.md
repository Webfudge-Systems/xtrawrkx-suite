# Landing Contact Form

## Summary

The landing page **Get in Touch** form submits to a Next.js API route that sends lead notifications to **webfugesystems@gmail.com** via Gmail SMTP (Nodemailer).

## Scope

- `apps/landing/app/api/contact/route.ts` — POST handler, validation, email send
- `apps/landing/components/sections/home/ContactSection.tsx` — client submit, loading/error/success UI
- `apps/landing/components/sections/home/Footer.tsx` — public contact email updated
- `apps/landing/.env.example` — required env vars

## Setup

1. Copy env vars into `apps/landing/.env.local` (or your host’s env UI):

   ```bash
   GMAIL_USER=webfugesystems@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```

2. Create a **Google App Password** for the Gmail account ([Google Account → Security → App passwords](https://myaccount.google.com/apppasswords)). 2-Step Verification must be enabled.

3. Restart the landing dev server after changing env.

Optional:

```bash
CONTACT_TO_EMAIL=webfugesystems@gmail.com
```

## Behavior

- **POST** `/api/contact` with JSON: `{ name, company?, email, website? }`
- `website` is a honeypot; if filled, the API returns success without sending (spam trap).
- Valid submissions email the inbox with subject `Call request: {name}` and **Reply-To** set to the visitor’s work email.
- Missing `GMAIL_USER` / `GMAIL_APP_PASSWORD` returns **503** with a user-facing message and a mailto fallback link.

## Usage

Run the landing app (`npm run dev` from repo root or `apps/landing`), fill the form on `/` or `/contact`, and confirm the message arrives at the configured inbox.
