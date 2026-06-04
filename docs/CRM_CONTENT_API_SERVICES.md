# CRM content API services (shared Strapi 5 helpers)

## Summary

CRM Strapi clients in `apps/crm/lib/api/*Service.js` now share **`strapiContentApi.js`**: list-query building, Strapi 5–safe `populate`, and consistent response normalization.

## Why

- Strapi 5 rejects comma-separated `populate=a,b` on GET (often **500**). Populate must be sent as `populate[0]=a&populate[1]=b` (or a single scalar when appropriate).
- Duplicate `getAll` / normalization logic was hard to keep consistent across lead companies, contacts, deals, client accounts, tasks, and projects.

## Scope

| Module | Path |
|--------|------|
| Shared helpers | `apps/crm/lib/api/strapiContentApi.js` |
| Content services | `clientAccountService`, `contactService`, `dealService`, `leadCompanyService`, `taskService`, `projectService` |
| Related | `notificationService` (`addPopulate`), `globalSearchService` (array `populate`) |

## API (`strapiContentApi.js`)

- **`addPopulate(query, populate)`** — array → indexed keys; string left as `populate=` for single-token cases.
- **`buildListQuery(params)`** — merges pass-through keys (`filters[$or][0]…`, `pagination[page]`, …) with `sort`, optional `pagination` object, `filters`, and `populate`.
- **`normalizeStrapiEntry` / `normalizeStrapiListResponse` / `normalizeStrapiOneResponse`** — shared flattening for `{ id, attributes }` REST payloads.

## Service shape (convention)

Each content service typically defines:

- `ENDPOINT`
- thin `normalizeEntry` (often `normalizeStrapiEntry` only; lead company adds `contacts.data` flattening)
- `normalizeListResponse` / `normalizeOneResponse` wrappers
- **`getAll`**, **`getOne`**, **`create`**, **`update`**, **`delete`**
- extra methods as needed (e.g. `taskService.fetchMyWorkSummary`, `dealService.getPipeline`)

`crmActivityService` stays specialized (custom timeline/comment routes, no CRUD resource).

## Usage

New list calls should use:

```js
import { buildListQuery } from './strapiContentApi';

await strapiClient.get(ENDPOINT, buildListQuery({
  sort: 'updatedAt:desc',
  'pagination[pageSize]': 50,
  populate: ['assignedTo', 'organization'],
  filters: { /* or rely on flat filter keys in params */ },
}));
```

Do not join populate fields with commas for Strapi 5.
