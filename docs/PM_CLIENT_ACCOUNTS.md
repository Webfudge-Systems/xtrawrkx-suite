# PM Client Accounts (CRM parity)

## Summary

PM now includes **Client Accounts** with the same table list and detail experience as CRM, under `/clients/accounts`.

## Routes

| Path | Page |
|------|------|
| `/clients` | Redirects to `/clients/accounts` |
| `/clients/accounts` | Accounts table (KPIs, filters, column picker) |
| `/clients/accounts/[id]` | Account detail (tabs: overview, contacts, deals, projects, invoices, activity) |
| `/clients/accounts/new` | Create account |
| `/clients/accounts/[id]/edit` | Edit account |

Sidebar **Clients** navigates to `/clients/accounts`.

## Permissions

Data is the shared Strapi `client-accounts` API (CRM module). PM uses **CRM RBAC** helpers in `apps/pm/lib/rbac.js`:

- `canReadClientAccounts()` — `crm.client_accounts` read
- `canWriteClientAccounts()` / `canManageClientAccounts()`
- `canWriteCrmModule('deals' | 'client_invoices' | 'client_projects')` — related tabs on detail

Org **Member** roles typically have read access to client accounts in CRM permissions.

## Cross-app links

From PM detail, links to **contacts, deals, leads, invoices** open the CRM app via `apps/pm/lib/crmAppUrl.js`. Set:

```env
NEXT_PUBLIC_CRM_APP_URL=http://localhost:3007
```

PM project links use existing `pmAppUrl.js` (`NEXT_PUBLIC_PM_APP_URL`).

## Key files

- `apps/pm/app/clients/accounts/*`
- `apps/pm/lib/api/clientAccountService.js`, `contactService.js`, `crmActivityService.js`
- `apps/pm/components/MeetingsEmbedList.jsx` (copied from CRM)
