# Local database reset

## Summary

Clears the development SQLite database and re-seeds apps, modules, and the platform super-admin. Use when old users/orgs (e.g. `test@gmail.com`) still appear after migration.

## Reset steps

1. Stop the backend: `Ctrl+C` on `npm run dev:backend`
2. From repo root: `npm run reset:db`
3. Start backend: `npm run dev:backend`
4. Restart frontends: `npm run dev`
5. Clear browser storage for each app (Application → Local Storage → remove `auth-token`, `auth-user`, `current-org-id`) or use a private window

## Orbit (platform admin) login

| Field | Value |
|-------|--------|
| Email | `admin@xtrawrkx.com` |
| Password | `XtrawrkxAdmin@2025` |

Set `PLATFORM_ADMIN_RESET_PASSWORD=true` in `apps/backend/.env` to re-hash the admin password without wiping the DB. Set to `false` after the first successful login.

## Fixes included

- `isPlatformAdmin` on `plugin::users-permissions.user` (required for `/api/auth/platform-login`)
- Platform admin seed syncs password when `PLATFORM_ADMIN_RESET_PASSWORD=true`
