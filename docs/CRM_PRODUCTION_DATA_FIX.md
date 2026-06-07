# CRM Production Data Fix

## Summary

Production CRM showed empty dashboards (0 tasks, 0 leads, 0 activity) while **new** records could still be created. Two root causes:

1. **Tasks API 500** — `GET /api/tasks?scope=crm` merged a CRM scope filter that included a **`contact`** relation, but the Task content type has **no `contact` field**. Strapi threw `Internal Server Error`, breaking dashboard task widgets.
2. **Organization tenant mismatch** — CRM list APIs scope all reads to `ctx.state.orgId`. Legacy rows often have **no `organization` link**, and users who logged in after the auth bootstrap may have been placed in a **new empty organization** instead of the org that holds historical CRM data.

## Scope

- `apps/backend/src/utils/task-scope.js` — removed invalid `contact` from server-side CRM scope filter
- `apps/backend/src/api/lead-company/controllers/lead-company.js` — forward `assignedTo` (and related) query filters
- `apps/backend/scripts/backfill-crm-organization.js` — production data repair script
- `apps/backend/package.json` — npm scripts for backfill

## Details

### Tasks 500 (code fix — deploy backend)

The CRM app sends `scope=crm` on task list calls. The backend filter used:

```js
{ contact: { id: { $notNull: true } } }
```

Task schema relations are: `leadCompany`, `clientAccount`, `deal`, `projects` — **not** `contact`. Filtering on a missing attribute caused Strapi to return **500**.

After deploy, `/api/tasks?scope=crm&...` should return **200** with CRM-linked tasks.

### Users missing in Accounts (organization memberships)

The Accounts **Users** page reads `GET /organizations/:id/users`, which lists **`organization_users` memberships**, not every row in `up_users`.

After legacy migration, **32 users** existed in `up_users` but only **1** had a membership in org 1 (`admin@xmc.com`). The rest were never linked.

**Fix applied:** `backfill-org-user-memberships.js` with `TARGET_ORG_ID=1` — **31 memberships created**, org 1 now has **32 users**.

```powershell
cd apps/backend
$env:TARGET_ORG_ID="1"
npm run backfill:org-user-memberships:dry-run
npm run backfill:org-user-memberships
```

Refresh **Fudge Base → Users** (hard refresh). `admin@xtrawrkx.com` → Admin; team `@xtrawrkx.com` users → Member.

**Departments** column still shows "None" until departments are assigned per user (Accounts → edit user → departments). That is separate from membership backfill.

Diagnosis on Railway Postgres:

| Metric | Before | After |
|--------|--------|-------|
| Leads linked to org 1 (Xtrawrkx Pvt. Ltd.) | 1 | **4,187** |
| Orphan leads (no org) | 4,186 | **0** |
| Orphan contacts | 5,843 | **0** (linked) |

`admin@xmc.com` (user 42) was already a member of org 1 — the data existed but was invisible because legacy rows had no `organization` link.

Symptoms:

- Dashboard KPIs all **0**
- Sales → Lead Companies may still show data if queried differently, but org-scoped widgets return empty
- New creates work because `create` handlers set `organization: ctx.state.orgId`

Repair on Railway Postgres:

**Fast path (recommended for 1000+ orphan rows):**

```powershell
cd apps/backend
$env:DATABASE_URL="postgresql://..."
$env:TARGET_ORG_ID="1"
npm run backfill:crm-organization:sql:dry-run
npm run backfill:crm-organization:sql
```

**Slow path (Strapi entityService, small datasets):**

```powershell
npm run backfill:crm-organization:dry-run
npm run backfill:crm-organization
```

Optional: pin the org that owns legacy data:

```powershell
$env:TARGET_ORG_ID="1"
npm run backfill:crm-organization
```

The script:

1. Picks `TARGET_ORG_ID` or auto-selects the org with the most linked CRM/PM rows
2. Sets `organization` on orphan rows (leads, contacts, deals, tasks, etc.)
3. Creates **Member** memberships for users not yet in that org

After backfill, users should **sign out and sign in** (or refresh session) so the CRM sends the correct `X-Organization-Id`.

### Lead assignees show “Unassigned” (owner data lost in DB)

After org backfill, leads and contacts are visible again, but the **Assigned to** column may show **Unassigned** for ~4,000 legacy rows.

Diagnosis on production Postgres (June 2026):

| Table | Rows | With non-null `user_id` |
|-------|------|-------------------------|
| `lead_companies_assigned_to_lnk` | 3,995 | **1** (only the newest lead) |
| `contacts_assigned_to_lnk` | 5,570 | **1** |

The link rows **exist** (Strapi knows a relation slot was created), but **`user_id` is NULL** for almost all legacy imports. This is not a UI bug — the owner ids were wiped during the **`xtrawrkx_users` → `up_users` / Strapi schema migration**. There is no usable copy in `crm_activities`, notifications, or tasks on the current database.

**4,177** leads have `source = SOCIAL_MEDIA` (LinkedIn extension imports, March 2026). The extension **does** send `assignedTo: userId` on import; the values were stored originally but are gone from the live DB.

#### Restore original owners (requires backup)

You need a **Railway Postgres backup** (or `pg_dump`) from **before** assignees were nulled — typically from before the legacy user migration / Strapi boot that recreated relations.

1. In Railway → Postgres service → **Backups**, restore to a **temporary** database (or download a dump).
2. Export mappings from the backup:

```powershell
cd apps/backend
$env:BACKUP_DATABASE_URL="postgresql://...backup..."
npm run export:lead-assignees > lead-assignees.csv
```

3. Apply to production (dry-run first):

```powershell
$env:DATABASE_URL="postgresql://...production..."
$env:BACKUP_DATABASE_URL="postgresql://...backup..."
npm run backfill:lead-assignees:dry-run
npm run backfill:lead-assignees -- --sync-contacts
```

Or use CSV:

```powershell
$env:ASSIGNMENTS_CSV=".\lead-assignees.csv"
npm run backfill:lead-assignees -- --sync-contacts
```

Scripts: `apps/backend/scripts/backfill-lead-assignees.js`, `export-lead-assignees-csv.js`.

Diagnosis: `npm run diagnose:lead-assignees`.

**Do not** guess owners (round-robin / assign-all-to-admin) unless the team accepts that mapping — it will not match historical ownership.

## Verification

1. Browser devtools → Network → `GET .../api/tasks?scope=crm` returns **200**, not 500
2. Dashboard shows assigned leads, my work tasks, and activity
3. Railway SQL (optional):

```sql
SELECT COUNT(*) FROM lead_companies lc
LEFT JOIN lead_companies_organization_lnk l ON l.lead_company_id = lc.id
WHERE l.organization_id IS NULL;
-- expect 0 after backfill
```

## Related

- [CRM_TASK_SCOPE_FILTER.md](./CRM_TASK_SCOPE_FILTER.md)
- [AUTH_ACTIVE_ORG_BOOTSTRAP_FIX.md](./AUTH_ACTIVE_ORG_BOOTSTRAP_FIX.md)
- [RAILWAY_POSTGRES_XTRAWRKX_USERS_FIX.md](./RAILWAY_POSTGRES_XTRAWRKX_USERS_FIX.md)
