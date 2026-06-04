# VLM App and Strapi Update Summary

## Summary
Added a new Vehicle Lifecycle Management app at `apps/(automobile)/vlm` using the same Next.js structure and `lib/api` service pattern as CRM/PM, and introduced VLM Strapi collection APIs in `apps/backend/src/api`.

## Scope
- Frontend app: `apps/(automobile)/vlm`
- Backend APIs: `apps/backend/src/api/vehicle`, `vehicle-event`, `allocation`, `service-record`, `warranty-record`
- Documentation: `docs/VLM_APP_AND_STRAPI.md`, `docs/DOCUMENTATION_INDEX.md`

## Details
- Added VLM app shell with:
  - `app/layout.js` with `AuthProvider`
  - `components/LayoutContent.jsx` + `components/VLMSidebar.jsx`
  - `components/VLMPageHeader.jsx`
  - `guards/.gitkeep`
- Added VLM business logic in `lib/api` only:
  - `vehicleService.js`
  - `allocationService.js`
  - `movementService.js`
  - `serviceRecordService.js`
  - `warrantyService.js`
  - `reportService.js`
  - shared `strapiClient.js` and `strapiContentApi.js`
- Implemented event-driven lifecycle:
  - Vehicle status is derived from `vehicle-events` in API layer.
  - Vehicle creation appends a `CREATED` event.
  - Allocation flow appends an `ALLOCATED` event with dealer metadata.
  - No direct status mutation in UI flows.
- Added VLM routes:
  - `/vlm/vehicles`
  - `/vlm/vehicles/[id]`
  - `/vlm/allocations`
  - `/vlm/service`
  - `/vlm/warranty`
  - `/vlm/reports`
- Added vehicle detail tabs:
  - Overview
  - Timeline
  - Allocation History
  - Service History
  - Warranty
- Added module scaffold directories and starter files:
  - `modules/vehicles|allocations|movement|service|warranty|reports/{components,hooks,utils}`

## Backend Collections Added
- `vehicles`
- `vehicle-events`
- `allocations`
- `service-records`
- `warranty-records`

Each collection includes:
- `organization` relation (org scoping)
- `createdBy` relation to users

## Usage Notes
- All VLM API calls go through `lib/strapiClient.js` and include org context via `X-Organization-Id`.
- Lifecycle status should be consumed from `derivedStatus` returned by `vehicleService`.

## Dev Commands & Ports

### Standard apps (root)
Running `npm run dev` from repo root will start the standard apps **excluding**:
- `backend`
- `(automobile)` apps (currently `@webfudge/vlm`)

Ports:
- `landing`: 3000
- `crm`: 3001
- `pm`: 3002
- `accounts`: 3003
- `vendor`: 3004
- `books`: 3005

### Automobile apps
Run automobile apps separately:
- `npm run dev:auto`: runs **all apps under** `apps/(automobile)/*` (each app uses its own configured port)

### Backend (Strapi)
Run backend separately:
- `npm run dev:backend`

