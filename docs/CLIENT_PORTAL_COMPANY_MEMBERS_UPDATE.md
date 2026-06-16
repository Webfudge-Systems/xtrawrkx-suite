# Client Portal Company Members Update

## Summary

The **Company Members** page in the client portal (`/company`) is now wired to Strapi. Clients with admin-level portal access can add, edit, and remove contacts that are stored as CRM **contacts** linked to their **client account**.

Previously the portal called `/api/auth/company-members` and `/api/contacts/client-account/:id`, which did not exist — the page showed errors and an empty table.

## Scope

- **Backend:** `apps/backend/src/utils/company-members.js`, `apps/backend/src/api/auth/controllers/auth.js`, `apps/backend/src/api/auth/routes/auth.js`
- **Client portal:** `companyMemberManagementService.js`, `companyMembersService.js`, `CompanyMemberModal.jsx`, `company/page.jsx`, `CompanyMemberDetailsModal.jsx`

## API routes

All routes require a **client portal JWT** (`Authorization: Bearer <token>`).

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/auth/company-members` | List contacts for the logged-in client account |
| `GET` | `/api/auth/company-members/:id` | Get one member |
| `POST` | `/api/auth/company-members` | Add contact + portal access (admin only) |
| `PUT` | `/api/auth/company-members/:id` | Update contact / access (admin only) |
| `DELETE` | `/api/auth/company-members/:id` | Deactivate member (admin only) |
| `PUT` | `/api/auth/company-members/:id/suspend` | Suspend / activate portal access (admin only) |
| `POST` | `/api/auth/company-roles` | Register a custom portal role name (admin only) |

### Permissions

Create, update, and delete require the current user to be:

- Primary contact, **or**
- Portal role `ADMIN` / `MANAGER`, **or**
- Portal access level `FULL_ACCESS`

Any authenticated client user can **list** members.

## CRM sync

When a member is added from the portal:

1. A **contact** is created with `clientAccount` set to the portal user's account and `organization` from that account.
2. A **client-portal-access** row is created with login password, role, and access level.
3. Contacts appear in CRM under the same client account (Client account detail → Contacts).

Delete deactivates portal access and sets the contact status to `INACTIVE` (primary contact cannot be removed).

### Suspend / activate (portal access)

`PUT /api/auth/company-members/:id/suspend` with `{ "suspend": true }`:
- sets CRM contact `status` to `SUSPENDED`
- disables the linked `client-portal-access` (`isActive: false`)

Calling with `{ "suspend": false }` re-activates portal access and sets the contact back to `ACTIVE`.

## Usage

1. Restart Strapi after pulling (`npm run dev:backend`).
2. Sign in to the client portal as a user with full access.
3. Open **Company Members** → **Add Member**.
4. New contacts sync to CRM automatically.

## UI changes

The **Company Members** table now opens member details in a modal (instead of navigating to a contact details page) and includes a **Suspend / Activate** action.

## Migration

No schema changes. Existing CRM contacts linked to the client account are returned by the list endpoint.
