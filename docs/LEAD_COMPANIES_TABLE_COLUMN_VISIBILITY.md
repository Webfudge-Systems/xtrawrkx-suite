# Lead companies table — column visibility

## Summary

The CRM **Lead Companies** list table exposes all lead-company fields as optional columns. The toolbar **eye** control opens a panel to show or hide each column. **Company** and **Actions** are always visible.

## Scope

- **App:** `apps/crm`
- **File:** `apps/crm/app/sales/lead-companies/page.js`
- **UI:** `TabsWithActions` `showColumnVisibility` + `onColumnVisibilityClick` (existing eye button)

## Behavior

- Toggleable columns match the Strapi lead-company schema (industry, location, scores, notes, organization, etc.) plus composite columns (primary contact, deal value, contact count).
- Choices persist in `localStorage` under key `crm.leadCompanies.tableColumnVisibility`.
- List fetch populates `assignedTo`, `organization`, and `contacts` so contact-based columns stay accurate.

## Defaults

The same columns that were visible before this change stay on by default: primary contact, status, source, deal value, contacts count, assigned to, created date. Other columns are off until enabled in the panel.
