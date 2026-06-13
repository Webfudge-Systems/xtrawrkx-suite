# Fudge Suite Branding Update

## Summary

Aligned workspace apps to **Option A — Fudge Suite** branding: each app is a named Xtrawrkx internal product with a subtle **by Webfudge Systems** credit. Shared **Xtrawrkx favicons** (`public/favicon_io/`) and **full logo** (`public/logo/xtrawrkx_logo_full.png`) are used across all suite apps except Organization Manager.

## Scope

| App | Product name | Config |
|-----|--------------|--------|
| CRM | Fudge Grow | `apps/crm/lib/site.js` |
| PM | Fudge Work | `apps/pm/lib/site.js` |
| Accounts | Fudge Base | `apps/accounts/lib/site.js` |
| Books | Fudge Books | `apps/books/lib/site.ts` |
| Client portal | Xtrawrkx Client Portal | `apps/xtrawrkx-client-portal/src/lib/site.js` |
| Landing | xtrawrkx | `apps/landing/app/layout.jsx` |

## Shared assets (xtrawrkx apps)

All suite apps except **Organization Manager** use the same public asset layout:

| Asset | Path |
|-------|------|
| Favicon set | `public/favicon_io/` (source: `apps/crm/public/favicon_io`) |
| Full logo | `public/logo/xtrawrkx_logo_full.png` |
| App Router tab icon | `app/favicon.ico` + `app/apple-icon.png` (copied from `favicon_io/`) |
| Metadata helper | `xtrawrkxMetadataIcons()` + `FUDGE_SUITE_ASSETS.xtrawrkx` from `@webfudge/utils` |

**Organization Manager** keeps Webfudge branding — see [ORBIT_WEBFUDGE_BRANDING.md](./ORBIT_WEBFUDGE_BRANDING.md).

## Visual pattern

- **Sidebar / login icon:** Xtrawrkx mark from `public/favicon_io/` (e.g. `android-chrome-512x512.png`)
- **Full brand logo:** `public/logo/xtrawrkx_logo_full.png` (Xtrawrkx)
- **Creator logo:** `public/logo/Vertical logo 1 bg removed.png` (Webfudge Systems)
- **Browser tab / PWA:** `public/favicon_io/` (Xtrawrkx)
- **Webfudge favicon set:** `public/favicon/` (Webfudge Systems — vendor assets)
- **Primary title:** Product name (e.g. Fudge Grow)
- **Secondary line:** `by Webfudge Systems` (small, muted)

Shared paths live in `packages/utils/src/siteBranding.js` (`FUDGE_SUITE_ASSETS`).

## Key files per app

- `lib/site.js` (or `site.ts`) — single source for name, logo, creator line
- Sidebar header — product name + creator line
- Login page — top-left Xtrawrkx wordmark; product name + creator line as text only (`LoginBrandCorner`, `LoginProductCredit` in `@webfudge/ui`)
- `public/favicon_io/site.webmanifest` — PWA install name (Xtrawrkx)
- `public/favicon/site.webmanifest` — Webfudge Systems vendor manifest

## Not changed

- **Organization Manager** — Webfudge Systems branding unchanged (`apps/organization-manager`)
- Client-facing proposal/invoice defaults that reference Webfudge Systems as preparer company
