# CRM: Won deal → delivery project + Clients Tasks/Projects

## Summary

When a deal moves to **Won**, the CRM can prompt to create a **delivery project** linked to that deal. **Tasks** and **Projects** live under **Clients** navigation; the old **Delivery** app routes were removed and redirect to the new paths.

## Scope

- **Backend**: `deal.deliveryProject` / `project.sourceDeal` (one-to-one), `POST /api/deals/:id/delivery-project`
- **CRM**: `WonDealProjectModal`, deals list stage control, deal detail inline save, full edit page; `navigation.js`, `CRMSidebar`, `/clients/tasks`, `/clients/projects`, `/clients/projects/board`
- **Next.js**: `redirects` from `/delivery/*` to `/clients/*`

## Usage

1. Set deal stage to **Won** (list, detail overview edit, or full edit).
2. If there is no linked project yet, a modal offers **Create project**, **Skip project**, or **Cancel**.
3. **Create project** marks the deal won (if needed), then calls the delivery-project endpoint. **Skip** only marks won.

After schema changes, restart Strapi and ensure DB migrations run for the new relations.

## Migration

Bookmarked `/delivery/*` URLs redirect to `/clients/*` equivalents.
