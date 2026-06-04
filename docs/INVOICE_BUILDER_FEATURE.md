# Invoice Builder Feature

## Summary
Added a full-featured Invoice Builder at `/clients/invoices/new`. Matches the Zoho Invoices reference layout: org logo/name on the left, "INVOICE" heading on the right, Bill To / Ship To band, line-items table, totals block with tax/discount/balance-due.

Also updated the **Proposal Builder** (`/clients/proposals/new`) — "Prepared By" section now auto-fills from the active organization via `useAuth().currentOrg`.

## Scope
- **New file:** `apps/crm/app/clients/invoices/new/page.js`
- **Updated:** `apps/crm/app/clients/proposals/new/page.js`

## Invoice Form Sections

| # | Section | Fields |
|---|---------|--------|
| 1 | Invoice Information | Document type, invoice number, currency, invoice date, payment terms, due date |
| 2 | Invoice From (Organization) | Pre-filled from `currentOrg` — name, GSTIN, email, phone, address, logo URL |
| 3 | Bill To (Client) | Name, company, email, phone, GSTIN, address |
| 4 | Ship To | Toggle "same as billing" or enter separate address |
| 5 | Line Items | Dynamic rows: item name, description, qty, rate → auto-computes amount |
| 6 | Pricing & Tax | Tax label (GST/IGST/VAT), tax %, discount, amount already paid; live summary table |
| 7 | Notes & Terms | Notes to client, T&C text, signature line toggle |

## Org Integration (both Invoice + Proposal)
Both pages use `useAuth()` to read `currentOrg` and `user`:
- `currentOrg.name` → "Invoice From" / "Prepared By" company name
- `currentOrg.email`, `currentOrg.phone`, `currentOrg.address` → contact fields
- `currentOrg.gstin` / `currentOrg.taxId` → GSTIN field
- `currentOrg.logo` → shown in invoice header (with `crossOrigin="anonymous"` for html2canvas)
- User's `firstName + lastName` → contact name fallback

A blue info banner shows the active org name and a note that fields are editable.

## PDF Download
Same approach as Proposal Builder — static `html2canvas` + `jspdf` imports, multi-page A4 capture.
Filename: `{invoiceNumber}-{clientName}.pdf`
