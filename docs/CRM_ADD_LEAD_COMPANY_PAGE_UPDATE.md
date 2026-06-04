# CRM Add New Lead Company Page – Update Summary

## Summary

The **Add New Lead Company** page in the CRM app was rebuilt to match the reference implementation from the xtrawrkx_suits CRM portal. The page now includes a full multi-section form (Company Information, Contact Information, Lead Status), validation with a modal and inline errors, dynamic contacts (add/remove/primary), and success state with redirect.

## Scope

- **App:** `apps/crm`
- **Files changed/added:**
  - `apps/crm/app/sales/lead-companies/new/page.js` – full rewrite
  - `apps/crm/lib/strapiClient.js` – added `getXtrawrkxUsers()` for assignment dropdown

## Details

### UI and behaviour

- **Company Information:** Company name, industry, company type, sub-type, website, phone, email, address (street, city, state, country, ZIP), company size, founded year, deal value, LinkedIn, Twitter, lead source, assigned to, description, notes. Sub-type options depend on company type (Startup/Investors/Enablers & Academia).
- **Contact Information:** One or more contacts; each has first name, last name, email, phone, job title, department, contact role. “Add Contact”, “Set as Primary”, remove contact (when more than one). Primary badge on the primary contact.
- **Lead Status:** Initial status and lead source.
- **Validation:** Required fields (company name, industry, company email; per contact: first name, last name, valid email). On submit, if invalid: validation modal and inline error banner; errors clear as the user edits.
- **Success:** After successful create, a success screen is shown and the user is redirected to the new lead company detail page (or list if no id).

### Technical

- **Components:** All from `@webfudge/ui`: `Card`, `Button`, `Input`, `Select`, `Textarea`, `Badge`, `Modal`. Page header: `CRMPageHeader`. Icons: `lucide-react`.
- **Data:** `leadCompanyService.create()` for the company; `contactService.create()` for each valid contact (when available). `strapiClient.getXtrawrkxUsers()` used to load users for the “Assigned To” dropdown; current user is auto-selected when found.
- **Auth:** `useAuth()` from `@webfudge/auth` for current user (for auto-assign and user list matching).

### Strapi client

- **`getXtrawrkxUsers(params)`:** New method on `strapiClient` that calls `GET /api/users` with pagination (and optional `populate`). Used to fetch users for the assignment dropdown. Response shape is assumed to be Strapi-like (`data`, `meta.pagination`); if your backend uses a different users endpoint, adjust the method or endpoint in `strapiClient.js`.

## Usage / migration

- **No migration** for existing users; the route is still `/sales/lead-companies/new`.
- **Backend:** `leadCompanyService` and `contactService` are still stubs in this repo. When you connect a real API, ensure:
  - `leadCompanyService.create(payload)` accepts the payload built on this page and returns a created resource with an `id` (or `data.id`).
  - `contactService.create(contactData)` accepts `leadCompany`, `isPrimary`, `assignedTo`, and other fields used on the page.
- **Users list:** If your Strapi (or other) API uses a path other than `/users` for CRM users, update `getXtrawrkxUsers()` in `apps/crm/lib/strapiClient.js` to use the correct endpoint and query params.
