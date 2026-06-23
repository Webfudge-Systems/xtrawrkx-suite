# CRM Client Portal Password Change

## Summary
CRM users can now update a client portal contact password from a client account's Contacts tab. This gives internal teams a direct support path when a client needs their portal password reset.

## Scope
- `apps/crm/app/clients/accounts/[id]/page.js`
- `apps/crm/lib/api/clientAccountService.js`
- `apps/backend/src/api/client-account/controllers/client-account.js`
- `apps/backend/src/api/client-account/routes/00-custom-client-account.js`

## Details
- Adds a CRM-only action menu item, "Change Portal Password", on linked contacts in the client account detail page.
- Opens a confirmation modal requiring the new password and confirmation value.
- Adds `POST /api/client-accounts/:id/contacts/:contactId/portal-password` for authenticated CRM users with client account write access.
- The backend validates the active organization and contact/account relationship before updating or creating the linked `client-portal-access` credential.

## Usage
Open CRM -> Clients -> Client Account -> Contacts, use the row action menu for a contact, and choose "Change Portal Password".
