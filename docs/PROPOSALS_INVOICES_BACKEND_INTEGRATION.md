# Proposals & Invoices — Backend Integration & Full CRUD

## Summary

Connected proposals and invoices to the Strapi backend with full CRUD, functional list pages,
detail/preview pages, and edit pages for both. Also created a `webfudge-backend-pattern` Cursor skill
as a persistent reference for adding new APIs.

---

## Scope

**Backend (Strapi):**
- `apps/backend/src/api/proposal/` — new content type with full CRUD controller + routes + service
- `apps/backend/src/api/invoice/` — new content type with full CRUD controller + routes + service

**Frontend (CRM):**
- `apps/crm/lib/api/proposalService.js` — full service (getAll, getOne, create, update, delete)
- `apps/crm/lib/api/invoiceService.js` — full service
- `apps/crm/app/clients/proposals/page.js` — functional list with KPIs, tabs, search, delete confirm
- `apps/crm/app/clients/invoices/page.js` — functional list
- `apps/crm/app/clients/proposals/new/page.js` — updated to call `proposalService.create()`, redirects to detail
- `apps/crm/app/clients/invoices/new/page.js` — updated to call `invoiceService.create()`, redirects to detail
- `apps/crm/app/clients/proposals/[id]/page.js` — detail page with preview modal + PDF + status change
- `apps/crm/app/clients/invoices/[id]/page.js` — detail page
- `apps/crm/app/clients/proposals/[id]/edit/page.js` — full edit form pre-populated from API
- `apps/crm/app/clients/invoices/[id]/edit/page.js` — full edit form

**Skill:**
- `C:\Users\hp\.cursor\skills-cursor\webfudge-backend-pattern\SKILL.md` — persistent reference for all backend + service patterns

---

## Proposal Schema Fields (JSON/Strapi)

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | Human-readable title |
| `proposalNumber` | string | Ref number e.g. PROP-2026-001 |
| `documentType` | enum | SOW, PROPOSAL, QUOTE |
| `status` | enum | DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED |
| `date`, `validUntil` | date | |
| `currency` | string | INR/USD/EUR/GBP |
| `clientCompanyName`, `clientContactName`, `clientEmail`, `clientPhone`, `clientAddress` | string/text | Bill-to client |
| `preparedByCompany`, `preparedByName`, `preparedByEmail`, `preparedByPhone` | string | Org contact |
| `projectName`, `projectOverview` | string/text | Project summary |
| `modules` | json | `[{ name, price, deliverables, acceptanceCriteria }]` |
| `milestones` | json | `[{ name, paymentPercent, description }]` |
| `estimatedTimeline` | string | |
| `outOfScopeRate`, `outOfScopeRateUnit`, `warrantyDays` | decimal/integer/string | |
| `assumptions`, `securityItems`, `outOfScope`, `handoverDeliverables` | json | `string[]` |
| `paymentTerms`, `taxInfo` | string | |
| `totalValue` | decimal | Sum of module prices |
| `organization`, `assignedTo`, `leadCompany`, `clientAccount`, `deal` | relation | Org-scoped |

## Invoice Schema Fields

| Field | Type | Notes |
|-------|------|-------|
| `invoiceNumber` | string (required) | |
| `documentType` | enum | INVOICE, PROFORMA_INVOICE, CREDIT_NOTE, RECEIPT |
| `status` | enum | DRAFT, SENT, PAID, OVERDUE, CANCELLED, PARTIAL |
| `invoiceDate`, `dueDate` | date | |
| `terms`, `currency` | string | |
| `fromOrg*` | string/text | fromOrgName, fromOrgAddress, fromOrgEmail, fromOrgPhone, fromOrgGstin, fromOrgLogo |
| `billTo*` | string/text | billToName, billToCompany, billToEmail, billToPhone, billToAddress, billToGstin |
| `lineItems` | json | `[{ name, description, qty, rate, unit }]` |
| `taxRate`, `taxLabel`, `discount`, `amountPaid` | decimal/string | |
| `subtotal`, `total`, `balanceDue` | decimal | Computed + stored |
| `notes`, `termsAndConditions` | text | |
| `organization`, `assignedTo`, `leadCompany`, `clientAccount`, `deal` | relation | |

---

## API Endpoints (after backend restart)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/proposals` | List (paginated, org-scoped) |
| GET | `/api/proposals/:id` | Detail |
| POST | `/api/proposals` | Create |
| PUT | `/api/proposals/:id` | Update |
| DELETE | `/api/proposals/:id` | Delete |
| GET | `/api/invoices` | List |
| GET | `/api/invoices/:id` | Detail |
| POST | `/api/invoices` | Create |
| PUT | `/api/invoices/:id` | Update |
| DELETE | `/api/invoices/:id` | Delete |

---

## Usage / Migration

1. **Restart the Strapi backend** — Strapi auto-discovers the new `proposal` and `invoice` directories.
2. Go to Strapi Admin → Content-Type Builder and verify the new types appear.
3. The CRM frontend pages are immediately functional once the backend is running.

---

## Pattern Followed

All new APIs follow the pattern documented in:
- `C:\Users\hp\.cursor\skills-cursor\webfudge-backend-pattern\SKILL.md`

Key conventions:
- Controller always checks `ctx.state.user` + `ctx.state.orgId` at top of every handler
- Routes use `auth: false` (JWT verified manually in controller)
- `readListQuery`, `createPopulateSanitizer`, `safeCount` from `content-api-helpers.js`
- Relations sent as `{ id: n }` from frontend (not raw integers)
- JSON fields store arrays/objects directly
