# CRM & PM Progressive Web App (PWA) Update

## Summary

Webfudge **CRM** and **PM** are now installable Progressive Web Apps. Each app registers a service worker in production, ships an enhanced web manifest, shows an optional install banner when the browser supports it, and serves a dedicated offline page when navigation fails without a network.

## Scope

| Area | Changes |
|------|---------|
| `apps/crm` | Serwist service worker, `next.config.js`, `app/sw.ts`, `app/~offline`, manifest, layout metadata |
| `apps/pm` | Same as CRM |
| `packages/ui` | Shared `PwaInstallPrompt` component |

## Details

### Service worker (`@serwist/next`)

- Built from `app/sw.ts` into `public/sw.js` on `next build`
- Disabled during `next dev` to avoid stale caches while developing
- Precaches the app shell and `/~offline`
- Uses Serwist `defaultCache` for static assets; document navigations fall back to `/~offline` when offline
- Auto-registers the service worker in production (`register: true` default)

### Web manifest

Existing `public/favicon/site.webmanifest` files were extended with:

- `id`, `display_override`, `orientation`, `categories`
- Brand `theme_color` (`#F5630F`) and `background_color` (`#FFFAF7`)
- Icons with both `any` and `maskable` purposes (192×192 and 512×512)

### Install UX

`PwaInstallPrompt` (in `@webfudge/ui`) listens for `beforeinstallprompt`, shows a bottom banner with **Install** / **Not now**, and remembers dismissal per app (`crm` / `pm`).

### Layout metadata

Both apps export `viewport.themeColor` and `metadata.appleWebApp` for iOS “Add to Home Screen” behavior.

## Usage / Testing

1. **Production build required** for the service worker (dev mode disables Serwist):

   ```bash
   npm run build --workspace=@webfudge/crm
   npm run start --workspace=@webfudge/crm
   ```

   Repeat for `@webfudge/pm` (port 3006).

2. Serve over **HTTPS** (or `localhost`) — install prompts require a secure context.

3. **Chrome / Edge**: address bar install icon, or the in-app banner when eligible.

4. **Safari (iOS)**: Share → **Add to Home Screen** (no `beforeinstallprompt`; banner may not appear).

5. **Offline**: disconnect network and reload a page; you should see `/~offline`. Live Strapi/API data still requires connectivity.

## Migration / Deploy notes

- Run `npm install` at the repo root after pulling (adds `@serwist/next` and `serwist`).
- Ensure production deploys use `next build` so `public/sw.js` is generated.
- Generated `public/sw*` files are gitignored; CI must build before serving.
