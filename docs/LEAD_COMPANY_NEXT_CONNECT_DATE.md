# Lead Company Next Connect Date

## Summary

Added a **Next connect date** field to lead companies so sales can schedule when to follow up. The date appears as a ribbon flag in the leads table (orange **Today** or green future date) and on add/edit forms and the lead detail page.

## Scope

- **Backend:** `apps/backend/src/api/lead-company/content-types/lead-company/schema.json` — `nextConnectDate` (`date`)
- **UI package:** `packages/ui/components/NextConnectFlag/` — shared flag component + helpers
- **CRM:** Lead companies list, add, edit, and detail pages under `apps/crm/app/sales/lead-companies/`

## Details

### Data model

- Field name: `nextConnectDate`
- Type: Strapi `date` (YYYY-MM-DD)
- Optional; empty means no flag in the table

### Flag behavior

| Condition | Appearance |
|-----------|------------|
| Date is today | Orange ribbon, calendar icon, label **Today** |
| Date is in the future | Green ribbon, calendar-check icon, label e.g. **Jun 4** |
| Date is in the past | Orange ribbon with the date (overdue follow-up) |
| No date | Nothing shown in table flag column |

### Next connect reasons vs comments

Follow-up notes are stored as CRM activity comments with a `commentKind` in `meta`:

| Kind | Where used | Popover title |
|------|------------|---------------|
| `general` | Company row comment button | **Comments** |
| `next_connect` | Next connect column (date / reason icon) | **Next connect** |

- The **Next connect** popover shows only the date picker and **next connect reasons** — not the full comment thread.
- The **Comments** popover on the company name shows only general comments.
- On the lead detail **Chats** tab, all messages still appear, but next connect reasons show a **Next connect reason** badge.

API helpers in `apps/crm/lib/api/crmActivityService.js`: `fetchLeadCompanyNextConnectReasons`, `addLeadCompanyNextConnectReason`, and `commentKind` filters on existing comment endpoints.

### UI surfaces

1. **Leads table** — **Next connect** column after company name (date pill + reason icon)
2. **Add lead form** — date input in Lead Status section
3. **Edit lead form** — date input in Lead Information section (clearing the field removes the date)
4. **Detail page** — flag in company info header badges + **Next connect** card in Record & segment

## Usage / Migration

1. Restart Strapi after pulling so the new attribute is applied to the database.
2. Set **Next connect date** when creating or editing a lead company.
3. Use the table flag column to scan who to contact today vs upcoming days.

## Exports

From `@webfudge/ui`:

- `NextConnectFlag` — visual ribbon
- `getNextConnectFlagVariant`, `getNextConnectFlagLabel`, `toDateInputValue` — helpers for forms and logic
