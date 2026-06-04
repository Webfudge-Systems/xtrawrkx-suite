# Client Accounts Table Columns Update

## Summary

Updated the Client Accounts list page (`/clients/accounts`) to use a rich, toggleable column system aligned with the Lead Companies table style. Added a column visibility dropdown (eye icon) and drag-to-reorder support consistent with the Contacts and Lead Companies pages.

## Scope

- **File changed**: `apps/crm/app/clients/accounts/page.js`
- **Service updated**: `apps/crm/lib/api/clientAccountService.js` — `getAll` now passes `populate` params

## Details

### New Columns

The table now supports the following columns (default visible in **bold**):

| Column | Key | Default |
|---|---|---|
| Company | `company` | Always visible (fixed) |
| **Primary Contact** | `primaryContact` | ✅ On |
| **Health Score** | `healthScore` | ✅ On |
| **Deal Value** | `dealValue` | ✅ On |
| **Contacts** | `contactsCount` | ✅ On |
| **Location** | `location` | ✅ On |
| **Industry** | `industry` | ✅ On |
| **Account Manager** | `assignedTo` | ✅ On |
| **Status** | `status` | ✅ On |
| **Created** | `createdAt` | ✅ On |
| Updated | `updatedAt` | Off |
| Account Type | `accountType` | Off |
| Billing Cycle | `billingCycle` | Off |
| Website | `website` | Off |
| Co. Phone | `companyPhone` | Off |
| Co. Email | `companyEmail` | Off |
| Address | `address` | Off |
| City | `city` | Off |
| State | `state` | Off |
| Country | `country` | Off |
| ZIP / Postal | `zipCode` | Off |
| Employees | `employees` | Off |
| Description | `description` | Off |
| LinkedIn | `linkedIn` | Off |
| Twitter / X | `twitter` | Off |
| Notes | `notes` | Off |
| Contract Start | `contractStartDate` | Off |
| Contract End | `contractEndDate` | Off |
| Actions | `actions` | Always visible (fixed) |

### Column Picker

- Clicking the **eye icon** in the `TabsWithActions` toolbar opens a dropdown panel
- Each column has a **checkbox** to toggle visibility
- Each row has a **drag handle** (grip icon) for reordering
- An **orange line indicator** shows drop position during drag
- Preferences (visibility + order) are **persisted to `localStorage`** under:
  - `crm.clientAccounts.tableColumnVisibility`
  - `crm.clientAccounts.tableColumnOrder`
- **Reset to default** button restores the default visible columns and order

### Actions Column

Each row now has an inline actions column with:
- **More** (⋯) — dropdown with: Create Meet, Create Task, Copy URL
- **Edit** (pencil) — navigates to edit page
- **Mail** (envelope) — opens `mailto:` link (disabled if no email)
- **Delete** (trash) — with confirmation dialog

### Service Fix

`clientAccountService.getAll` now correctly passes `populate` query params to the Strapi API so `contacts` (for primary contact data) and `assignedTo` (for account manager) are populated.

## Before / After

**Before**: 6 fixed columns — Company, Contact Info, Status, Deals, Assigned To, Created

**After**: 1 fixed + 27 toggleable + 1 fixed = fully customisable table matching the Lead Companies pattern
