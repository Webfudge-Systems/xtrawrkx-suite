# Lead Company → Convert to Client Account

## Summary

Clicking "Convert to Client" on a lead company detail page now:
1. Shows a confirmation modal (cannot be undone warning + bullet list of what happens).
2. Calls a dedicated backend endpoint that creates a `client-account` record from the lead's data.
3. Marks the lead company as `CONVERTED` and links it to the new client account.
4. Links all contacts to the new client account while keeping their lead-company link intact.
5. Redirects the user to the new client account detail page.
6. If already converted, the button becomes a "View Client Account" link.

## Scope

### Backend (`apps/backend`)
| File | Change |
|------|--------|
| `src/api/client-account/` | **New** — full Strapi collection-type API (schema, controller, routes, service) |
| `src/api/lead-company/content-types/lead-company/schema.json` | Added `convertedAt` (datetime) and `convertedAccount` (oneToOne → client-account) |
| `src/api/lead-company/controllers/lead-company.js` | Added `convertToClient` action + `CLIENT_ACCOUNT_UID` constant; expanded `ALLOWED_POPULATE`; added strict `status` validation/normalization and `statuses` action |
| `src/api/lead-company/routes/lead-company.js` | Added `POST /lead-companies/:id/convert` route and `GET /lead-companies/statuses` route |
| `src/api/contact/content-types/contact/schema.json` | Added `clientAccount` (manyToOne → client-account) relation |

### Frontend (`apps/crm`)
| File | Change |
|------|--------|
| `lib/api/clientAccountService.js` | Replaced stub with real Strapi `/client-accounts` API calls |
| `lib/api/leadCompanyService.js` | Added `convertToClient(id)` method; default populate now includes `convertedAccount` |
| `app/sales/lead-companies/[id]/page.js` | Confirmation modal state + handler; button swaps to "View Client Account" link when converted |

## Backend API

### `POST /api/lead-companies/:id/convert`

Converts a lead company to a client account. Requires JWT + active organization header.

**Response**
```json
{
  "data": {
    "leadCompany": { "id": 1, "status": "CONVERTED", "convertedAt": "...", "convertedAccount": { "id": 5 } },
    "clientAccount": { "id": 5, "companyName": "...", "status": "ACTIVE", ... }
  }
}
```

**Error cases**
- `400` — already converted
- `403` — org mismatch / access denied
- `404` — lead company not found

### `GET /api/lead-companies/statuses`

Returns the allowed lead-company status values from backend so frontend can avoid hardcoding.

**Response**
```json
{
  "data": [
    { "value": "NEW", "label": "NEW" },
    { "value": "CONTACTED", "label": "CONTACTED" },
    { "value": "QUALIFIED", "label": "QUALIFIED" },
    { "value": "LOST", "label": "LOST" },
    { "value": "CONVERTED", "label": "CONVERTED" },
    { "value": "CLIENT", "label": "CLIENT" }
  ]
}
```

### Lead-company `status` validation

On `create` and `update`, backend now validates and normalizes `status` to uppercase.  
Allowed values:

- `NEW`
- `CONTACTED`
- `QUALIFIED`
- `LOST`
- `CONVERTED`
- `CLIENT`

If an invalid value is sent, API returns `400` with an allowed-values message.

### `GET/POST/PUT/DELETE /api/client-accounts`

Standard CRUD for client accounts, scoped to the requesting organization.

## Data Model

```
lead-company
  ├── convertedAt        datetime
  └── convertedAccount   oneToOne → client-account (mappedBy: convertedFromLead)

client-account
  ├── status             string  (default: ACTIVE)
  ├── conversionDate     datetime
  ├── organization       manyToOne → organization
  ├── assignedTo         manyToOne → user
  ├── convertedFromLead  oneToOne → lead-company (inversedBy: convertedAccount)
  └── contacts           oneToMany → contact (mappedBy: clientAccount)

contact
  ├── leadCompany    manyToOne → lead-company   (unchanged)
  └── clientAccount  manyToOne → client-account (new)
```

## UI Flow

1. User opens a lead company detail page.
2. Clicks the **Convert to Client** button (top-right).
3. A confirmation modal appears showing what the conversion does.
4. User confirms → API call is made → success redirects to `/clients/accounts/:newId`.
5. If already converted: the button is replaced by a green **View Client Account** link.
