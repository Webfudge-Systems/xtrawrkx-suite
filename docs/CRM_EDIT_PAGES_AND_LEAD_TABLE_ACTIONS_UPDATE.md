# CRM Edit Pages and Lead Table Actions Update

## Summary
This update rebuilds CRM edit experiences for Lead Companies and Contacts to match the target UI patterns, and aligns lead-list conversion actions with the lead-details conversion flow. It improves consistency, feedback, and action safety across edit and list screens.

## Scope
- `apps/crm/app/sales/lead-companies/[id]/edit/page.js`
- `apps/crm/app/sales/contacts/[id]/edit/page.js`
- `apps/crm/app/sales/lead-companies/page.js`

## Details

### 1) Lead Company Edit Page
- Replaced the minimal form with multi-section cards:
  - Company Information
  - Address Information
  - Lead Information
  - Social & Additional Information
  - Contacts table section
- Added the **Add Contact** modal with create flow and table refresh.
- Added visual consistency updates:
  - Section spacing between cards
  - Solid `bg-brand-primary` icon badges
  - Iconized header actions (cancel/update)
- Added success state after update:
  - Full-screen "updated successfully" message
  - Auto-redirect back to lead-company details
- Fixed save flow so update API is called before redirect.

### 2) Contact Edit Page
- Replaced the minimal form with multi-section cards:
  - Basic Information
  - Professional Information
  - Company Association
  - Address Information
  - Social & Additional Information
- Added both header and footer action rows with iconized cancel/update buttons.
- Added visual consistency updates:
  - Section spacing between cards
  - Solid `bg-brand-primary` icon badges
- Added success state after update:
  - Full-screen "updated successfully" message
  - Auto-redirect back to contact details
- Fixed email validation regex issue that rejected valid emails.

### 3) Lead Companies Table Actions
- Highlighted Industry values using a styled badge for improved scanability.
- Added **Convert to Client** action in the table actions column.
- Upgraded convert action behavior to match lead-details conversion:
  - Confirmation modal before conversion
  - Calls `leadCompanyService.convertToClient(...)`
  - Updates local row status and refreshes stats
  - Redirects to created client account when returned by API

## Usage Notes
- From lead list, use the new convert action icon and confirm in modal to convert.
- From edit pages, successful update now shows an explicit success state before redirect.
- Contact and lead edit pages now share a consistent card/icon/action pattern.
