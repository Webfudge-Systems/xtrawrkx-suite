# Railway — migrate `xtrawrkx_users` (keep team data)

## Summary

Production Postgres has **`xtrawrkx_users`** with your team (emails, names, `document_id`). The monorepo API no longer defines that content type. Strapi boots, tries to **drop** the table, PostgreSQL blocks it because **FKs** still reference it → API never listens → healthcheck fails.

**Do not drop the table without migrating.** Those rows are your people; they must become **`up_users`** (login accounts). CRM “organization users” lists come from **`organization_users`** memberships pointing at `up_users`, not from a separate profile table.

## Data model (before → after)

| Legacy | Current | Role |
|--------|---------|------|
| `xtrawrkx_users` | `up_users` | Login user: email, first/last name, password |
| (often missing or broken links) | `organization_users` | User ↔ organization ↔ role (what `/organizations/:id/users` returns) |

`getXtrawrkxUsers()` in CRM/PM still uses that name but calls **`/organizations/:orgId/users`**, which reads **organization_users + up_users**.

## Scope

- Railway Postgres (`xtrawrkx-suite`)
- Script: `apps/backend/scripts/migrate-xtrawrkx-users-to-up-users.js`
- SQL rename: `apps/backend/scripts/railway-rename-xtrawrkx-users.sql`

## Steps

### 1. Stop API

Scale **`xtrawrkx_suits` to 0** or pause deploys.

### 2. Inspect (Railway Postgres → Query)

Run **one query at a time** (the combined query fails when `up_users` is missing):

```sql
SELECT COUNT(*) AS xtrawrkx_users FROM xtrawrkx_users;
```

**Your results:**

| Table | Your DB |
|-------|---------|
| `xtrawrkx_users` | **28 rows** |
| `up_users` | **does not exist** (normal — Strapi never booted) |
| `organization_users` | **does not exist yet** (Strapi creates it after boot) |

Do **not** drop `xtrawrkx_users`. Rename it to `up_users` (§3).

### 3. Migrate — rename path (no `up_users` yet)

**Option A — Node (recommended)** from `apps/backend` with Railway **`DATABASE_URL`**:

```powershell
$env:DRY_RUN="true"
$env:DATABASE_URL="postgresql://..."
node scripts/migrate-xtrawrkx-users-to-up-users.js
# then without DRY_RUN:
node scripts/migrate-xtrawrkx-users-to-up-users.js
```

When `up_users` is missing, the script:

1. **`ALTER TABLE xtrawrkx_users RENAME TO up_users`** — keeps all **28 rows** and existing FKs
2. Adds `username`, `password`, `provider`, `confirmed`, `blocked`, `is_platform_admin`
3. Fills `username` from email

**Option B — SQL only** in Railway Query: run `apps/backend/scripts/railway-rename-xtrawrkx-users.sql` step by step.

### 4. Apply + redeploy

After rename, confirm:

```sql
SELECT COUNT(*) FROM up_users;
```

Should show **28**. Then redeploy API. Strapi will create **`organization_users`** and other missing tables on first successful boot.

### 5. After Strapi boots — `organization_users`

`organization_users` **did not exist** before migration; Strapi creates it on boot. Membership rows (user ↔ org ↔ role) may still need to be created or migrated from legacy link tables.

After deploy:

```sql
SELECT COUNT(*) FROM organization_users;
```

If **0** but `up_users` has 28 rows, use Strapi Admin to link users to organizations, or share whether tables like `xtrawrkx_users_organization_lnk` exist for a follow-up script.

### 6. Redeploy API

Redeploy **`xtrawrkx_suits`**. Verify:

```bash
curl -s https://xtrawrkxsuits-production.up.railway.app/api/apps
```

Log in on CRM; open an assignment dropdown — users should list via org endpoint.

## Passwords

If legacy rows had a **`password`** hash, it is copied into `up_users`. If not, users must use **forgot password** or you set `PLATFORM_ADMIN_RESET_PASSWORD` / admin reset.

## Wrong fix (do not use for your case)

Dropping `xtrawrkx_users` without migrating **deletes** the only copy of team profiles when `up_users` is empty.

## Related

- [WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md](./WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md)
- `apps/backend/src/api/organization-user/content-types/organization-user/schema.json`
