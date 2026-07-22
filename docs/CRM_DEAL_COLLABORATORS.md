# CRM Deal Collaborators Update

## Summary

CRM deals now support multi-person collaboration on create and edit, using the same assignee-picker UX as PM projects and tasks.

## Scope

- **Backend:** `deal` schema (`collaborators` many-to-many), deal controller, notifications, user-assignment transfer, delivery-project seeding
- **CRM:** Add Deal, Edit Deal, Deal detail; `dealService`; shared `TaskAssigneesPicker` component (copied from PM for UI parity)

## Details

### Data model

- Existing: `assignedTo` (single deal owner)
- New: `collaborators` — many-to-many → users (same pattern as task collaborators / project `teamMembers`)

### Create / edit UI

- New **Collaboration** section on `/sales/deals/new` and `/sales/deals/[id]/edit`
- Multi-select modal picker (stacked avatars + “Choose teammates”), matching PM project assignees
- Edit page: managers still change **Assigned to**; anyone who can edit can set collaborators

### API / client

- Writes send `collaborators: { set: [userId, …] }` (Strapi 5 M2M)
- `dealService` populates `collaborators` on `getOne` by default
- Comment/update notifications include collaborators as stakeholders
- Won-deal delivery projects copy deal collaborators → project `teamMembers`
- Org user remove/transfer also moves deal collaborator memberships

## Usage

1. Restart Strapi so the `collaborators` relation is registered (link table created).
2. Open **Add New Deal** or **Edit Deal** → **Collaboration** → choose teammates.
3. Collaborators appear on the deal detail sidebar; notifications go to owner + collaborators.
