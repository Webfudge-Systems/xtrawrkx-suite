# Accounts Departments Update

## Summary

Added functional department management to Fudge Base: create/edit departments and assign them to users. Removed the Billing page from the Accounts app. No department-wise data scoping was added (departments are organizational labels only).

## Scope

### Backend (`apps/backend`)
- New `department` content type with org-scoped CRUD (`GET/POST/PUT/DELETE /api/departments`)
- `organization-user` relations: `departments` (many-to-many), `primaryDepartment`
- `utils/department-membership.js` — validate and persist user↔department assignments
- `utils/org-admin-resource.js` — shared org-scoped admin controller factory
- Organization APIs: `getUsers`, `inviteUsers`, `updateUserMembership` return/accept `departmentIds` and `primaryDepartmentId`

### Frontend (`apps/accounts`)
- Full `/departments` page (KPIs, tabs, table, create/edit/delete)
- `DepartmentPillMultiSelect` on Users invite/edit modals
- Departments column on Users table
- Billing removed from sidebar, dashboard, and metadata

## Usage

1. Restart Strapi so the new `department` API and schema fields register.
2. Create departments at **Departments** in the sidebar.
3. Assign departments when inviting (direct add) or editing users on the **Users** page.

Departments do not filter CRM/PM data or restrict access by department header — they are for organization structure and user grouping only.
