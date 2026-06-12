# Webfudge Platform Sync — June 2026

## Summary

Synced `xtrawrkx-suite` with the latest upstream changes from `webfudge-platform`, aligning shared packages and workspace apps while preserving Xtrawrkx-specific branding, ports, and migration scripts.

## Scope

### Shared packages

| Package | Changes |
|---------|---------|
| `@webfudge/ui` | Table column picker, entity files panel, chat attachments, sidebar two-line branding, `titleClassName` on headers, table resize/sort improvements, `userSelectOptions` utils |
| `@webfudge/utils` | S3/Strapi file upload helpers (`media/upload.js`), updated `paginateStrapiList` |
| `@webfudge/auth` | Auth provider and service updates |
| `@webfudge/config` | Tailwind preset and brand color tokens |

### Apps updated

| App | Files synced | Preserved |
|-----|--------------|-----------|
| CRM | 64 | `lib/site.js` (Fudge People / Xtrawrkx branding) |
| PM | 21 | `lib/site.js` |
| Accounts | 20 | `lib/site.js` |
| Books | 67 updated + 166 new | `lib/site.ts`, `package.json` |
| Backend | 46 shared controllers/config | Xtrawrkx migration/backfill scripts |
| Orbit (org manager) | Sidebar branding API | Webfudge Systems branding in `lib/site.js` |

### Xtrawrkx-only (not overwritten)

- `packages/utils/src/siteBranding.js` — `FUDGE_SUITE_ASSETS`
- `packages/ui/hooks/useMediaQuery.js`
- `apps/xtrawrkx-client-portal`, `apps/linkedin-extension`, `apps/landing`
- All `lib/site.js` / `lib/site.ts` branding files
- Backend migration scripts (`migrate-*`, `backfill-*`, `seed-*`)

## Key feature ports

1. **Table column preferences** — `TableColumnPicker`, `useTableColumnPreferences` on CRM/PM/Accounts list pages
2. **Sidebar two-line branding** — `productName` + `companyName` in `LayoutContent` (replaces legacy `brandName`)
3. **Entity file attachments** — `EntityFilesPanel`, `ChatMessageAttachments`, S3 upload utils
4. **Workspace header** — `titleClassName` prop, improved notification/profile dropdowns
5. **Books shell** — entity page chrome hiding, records store provider, column picker alignment

## Layout branding migration

Before:

```js
sidebarBranding={{ logoPath, brandName: SITE.name, homeHref: '/' }}
```

After:

```js
sidebarBranding={{
  logoPath: SITE.logoPath,
  productName: SITE.name,
  companyName: SITE.brandName,
  homeHref: '/',
}}
```

## Post-sync steps

1. Run `npm install` at repo root
2. Deploy backend first, then run `npm run flush:api-cache` in `apps/backend`
3. Smoke-test CRM/PM list pages (column picker, sort, resize)
4. Verify sidebar branding shows product + company name
5. Test file upload on entity detail pages if S3 env vars are configured

## Related upstream docs (copied)

- `TABLE_COLUMN_PREFERENCES.md`
- `S3_FILE_UPLOAD_UPDATE.md`
- `ACCOUNTS_USERS_PAGE_SYNC.md`
- `ACCOUNTS_DEPARTMENTS_UPDATE.md`
- `BOOKS_HEADER_SHELL_UX_UPDATE.md`
- `CRM_LEAD_COMPANIES_TABLE_KANBAN_VIEW.md`
- `XTRAWRKX_TASK_UPDATES_PORT_GUIDE.md`
