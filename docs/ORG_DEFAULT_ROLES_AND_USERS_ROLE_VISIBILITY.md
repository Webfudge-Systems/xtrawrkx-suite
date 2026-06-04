# Organization Default Roles and Users Role Visibility

## Summary
The Accounts Users table now always shows a visible role, and backend now seeds default organization role templates in DB.
This establishes three baseline roles for every environment: `Admin`, `Manager`, and `Member`.

## Scope
- Backend:
  - `apps/backend/src/api/organization/controllers/organization.js`
  - `apps/backend/src/index.js`
  - `apps/backend/src/api/organization-role/**`
- Frontend:
  - `apps/accounts/app/users/page.js`

## Details
- Converted `organization-user.role` from a text field to a real relation:
  - `organization-user.role` -> `manyToOne` -> `organization-role`
- Users API response now defaults missing membership role to `Member`.
- Users table rendering now defaults missing role display to `Member`.
- Fixed Accounts role cell wiring to shared UI API (`roleLabel` prop), so membership roles render instead of `—`.
- Added new Strapi collection type: `organization-role` with fields:
  - `name` (unique)
  - `code` (uid, unique)
  - `accessLevel` (`high` | `medium` | `basic`)
  - `description`
  - `isSystem`
- Added bootstrap seed logic for default roles:
  - `Admin` -> `high`
  - `Manager` -> `medium`
  - `Member` -> `basic`
  - each seeded with explicit `code` (`admin`, `manager`, `member`) to satisfy `uid` requirement.
- Added bootstrap backfill for existing memberships where role is empty/null:
  - set relation to default `Member` role record
- Removed fallback `/api/users/me?populate=role` calls from auth package to align with CRM/PM auth shape (`/api/auth/me`) and eliminate recurring 401 console noise.
- Updated org creation and invitation flows to resolve role relation IDs (`Admin` / `Manager` / `Member`) instead of writing role text.

## Usage / Notes
- Access-level meanings are placeholders for now and can be finalized later in permissions logic.
- Restart backend once so schema sync + bootstrap seeding runs.
