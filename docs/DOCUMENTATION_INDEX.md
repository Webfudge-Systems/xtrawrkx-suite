# Webfudge Platform - Documentation Index

Your complete guide to the Webfudge Platform documentation.

---

## 📚 Quick Navigation

### 🚀 Getting Started (Start Here!)

| Document                                       | Description                                  | Read Time | Priority |
| ---------------------------------------------- | -------------------------------------------- | --------- | -------- |
| **[XTRAWRKX_USER_MANUAL.md](./XTRAWRKX_USER_MANUAL.md)** | **End-user guide** — login credentials, all apps, Landing Firebase CMS, workflows; Orbit steps done; Books excluded | 50 min | 🔴 High |
| **[GETTING_STARTED.md](./GETTING_STARTED.md)** | Your first stop - overview and learning path | 10 min    | 🔴 High  |
| **[INSTALLATION.md](./INSTALLATION.md)**       | Step-by-step installation instructions       | 15 min    | 🔴 High  |
| **[QUICKSTART.md](./QUICKSTART.md)**           | Get running in 5 minutes                     | 5 min     | 🔴 High  |

### 📖 Core Documentation

| Document                                   | Description                             | Read Time | Priority  |
| ------------------------------------------ | --------------------------------------- | --------- | --------- |
| **[README.md](./README.md)**               | Project overview and structure          | 10 min    | 🔴 High   |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)**   | System design and architecture diagrams | 20 min    | 🟡 Medium |
| **[SETUP_SUMMARY.md](./SETUP_SUMMARY.md)** | Detailed summary of what's initialized  | 10 min    | 🟡 Medium |

### 🛠️ Reference Guides

| Document                               | Description                 | Read Time | Priority  |
| -------------------------------------- | --------------------------- | --------- | --------- |
| **[COMMANDS.md](./COMMANDS.md)**       | Complete command reference  | 15 min    | 🟡 Medium |
| **[ENVIRONMENT.md](./ENVIRONMENT.md)** | Environment variables guide | 15 min    | 🟡 Medium |
| **[ENV_FILES.md](./ENV_FILES.md)** | `.env.example` / `.env.local` / `.env.production` per app, `*.xtrawrkx.com` URLs | 5 min | 🔴 High |
| **[WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md](./WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md)** | **From-scratch deploy**: GitHub Webfudge Systems org repo, existing Railway `xtrawrkx-suite`, new Vercel team projects, Postgres paths (keep / import / empty) | 30 min | 🔴 High |
| **[XTRAWRKX_PRODUCTION_DEPLOYMENT_GUIDE.md](./XTRAWRKX_PRODUCTION_DEPLOYMENT_GUIDE.md)** | Production quick reference (`*.xtrawrkx.com`) — points to Webfudge Systems guide for full setup | 10 min | 🔴 High |
| **[ACCOUNTS_PRODUCTION_DEPLOY.md](./ACCOUNTS_PRODUCTION_DEPLOY.md)** | Accounts app production deploy (env, build, run) | 5 min | 🟡 Medium |
| **[RAILWAY_STRAPI_DEPLOY.md](./RAILWAY_STRAPI_DEPLOY.md)** | Strapi on Railway: Postgres variables, SSL, pool, crash-loop fixes | 5 min | 🔴 High |

### 📋 Project Management

| Document                                           | Description                       | Read Time | Priority |
| -------------------------------------------------- | --------------------------------- | --------- | -------- |
| **[PROJECT_CHECKLIST.md](./PROJECT_CHECKLIST.md)** | Track implementation progress     | 15 min    | 🟢 Low   |
| **[COMPLETION_REPORT.md](./COMPLETION_REPORT.md)** | Initialization completion details | 10 min    | 🟢 Low   |

### 📝 Change summaries / Updates

| Document                                                                                                 | Description                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[WEBFUDGE_PLATFORM_SYNC_2026.md](./WEBFUDGE_PLATFORM_SYNC_2026.md)**                                   | June 2026 sync from webfudge-platform: table column picker, sidebar branding, S3 uploads, entity files, Books shell — preserves Xtrawrkx branding and migrations             |
| **[XTRAWRKX_USER_MANUAL.md](./XTRAWRKX_USER_MANUAL.md)**                                                 | Complete end-user manual: login credentials, Orbit (steps done), Fudge Base, Fudge People, Fudge Work, Landing CMS, Client Portal; Fudge Books excluded                      |
| **[LEAD_COMPANIES_LOAD_PERFORMANCE.md](./LEAD_COMPANIES_LOAD_PERFORMANCE.md)**                             | CRM Lead Companies + Contacts lists: server pagination, `/stats` endpoints, scoped queries — fixes slow initial load |
| **[FUDGE_SUITE_BRANDING.md](./FUDGE_SUITE_BRANDING.md)**                                                 | Fudge Suite (Option A) branding across CRM, PM, Accounts, Books — Xtrawrkx-primary product names with Webfudge Systems creator credit                                  |
| **[ORBIT_WEBFUDGE_BRANDING.md](./ORBIT_WEBFUDGE_BRANDING.md)**                                           | Organization Manager (Orbit) — full Webfudge Systems branding (naming, logos, favicons, theme)                                                                              |
| **[LANDING_MONOREPO_UPDATE.md](./LANDING_MONOREPO_UPDATE.md)**                                           | Marketing site at `apps/landing` as `@xtrawrkx/landing` (renamed from `client`), Turbo/Vercel monorepo wiring                                                               |
| **[WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md](./WEBFUDGE_SYSTEMS_DEPLOYMENT_GUIDE.md)**                       | Full from-scratch: Webfudge Systems GitHub + Vercel, Railway reconnect, Postgres migrate/keep/empty                                                                           |
| **[XTRAWRKX_PRODUCTION_DEPLOYMENT_GUIDE.md](./XTRAWRKX_PRODUCTION_DEPLOYMENT_GUIDE.md)**                 | Production quick reference and `*.xtrawrkx.com` layout                                                                                                                        |
| **[LOCAL_DB_RESET.md](./LOCAL_DB_RESET.md)**                                                             | Wipe local SQLite, re-seed platform admin (`admin@xtrawrkx.com`), fix `isPlatformAdmin` + Orbit login                                                                           |
| **[ACCOUNTS_GREENWAYS_PARITY.md](./ACCOUNTS_GREENWAYS_PARITY.md)**                                       | Fudge Base aligned with Greenways accounts: departments, teams, users+depts, security, billing, backend APIs                                                                      |
| **[ACCOUNTS_USER_REMOVE_AND_TRANSFER.md](./ACCOUNTS_USER_REMOVE_AND_TRANSFER.md)**                       | Remove user from org, suspend with required assignment transfer (CRM, PM, departments, teams, owner)                                                                            |
| **[SHARED_COMPONENT_CLEANUP_2026.md](./SHARED_COMPONENT_CLEANUP_2026.md)**                               | CRM dashboard charts → `@webfudge/ui`; shared `QuickActionsFab`; Accounts status badge via `Badge`; missing `.env.example` files for PM, Books, VLM |
| **[CROSS_APP_UI_CONSOLIDATION.md](./CROSS_APP_UI_CONSOLIDATION.md)**                                     | PM→CRM→Accounts consolidation: TableSortDropdown, AccessDeniedPanel, WorkspaceLayoutContent, shared utils (leadCompanyProfileOptions, contactCompanyFields, industryVisuals) |
| **[CRM_TABLE_SORT_RESIZE.md](./CRM_TABLE_SORT_RESIZE.md)**                                               | CRM tables (Lead Companies, Contacts, Deals) — multi-column sort panel + drag-to-resize columns, mirroring PM feature set |
| **[SHARED_UI_OPTIMIZATION.md](./SHARED_UI_OPTIMIZATION.md)**                                             | PM + CRM shared UI consolidation: EntityDetailLayout, MeetingsEmbedList, AppPageHeader, ProgressBar moved to `@webfudge/ui`; CRM GlobalSearchModal refactored; PM SidebarTrialUpsell added |
| **[WRAPPER_FILES_REMOVAL.md](./WRAPPER_FILES_REMOVAL.md)**                                               | Removed all thin re-export wrapper files from `apps/pm` and `apps/crm`; all consumers now import directly from `@webfudge/ui` or `@webfudge/utils` |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[LANDING_WEBSITE_SIGNUP_CRM.md](./LANDING_WEBSITE_SIGNUP_CRM.md)**                                     | Landing signup → CRM client account in Xtrawrkx org (secured `/client-accounts/website-signup`, primary contact, onboarding project)                                          |
| **[CLIENT_PORTAL_AUTH_UPDATE.md](./CLIENT_PORTAL_AUTH_UPDATE.md)**                                       | Client portal sign-in: `POST /api/auth/client/login`, client JWT on `/api/auth/me`, portal-access credential lookup |
| **[LANDING_CONTACT_FORM.md](./LANDING_CONTACT_FORM.md)**                                                 | Landing Get in Touch form — Gmail SMTP API route, env setup, submissions to webfugesystems@gmail.com                                                                          |
| **[LANDING_MOBILE_RESPONSIVE_UPDATE.md](./LANDING_MOBILE_RESPONSIVE_UPDATE.md)**                         | Landing home page mobile responsive pass: overflow fixes, responsive grids, sticky/stack behavior, typography, navbar menu                                                     |
| **[LANDING_AUTH_UI_UPDATE.md](./LANDING_AUTH_UI_UPDATE.md)**                                             | Landing `/auth` full-viewport split layout: dedicated `(auth)` route group without Navbar/Footer, refreshed sign-in/sign-up UX                                                |
| **[LANDING_COMPANY_DUPLICATE_CHECK.md](./LANDING_COMPANY_DUPLICATE_CHECK.md)**                           | Landing signup company name real-time fuzzy match against CRM client accounts and leads; suggestions UI + confirmation for strong matches                                   |
| **[AUTOMATION_BUILDER.md](./AUTOMATION_BUILDER.md)**                                                     | Visual Automation Builder: drag-and-drop canvas, NodeLibrary, NodeConfigPanel, 14 node types, useAutomationBuilder hook, automationService, packages/ui NodeHandle + WorkflowStatusBadge |
| **[PM_CRM_RBAC_FOUNDATION.md](./PM_CRM_RBAC_FOUNDATION.md)**                                             | PM + CRM RBAC foundation: effective backend permissions, Accounts settings/app access, shared auth helpers, and PM/CRM module gating                                           |
| **[CRM_DASHBOARD_MULTI_VIEW_RBAC.md](./CRM_DASHBOARD_MULTI_VIEW_RBAC.md)**                               | CRM dashboard Personal / Sales / Manager views with org-role tabs, team performance widget, and sales quick links                                                             |
| **[ACCOUNTS_ORGANIZATION_SETTINGS_UPDATE.md](./ACCOUNTS_ORGANIZATION_SETTINGS_UPDATE.md)**               | Accounts Organization Settings: save fixes (blank → null), owner/Admin edit access, UI/UX refresh on `/settings`                                                                |
| **[PM_ORG_ROLE_SCOPING.md](./PM_ORG_ROLE_SCOPING.md)**                                                   | PM row-level rules by **org** role: managers see all projects but edit assigned only; members scoped to assigned projects/tasks; member task updates = status only              |
| **[PM_LAST_COMMIT_UPDATE_SUMMARY.md](./PM_LAST_COMMIT_UPDATE_SUMMARY.md)**                               | Cross-suite PM sync from webfudge-platform: private projects, task permissions, Reporter label, project manager on tasks, subtask promote + single assignee                     |
| **[TASK_PROGRESS_REMOVAL.md](./TASK_PROGRESS_REMOVAL.md)**                                               | Removed per-task `progress` (0–100%); status-only completion; project % from task counts unchanged                                                                            |
| **[MEETINGS_FEATURE.md](./MEETINGS_FEATURE.md)**                                                         | Full-stack Meetings module: Strapi schema, list page (table + FullCalendar toggle), new meeting form, detail page (5 tabs), analytics, Firefly.ai hooks, sidebar nav update   |
| **[WORKSPACE_CALENDAR.md](./WORKSPACE_CALENDAR.md)**                                                     | Shared `/calendar` in CRM and PM: meetings + scheduled tasks + project timelines, `UnifiedWorkspaceCalendar`, cross-app deep links                                            |
| **[PWA_CRM_PM_UPDATE.md](./PWA_CRM_PM_UPDATE.md)**                                                       | Installable PWAs for CRM and PM: Serwist service worker, enhanced manifest, offline page, `PwaInstallPrompt`                                                                |
| **[PM_APP_SETUP.md](./PM_APP_SETUP.md)**                                                                 | Full PM app setup: dashboard, projects, tasks, analytics, inbox, messages — UI consistent with CRM                                                                            |
| **[TASK_RECURRENCE.md](./TASK_RECURRENCE.md)**                                                             | Recurring tasks: daily / weekly / monthly / custom; spawn next occurrence on complete; PM forms + tables                                                                      |
| **[TASK_START_DATE_FIELD.md](./TASK_START_DATE_FIELD.md)**                                                 | Task schema + PM UI: optional `startDate` alongside due (`scheduledDate`); detail KPIs, tables, create/edit modal                                                             |
| **[CALENDAR_DATE_DISPLAY_FIX.md](./CALENDAR_DATE_DISPLAY_FIX.md)**                                         | Calendar start/due dates: local day parsing, day-based relative labels in tables, overdue by calendar day (PM + CRM)                                                          |
| **[TASK_SUBTASKS_UPDATE.md](./TASK_SUBTASKS_UPDATE.md)**                                                   | Task hierarchy: `parent` / `subtasks`, controller validation, PM tables (inline expand + Add subtask), task detail Subtasks tab, `Table.renderAfterRow`, `QuickCreateTaskModal.parentContext` |
| **[TASK_API_PROJECT_FILTER_FIX.md](./TASK_API_PROJECT_FILTER_FIX.md)**                                     | Task `find` controller now honors `filters[projects]` so project detail lists only tasks linked to that project                                                               |
| **[PM_TASK_DETAIL_CRM_ACTIVITY.md](./PM_TASK_DETAIL_CRM_ACTIVITY.md)**                                   | Task detail page aligned with project detail: KPIs, `EntityActivityPanel` with real CRM timeline/comments, `defaultSubTab` for Chats vs Activity                                 |
| **[PM_TASK_ASSIGNMENT_APPROVAL.md](./PM_TASK_ASSIGNMENT_APPROVAL.md)**                                   | Project team members can create tasks; org Member assignees require admin/manager approval before assignment applies                                                          |
| **[PM_CRM_PARITY_UPGRADE.md](./PM_CRM_PARITY_UPGRADE.md)**                                               | PM app upgraded as “CRM for Projects”: CRM-style project/task tables, detail pages, actions, Kanban, and frontend-first activity/files tabs                                  |
| **[PM_SIDEBAR_CRM_ALIGNMENT.md](./PM_SIDEBAR_CRM_ALIGNMENT.md)**                                         | PM sidebar restyled to match CRM: glass shell, Quick Actions, Card Tools/footer, `@webfudge/ui` components                                                                    |
| **[PM_TABLE_EMPTY_STATE_UPDATE.md](./PM_TABLE_EMPTY_STATE_UPDATE.md)**                                   | PM list empty states aligned with CRM: `TableResultsCount`, `TableEmptyBelow`, `Table` variant `modernEmbedded`                                                               |
| **[PM_DASHBOARD_WIDGETS_UPDATE.md](./PM_DASHBOARD_WIDGETS_UPDATE.md)**                                   | PM dashboard: Upcoming Deadlines + Activity Feed widgets; Projects sidebar card removed from dashboard                                                                      |
| **[PM_PROJECTS_VIEW_UPDATE.md](./PM_PROJECTS_VIEW_UPDATE.md)**                                           | PM Projects view-all page updated to match reference UI                                                                                                                       |
| **[PM_PROJECTS_TABLE_COMMENTS_OWNER.md](./PM_PROJECTS_TABLE_COMMENTS_OWNER.md)**                         | Projects table: hover/comments control + `projectIds` comment-counts API; owner column aligned with My Tasks assigner                                                       |
| **[PM_PROJECTS_TABLE_COLUMNS_UPDATE.md](./PM_PROJECTS_TABLE_COLUMNS_UPDATE.md)**                         | Projects list table: extra optional columns, drag-reorder column picker, `localStorage` visibility + order, reset restores defaults                                            |
| **[PM_PROJECTS_KANBAN_DRAG_DROP.md](./PM_PROJECTS_KANBAN_DRAG_DROP.md)**                                   | Projects Kanban: `@dnd-kit` drag between status columns; `ProjectsKanbanBoard`; respects `canEditProjectInPm`                                                                  |
| **[PM_ADD_PROJECT_FORM_UPDATE.md](./PM_ADD_PROJECT_FORM_UPDATE.md)**                                     | PM Add New Project form aligned to reference labels/layout/sections                                                                                                           |
| **[PROJECT_CLIENT_ACCOUNT_UPDATE.md](./PROJECT_CLIENT_ACCOUNT_UPDATE.md)**                               | Projects `clientAccount` relation and PM client picker use client accounts (not lead companies); migration notes                                                               |
| **[PM_MY_TASKS_HEADER_UPDATE.md](./PM_MY_TASKS_HEADER_UPDATE.md)**                                       | PM “My Tasks” header updated to match Projects header layout                                                                                                                  |
| **[PM_MY_TASKS_MULTI_VIEW.md](./PM_MY_TASKS_MULTI_VIEW.md)**                                               | My Tasks: List (by status), Table, Kanban (pipeline-style + dnd), Timeline; `ViewToggleGroup` + `TabsWithActions.afterTabs`; `localStorage` `pm.myTasks.taskView`               |
| **[PM_TABLE_SORTING_UPDATE.md](./PM_TABLE_SORTING_UPDATE.md)**                                             | PM tables: multi-column client-side sort (header click, Shift+multi, sort panel), `@webfudge/ui` `Table` + `useTableSort`, per-screen `localStorage`                             |
| **[CRM_DEALS_TABLE_KANBAN_VIEW.md](./CRM_DEALS_TABLE_KANBAN_VIEW.md)**                                     | CRM Deals list: Table + Kanban on `/sales/deals`; `DealsKanbanBoard`; Pipeline page refactored to same board; `crm.deals.viewMode`                                              |
| **[PM_MESSAGES_PAGE_UPDATE.md](./PM_MESSAGES_PAGE_UPDATE.md)**                                           | PM `/message` UI (KPIs, cards) + `fetchMessageContacts` org directory with assignable-users fallback                                                                           |
| **[PM_INBOX_UPDATE.md](./PM_INBOX_UPDATE.md)**                                                           | PM `/inbox`: three tabs (PM activity feed, notifications + archive, PM threads); feed `subjectTypes` filter                                                                  |
| **[IN_APP_NOTIFICATIONS.md](./IN_APP_NOTIFICATIONS.md)**                                                 | In-app notifications: backend emitter (comments, updates, @mentions urgent, DMs), bell dropdown + PM inbox deep links                                                        |
| **[PM_CLIENT_ACCOUNTS.md](./PM_CLIENT_ACCOUNTS.md)**                                                     | PM Client Accounts: CRM-parity list + detail at `/clients/accounts`, sidebar Clients tab, CRM cross-links for contacts/deals/invoices                                         |
| **[PM_ADD_TASK_PAGE_UPDATE.md](./PM_ADD_TASK_PAGE_UPDATE.md)**                                           | PM “Add Task” now uses a dedicated page route (no modal pop)                                                                                                                  |
| **[PM_ANALYTICS_PAGE_UI_UPDATE.md](./PM_ANALYTICS_PAGE_UI_UPDATE.md)**                                   | PM Analytics page UI updated to match reference (empty + non-empty) layouts                                                                                                   |
| **[PM_UI_ROUNDED_LG_CONSISTENCY.md](./PM_UI_ROUNDED_LG_CONSISTENCY.md)**                                 | PM + `@webfudge/ui`: `rounded-lg` for buttons, search, and tab/action controls                                                                                                |
| **[PROPOSALS_INVOICES_BACKEND_INTEGRATION.md](./PROPOSALS_INVOICES_BACKEND_INTEGRATION.md)**             | Full backend + CRUD for proposals & invoices: Strapi content types, controllers, services, list/detail/edit pages, webfudge-backend-pattern skill                             |
| **[INVOICE_BUILDER_FEATURE.md](./INVOICE_BUILDER_FEATURE.md)**                                           | Invoice Builder at `/clients/invoices/new`: org-prefilled from section, line items, tax/discount, preview + PDF download                                                      |
| **[INVOICE_BILL_TO_CONTACT_DROPDOWN.md](./INVOICE_BILL_TO_CONTACT_DROPDOWN.md)**                         | Invoice new/edit: **Bill-to contact** dropdown (contacts filtered by client account), merge with `mergeBillToFromAccountAndContact`                                           |
| **[PROPOSAL_BUILDER_FEATURE.md](./PROPOSAL_BUILDER_FEATURE.md)**                                         | Proposal/SOW Builder at `/clients/proposals/new`: multi-section form, preview modal, PDF download (html2canvas + jspdf)                                                       |
| **[CRM_ADD_LEAD_COMPANY_PAGE_UPDATE.md](./CRM_ADD_LEAD_COMPANY_PAGE_UPDATE.md)**                         | Add New Lead Company page rebuild (CRM) – form sections, validation, contacts, strapiClient users                                                                             |
| **[LEAD_COMPANY_CONTACTS_BACKEND.md](./LEAD_COMPANY_CONTACTS_BACKEND.md)**                               | Lead company `contacts` relation, contact `contactRole` / `isPrimaryContact`, CRM populate + Contacts tab                                                                     |
| **[LEAD_COMPANY_ADD_CONTACT_MODAL.md](./LEAD_COMPANY_ADD_CONTACT_MODAL.md)**                             | Lead company detail Contacts tab: gradient **Add Contact** button + modal create flow (`contactService.create`, list refresh)                                                 |
| **[LEAD_COMPANY_NEXT_CONNECT_DATE.md](./LEAD_COMPANY_NEXT_CONNECT_DATE.md)**                             | Lead companies: `nextConnectDate` field, table ribbon flags (Today / future date), add/edit forms, detail page                                                                 |
| **[LEAD_COMPANY_SUBTYPE_REMOVAL.md](./LEAD_COMPANY_SUBTYPE_REMOVAL.md)**                                 | Lead companies: `subType` removed from schema, forms, table, filters, and shared utils                                                                                      |
| **[CRM_CONTACT_COMPANY_ASSOCIATION.md](./CRM_CONTACT_COMPANY_ASSOCIATION.md)**                           | Contact create/edit: lead + client company association dropdowns, mutual exclusivity, prefill from client account URL                                                       |
| **[LEAD_COMPANIES_TABLE_COLUMN_VISIBILITY.md](./LEAD_COMPANIES_TABLE_COLUMN_VISIBILITY.md)**             | Lead companies list: all schema fields as optional table columns; eye toolbar + `localStorage` persistence                                                                    |
| **[RAILWAY_STRAPI_DEPLOY.md](./RAILWAY_STRAPI_DEPLOY.md)**                                               | Strapi on Railway: Postgres linked vars, SSL, connection pool, `SEED_DATA`, monorepo root directory; fixes Knex timeout crashes when DB is healthy                          |
| **[RAILWAY_JSON_MONOREPO_FIX.md](./RAILWAY_JSON_MONOREPO_FIX.md)**                                       | `apps/backend/railway.json` + Railway Root Directory `apps/backend` — fixes snapshot `railway.json not found` after monorepo migration                                      |
| **[RAILWAY_POSTGRES_XTRAWRKX_USERS_FIX.md](./RAILWAY_POSTGRES_XTRAWRKX_USERS_FIX.md)**                   | Railway healthcheck fail: **migrate** legacy `xtrawrkx_users` → `up_users` + `organization_users` model                                                                      |
| **[REDIS_CACHE.md](./REDIS_CACHE.md)**                                                                   | Strapi Redis: API-wide GET cache (contacts, leads, tasks, projects, …), org invalidation on writes, `X-Cache` headers, Railway setup                                      |
| **[SAAS_ARCHITECTURE_UPDATE.md](./SAAS_ARCHITECTURE_UPDATE.md)**                                         | Multi-tenant architecture: org scoping, X-Organization-Id header, notifications API, PostgreSQL path, auth org context                                                        |
| **[BACKEND_CORS_ORG_HEADER_UPDATE.md](./BACKEND_CORS_ORG_HEADER_UPDATE.md)**                             | Strapi CORS allows `X-Organization-Id`; lead-company API requires active org and safe org relation checks                                                                     |
| **[AUTH_ACTIVE_ORG_BOOTSTRAP_FIX.md](./AUTH_ACTIVE_ORG_BOOTSTRAP_FIX.md)**                               | Auth bootstrap fix for users without active org memberships; auto-provisions organization + owner membership to prevent CRM `No active organization` 403s                    |
| **[CRM_ACTIVITIES_TIMELINE.md](./CRM_ACTIVITIES_TIMELINE.md)**                                           | CRM activity log (`crm-activity` content type), contact/lead audit logging, `/crm-activities/timeline`, Activities tab UI                                                     |
| **[LEAD_COMPANY_CONVERT_TO_CLIENT.md](./LEAD_COMPANY_CONVERT_TO_CLIENT.md)**                             | Convert lead company → client account: `client-account` API, schema relations, confirm modal, CONVERTED status badge                                                          |
| **[CLIENT_ACCOUNT_ADD_NEW_PAGE.md](./CLIENT_ACCOUNT_ADD_NEW_PAGE.md)**                                   | Add New Client Account page (aligned with lead-company), contract/billing schema fields, create validation                                                                    |
| **[CLIENT_ACCOUNT_INDUSTRY_UPDATE.md](./CLIENT_ACCOUNT_INDUSTRY_UPDATE.md)**                               | Client accounts: expanded industry list, custom industry when Other is selected, sub-type removed from client-account schema and UI                                            |
| **[INDUSTRY_DROPDOWN_CUSTOM_UPDATE.md](./INDUSTRY_DROPDOWN_CUSTOM_UPDATE.md)**                             | Shorter industry presets, searchable **Add custom** in dropdown, merge saved industries from API + localStorage                                                               |
| **[CRM_EDIT_PAGES_AND_LEAD_TABLE_ACTIONS_UPDATE.md](./CRM_EDIT_PAGES_AND_LEAD_TABLE_ACTIONS_UPDATE.md)** | CRM edit pages rebuilt (Lead/Contact), success states, icon/style alignment, table industry highlight, list convert modal/action                                              |
| **[CLIENT_ACCOUNTS_TABLE_COLUMNS_UPDATE.md](./CLIENT_ACCOUNTS_TABLE_COLUMNS_UPDATE.md)**                 | Client Accounts table: lead-companies-style columns (health score, deal value, location, industry, etc.), column visibility eye-icon dropdown, drag-to-reorder                |
| **[CLIENT_ACCOUNT_DETAIL_EDIT_UI.md](./CLIENT_ACCOUNT_DETAIL_EDIT_UI.md)**                               | Client account detail (KPIs, tabs, overview, assignee) and full edit form; `clientAccountService` populate + `assignedTo` update shape                                        |
| **[CRM_TABLE_DELETE_MODAL_STANDARDIZATION.md](./CRM_TABLE_DELETE_MODAL_STANDARDIZATION.md)**             | Unified CRM table delete confirmations with shared `Modal`; replaced `window.confirm`/custom overlay and fixed lead delete modal top gap                                      |
| **[CRM_FILTER_MODALS_LEADS_CONTACTS_CLIENTS.md](./CRM_FILTER_MODALS_LEADS_CONTACTS_CLIENTS.md)**         | Added working filter modals for Lead Companies, Contacts, and Client Accounts with apply/clear flow and page-specific criteria                                                |
| **[CRM_LEAD_COMPANY_COMMENTS.md](./CRM_LEAD_COMPANY_COMMENTS.md)**                                       | Lead Companies table comment popover with backend persistence via `crm-activity` comment actions and comments thread rendering                                                |
| **[ENTITY_ACTIVITY_CHAT_PANEL.md](./ENTITY_ACTIVITY_CHAT_PANEL.md)**                                     | Activity tab redesign: 2-pane layout (summary card + dual-tab panel), feature-rich Chat sub-tab linked to table hover-chat, contactId/clientAccountId backend support         |
| **[ENTITY_ACTIVITY_UI_PACKAGE.md](./ENTITY_ACTIVITY_UI_PACKAGE.md)**                                     | `ActivitiesTimeline` + `EntityActivityPanel` in `@webfudge/ui`; CRM and PM import from shared UI                                                                              |
| **[CRM_REUSABLE_FORM_SECTION_CARD_UPDATE.md](./CRM_REUSABLE_FORM_SECTION_CARD_UPDATE.md)**               | Moved repeated CRM/PM UI wrappers (form sections, page headers, app shell) into shared `@webfudge/ui` for create/edit/list/detail/table page consistency                      |
| **[DIRECT_MESSAGES_API.md](./DIRECT_MESSAGES_API.md)**                                                   | PM direct messages: `direct-message` content type, `/api/direct-messages`, org member list, permissions                                                                       |
| **[DEALS_CRM_FULL_STACK.md](./DEALS_CRM_FULL_STACK.md)**                                                 | CRM deals: Strapi `deal` API, `dealService`, list/detail/add/edit/pipeline UI, activity log `deal` subject type                                                               |
| **[CRM_WON_DEAL_DELIVERY_PROJECT.md](./CRM_WON_DEAL_DELIVERY_PROJECT.md)**                               | Won deal → optional linked `project` (`POST /deals/:id/delivery-project`), confirmation modal; Tasks/Projects under Clients; `/delivery` removed + redirects                  |
| **[CRM_DASHBOARD_MY_WORK_WIDGET.md](./CRM_DASHBOARD_MY_WORK_WIDGET.md)**                                 | Dashboard: My work widget (today / overdue / upcoming tasks); Quick Access + Templates removed; My work removed from sidebar                                                  |
| **[CRM_WORKSPACE_NAV_UPDATE.md](./CRM_WORKSPACE_NAV_UPDATE.md)**                                         | Communication renamed to **Workspace**; proposals/invoices/tasks moved in; Hub/Email removed; Meetings/Documents (coming soon); `/communication` → `/workspace`                |
| **[CRM_SIDEBAR_NAV_REFACTOR.md](./CRM_SIDEBAR_NAV_REFACTOR.md)**                                         | CRM sidebar: primary nav (Sales / Communication / Clients / Analytics), Quick Actions, global activity feed, Automation; deal won → client link (My work → dashboard)         |
| **[CRM_ACTIVITY_LOG_PAGE.md](./CRM_ACTIVITY_LOG_PAGE.md)**                                               | Full org activity log at `/activities`, paginated `GET /crm-activities/feed`, sidebar “Full log” + Communication sub-nav                                                      |
| **[CRM_CLIENTS_TASKS_PROJECTS_TABLES.md](./CRM_CLIENTS_TASKS_PROJECTS_TABLES.md)**                       | Clients **Tasks** and **Projects** list pages aligned with Lead Companies: KPIs, tabs, filters, table cells, column visibility, row actions, `taskService` / `projectService` |
| **[CRM_TASK_SCOPE_FILTER.md](./CRM_TASK_SCOPE_FILTER.md)**                                                 | CRM shows only CRM-linked tasks (lead/client/deal); PM project-only tasks excluded from dashboard, tasks page, manager views, and calendar                                      |
| **[TASK_LIST_CACHE_FIX.md](./TASK_LIST_CACHE_FIX.md)**                                                     | Task list port: Redis skip for `/api/tasks*`, shared `paginateStrapiList`, PM/CRM/Books full pagination, My Tasks merge + race guard; `flush:api-cache` after deploy          |
| **[CRM_PRODUCTION_DATA_FIX.md](./CRM_PRODUCTION_DATA_FIX.md)**                                             | Production empty CRM dashboard: tasks 500 from invalid `contact` scope filter + legacy rows missing org; backfill script and deploy steps                                       |
| **[CRM_CONTENT_API_SERVICES.md](./CRM_CONTENT_API_SERVICES.md)**                                         | Shared `strapiContentApi.js`: Strapi 5 `populate`, `buildListQuery`, normalized list/one responses across CRM \*Service modules                                               |
| **[BACKEND_CONTENT_API_CONTROLLERS.md](./BACKEND_CONTENT_API_CONTROLLERS.md)**                           | Strapi org-scoped CRM controllers/routes: `content-api-helpers.js`, task/project tenancy, deal `deliveryProject` populate                                                     |
| **[CRM_THREADS_PAGE.md](./CRM_THREADS_PAGE.md)**                                                         | Threads page rebuilt: two-panel conversation hub, global comments feed, entity-grouped threads, real-time reply, `?type=` filter on `/crm-activities/feed`                    |
| **[VLM_APP_AND_STRAPI.md](./VLM_APP_AND_STRAPI.md)**                                                     | New VLM app (`apps/(automobile)/vlm`) + Strapi collections (`vehicles`, `vehicle-events`, `allocations`, `service-records`, `warranty-records`) with event-driven lifecycle     |
| **[ACCOUNTS_APP_FOUNDATION.md](./ACCOUNTS_APP_FOUNDATION.md)**                                           | Accounts app foundation in `apps/accounts`: CRM/PM-aligned app shell, auth/layout wiring, sidebar/header, org-aware API client, and core module route scaffolds               |
| **[ACCOUNTS_USERS_PAGE_TABLE_UI.md](./ACCOUNTS_USERS_PAGE_TABLE_UI.md)**                                 | Accounts `/users` page upgraded from scaffold to CRM-style functional list: KPI cards, tabs, search, org-scoped users table, pagination                                   |
| **[ORG_CREATOR_ADMIN_USERS_SYNC.md](./ORG_CREATOR_ADMIN_USERS_SYNC.md)**                                 | Org creation now auto-adds creator as Admin membership; Accounts users switched to org-members API; landing profile now sets active `current-org-id` for app/org navigation |
| **[ORG_DEFAULT_ROLES_AND_USERS_ROLE_VISIBILITY.md](./ORG_DEFAULT_ROLES_AND_USERS_ROLE_VISIBILITY.md)**   | Adds default org roles (`Admin`, `Manager`, `Member`) with access levels, backfills missing membership roles, and ensures role visibility in Accounts Users table          |
| **[ACCOUNTS_USERS_INVITE_EDIT_FLOW.md](./ACCOUNTS_USERS_INVITE_EDIT_FLOW.md)**                           | Accounts Users page now has Invite and Edit modals, row actions, org-role dropdowns, and backend membership update endpoint with invitation flow wiring                     |
| **[ACCOUNTS_ROLES_AND_PERMISSIONS_RBAC.md](./ACCOUNTS_ROLES_AND_PERMISSIONS_RBAC.md)**                   | Accounts `/roles` functional: CRM/PM permission matrix, system templates + org-scoped custom roles, org role CRUD APIs, Users page assigns roles by id/code              |
| **[ACCOUNTS_AUDIT_LOGS_PAGE.md](./ACCOUNTS_AUDIT_LOGS_PAGE.md)**                                          | Accounts `/audit-logs` upgraded to org-wide audit center (CRM/PM/Accounts) with enterprise filters, table + timeline view switcher, and details modal with before/after JSON |
| **[ACCOUNTS_AUDIT_LOG_USER_EVENTS.md](./ACCOUNTS_AUDIT_LOG_USER_EVENTS.md)**                               | Backend writes user add/invite/membership-update events to the shared activity feed so Audit Logs shows Accounts user management actions                                      |
| **[MODAL_NAV_PANEL_BOOKS_CRM.md](./MODAL_NAV_PANEL_BOOKS_CRM.md)**                                     | `Modal` `navPanel` variant for Books/CRM module nav; default modal `subtitle` support                                                                         |
| **[BOOKS_DASHBOARD_QUICK_ACCESS_TEMPLATES_ACTIVITY.md](./BOOKS_DASHBOARD_QUICK_ACCESS_TEMPLATES_ACTIVITY.md)** | Books dashboard “Dashboard” tab: Quick Access cards + Templates + Recent Activity (CRM-mirrored UI)                                                                |
| **[BOOKS_FINANCIAL_CHARTS_MOVED_TO_SYSTEM.md](./BOOKS_FINANCIAL_CHARTS_MOVED_TO_SYSTEM.md)** | Books dashboard charts moved to `System → Analytics` (`/reports`); Dashboard now shows Sales Analytics + Invoices Pipeline blocks |
| **[BOOKS_SYSTEM_ANALYTICS_UI_UPDATE.md](./BOOKS_SYSTEM_ANALYTICS_UI_UPDATE.md)** | Books “System Analytics” (`/reports`) upgraded to a full KPI + charts dashboard using `@webfudge/ui` components |
| **[UI_SELECT_CRM_STYLE_ALIGNMENT.md](./UI_SELECT_CRM_STYLE_ALIGNMENT.md)** | `@webfudge/ui` `Select` styling aligned to match CRM dropdown controls |
| **[BOOKS_SALES_PAGES_CRM_UI_ALIGNMENT.md](./BOOKS_SALES_PAGES_CRM_UI_ALIGNMENT.md)** | Books Sales pages (`/sales/*`) aligned to CRM list-page patterns using `@webfudge/ui` |
| **[BOOKS_PURCHASES_PAGES_CRM_UI_ALIGNMENT.md](./BOOKS_PURCHASES_PAGES_CRM_UI_ALIGNMENT.md)** | Books Purchases pages (`/purchases/*`) aligned to CRM list-page patterns using `@webfudge/ui` |
| **[BOOKS_ACCOUNTANT_PAGES_CRM_UI_ALIGNMENT.md](./BOOKS_ACCOUNTANT_PAGES_CRM_UI_ALIGNMENT.md)** | Books Accountant pages (`/accountant/*`) aligned to CRM list-page patterns using `@webfudge/ui` |
| **[BOOKS_CRM_STYLE_ADD_PAGES.md](./BOOKS_CRM_STYLE_ADD_PAGES.md)** | CRM-style “Add” pages for Sales/Purchases/Accountant, consistent create UI using `@webfudge/ui` |
| **[BOOKS_TABLE_COLUMN_PICKER.md](./BOOKS_TABLE_COLUMN_PICKER.md)** | CRM-style column visibility dropdown (eye icon) on Books Sales/Purchases/Accountant list bars |
| **[BOOKS_HOME_GETTING_STARTED_TABS.md](./BOOKS_HOME_GETTING_STARTED_TABS.md)** | Home page tabs: Getting Started onboarding UI + Announcements / Recent Updates empty states |
| **[BOOKS_HOME_KPI_CRM_ALIGNMENT.md](./BOOKS_HOME_KPI_CRM_ALIGNMENT.md)** | Books home KPI row uses `@webfudge/ui` `KPICard` (CRM-style) instead of `FintechMetricsQuad` |
| **[BOOKS_HOME_HUB_PAGES.md](./BOOKS_HOME_HUB_PAGES.md)** | Separate `/home/activity`, `/home/announcements`, `/home/recent-updates` hub pages (Zoho Books–style UI, frontend-only) |
| **[BOOKS_THREADS_LATEST_CONVERSATIONS_UPDATE.md](./BOOKS_THREADS_LATEST_CONVERSATIONS_UPDATE.md)** | Added Books `/threads` (“Conversations”) page aligned with CRM latest conversations UI |
| **[BOOKS_SHELL_TABS_HEADER_SIDEBAR_REFACTOR.md](./BOOKS_SHELL_TABS_HEADER_SIDEBAR_REFACTOR.md)** | Books shell refactor: floating sidebar groups, route-driven sub-page tabs, and grouped top header actions |
| **[BOOKS_THEME_TOGGLE.md](./BOOKS_THEME_TOGGLE.md)** | Books light/dark theme: CSS variables, `BooksThemeProvider`, sidebar toggle, FOUC script; dashboard + list pages use `@webfudge/ui/book-components` and `TabsWithActions` `booksModern` for matching card surfaces |
| **[BOOKS_DARK_LIST_UI_CONSISTENCY.md](./BOOKS_DARK_LIST_UI_CONSISTENCY.md)** | Books list/hub dark UI: shared `BooksListPageShell`, `booksModern` toolbar tokens, Recent Activities search, reports hub, ModulePage KPI+modal pattern |
| **[BOOKS_UI_COMPONENT_CONSOLIDATION.md](./BOOKS_UI_COMPONENT_CONSOLIDATION.md)** | Books uses shared `@webfudge/ui` Card/KPICard/Table with `theme`/`surface="books"`; `book-components` keeps domain widgets only |

---

## 🎯 Documentation by Role

### For New Developers

**Day 1 - Setup:**

1. [GETTING_STARTED.md](./GETTING_STARTED.md) - Understand the project
2. [INSTALLATION.md](./INSTALLATION.md) - Install and configure
3. [QUICKSTART.md](./QUICKSTART.md) - Start development

**Day 2 - Understanding:** 4. [README.md](./README.md) - Project structure 5. [ARCHITECTURE.md](./ARCHITECTURE.md) - System design 6. [COMMANDS.md](./COMMANDS.md) - Learn commands

**Day 3 onwards:** 7. [ENVIRONMENT.md](./ENVIRONMENT.md) - Configure environments 8. [PROJECT_CHECKLIST.md](./PROJECT_CHECKLIST.md) - Track tasks

### For Project Managers

**Essential Reading:**

1. [XTRAWRKX_USER_MANUAL.md](./XTRAWRKX_USER_MANUAL.md) - End-user feature guide for the full suite
2. [COMPLETION_REPORT.md](./COMPLETION_REPORT.md) - Current status
3. [PROJECT_CHECKLIST.md](./PROJECT_CHECKLIST.md) - Progress tracking
4. [SETUP_SUMMARY.md](./SETUP_SUMMARY.md) - Technical overview
5. [ARCHITECTURE.md](./ARCHITECTURE.md) - System design

**Optional:**

- [README.md](./README.md) - General overview

### For DevOps Engineers

**Essential Reading:**

1. [INSTALLATION.md](./INSTALLATION.md) - Deployment setup
2. [ENVIRONMENT.md](./ENVIRONMENT.md) - Configuration
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - Infrastructure
4. [COMMANDS.md](./COMMANDS.md) - Operations

**Optional:**

- [README.md](./README.md) - Project overview

### For Architects

**Essential Reading:**

1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete architecture
2. [SETUP_SUMMARY.md](./SETUP_SUMMARY.md) - Technical stack
3. [README.md](./README.md) - Project structure

**Optional:**

- [COMPLETION_REPORT.md](./COMPLETION_REPORT.md) - Implementation status

---

## 📝 Documentation by Purpose

### Installation & Setup

- [GETTING_STARTED.md](./GETTING_STARTED.md) - Quick overview
- [INSTALLATION.md](./INSTALLATION.md) - Detailed setup
- [QUICKSTART.md](./QUICKSTART.md) - Rapid setup
- [ENVIRONMENT.md](./ENVIRONMENT.md) - Configuration

### Understanding the System

- [README.md](./README.md) - Project overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [SETUP_SUMMARY.md](./SETUP_SUMMARY.md) - What's included

### Daily Development

- [COMMANDS.md](./COMMANDS.md) - Command reference
- [QUICKSTART.md](./QUICKSTART.md) - Quick tips
- [PROJECT_CHECKLIST.md](./PROJECT_CHECKLIST.md) - Task tracking

### Project Status

- [COMPLETION_REPORT.md](./COMPLETION_REPORT.md) - Current state
- [PROJECT_CHECKLIST.md](./PROJECT_CHECKLIST.md) - Progress tracking
- [SETUP_SUMMARY.md](./SETUP_SUMMARY.md) - Implementation details

---

## 🗺️ Learning Paths

### Path 1: Quick Start (1 Hour)

Perfect for: Developers who want to start coding ASAP

```
GETTING_STARTED.md (10 min)
         ↓
INSTALLATION.md (30 min - hands-on)
         ↓
QUICKSTART.md (5 min)
         ↓
Start Coding! 🚀
```

### Path 2: Deep Dive (4 Hours)

Perfect for: Lead developers and architects

```
GETTING_STARTED.md (10 min)
         ↓
README.md (10 min)
         ↓
INSTALLATION.md (30 min - hands-on)
         ↓
ARCHITECTURE.md (45 min)
         ↓
SETUP_SUMMARY.md (15 min)
         ↓
COMMANDS.md (30 min)
         ↓
ENVIRONMENT.md (30 min)
         ↓
PROJECT_CHECKLIST.md (15 min)
         ↓
Ready to Lead! 💪
```

### Path 3: Management Overview (1 Hour)

Perfect for: Project managers and stakeholders

```
README.md (10 min)
         ↓
COMPLETION_REPORT.md (15 min)
         ↓
PROJECT_CHECKLIST.md (20 min)
         ↓
ARCHITECTURE.md - Skim (15 min)
         ↓
Fully Informed! 📊
```

---

## 🔍 Find What You Need

### "How do I...?"

| Question                 | Document                                       | Section                 |
| ------------------------ | ---------------------------------------------- | ----------------------- |
| Install the project?     | [INSTALLATION.md](./INSTALLATION.md)           | Installation Steps      |
| Start development?       | [QUICKSTART.md](./QUICKSTART.md)               | Quick Start             |
| Run a specific command?  | [COMMANDS.md](./COMMANDS.md)                   | Search by task          |
| Configure environment?   | [ENVIRONMENT.md](./ENVIRONMENT.md)             | Configuration           |
| Understand architecture? | [ARCHITECTURE.md](./ARCHITECTURE.md)           | High-Level Architecture |
| Track progress?          | [PROJECT_CHECKLIST.md](./PROJECT_CHECKLIST.md) | Checklist               |
| See what's done?         | [COMPLETION_REPORT.md](./COMPLETION_REPORT.md) | Completion Metrics      |
| Use CRM, PM, or Accounts? | [XTRAWRKX_USER_MANUAL.md](./XTRAWRKX_USER_MANUAL.md) | Full user manual |
| Set up a new organization? | [XTRAWRKX_USER_MANUAL.md](./XTRAWRKX_USER_MANUAL.md) | Orbit — steps done |

### "Where is...?"

| Looking for        | Document                                       | Section           |
| ------------------ | ---------------------------------------------- | ----------------- |
| Project structure  | [README.md](./README.md)                       | Project Structure |
| App configurations | [SETUP_SUMMARY.md](./SETUP_SUMMARY.md)         | Applications      |
| Command list       | [COMMANDS.md](./COMMANDS.md)                   | All sections      |
| Environment vars   | [ENVIRONMENT.md](./ENVIRONMENT.md)             | All sections      |
| Tech stack         | [COMPLETION_REPORT.md](./COMPLETION_REPORT.md) | Technology Stack  |

### "What is...?"

| Topic               | Document                                       | Section      |
| ------------------- | ---------------------------------------------- | ------------ |
| Webfudge Platform   | [README.md](./README.md)                       | Overview     |
| System architecture | [ARCHITECTURE.md](./ARCHITECTURE.md)           | Architecture |
| Each application    | [SETUP_SUMMARY.md](./SETUP_SUMMARY.md)         | Applications |
| Current status      | [COMPLETION_REPORT.md](./COMPLETION_REPORT.md) | Summary      |

---

## 📊 Documentation Statistics

### Coverage

- **Total Documents**: 11
- **Total Words**: ~30,000+
- **Code Examples**: 250+
- **Diagrams**: 15+
- **Commands Listed**: 150+

### Completeness

- ✅ Installation: 100%
- ✅ Configuration: 100%
- ✅ Architecture: 100%
- ✅ Commands: 100%
- ✅ Environment: 100%
- ✅ Tracking: 100%

---

## 🎨 Document Formats

### Markdown Files

All documentation is in Markdown format for:

- ✅ Easy reading in GitHub/GitLab
- ✅ Version control friendly
- ✅ Easy to edit
- ✅ Universal compatibility

### Code Examples

All code examples are:

- ✅ Syntax highlighted
- ✅ Copy-paste ready
- ✅ Platform specific (where needed)
- ✅ Tested and working

---

## 🔄 Keeping Documentation Updated

### When to Update

- Adding new features
- Changing configurations
- Adding new apps/packages
- Updating dependencies
- Deployment changes

### Which Documents to Update

| Change          | Update These                        |
| --------------- | ----------------------------------- |
| New app/package | README, SETUP_SUMMARY, ARCHITECTURE |
| New command     | COMMANDS                            |
| New env var     | ENVIRONMENT                         |
| Completed task  | PROJECT_CHECKLIST                   |
| Major milestone | COMPLETION_REPORT                   |

---

## 💡 Tips for Using Documentation

### 1. Use Search

- In GitHub: Press `/` to search
- Locally: Use your IDE's search (Ctrl+F / Cmd+F)

### 2. Follow Links

- All documents are interconnected
- Links lead to relevant sections
- Use them to navigate quickly

### 3. Bookmark Favorites

- Bookmark documents you use frequently
- Create shortcuts in your IDE
- Pin important docs

### 4. Print/Export (Optional)

- Convert to PDF for offline reading
- Use `pandoc` or similar tools
- Great for reference during development

---

## 🆘 Can't Find What You Need?

1. **Search all docs**: Use global search in your IDE
2. **Check index**: You're here! Look for your topic
3. **Read GETTING_STARTED**: Often answers common questions
4. **Ask the team**: Don't struggle alone
5. **Update docs**: If something is missing, add it!

---

## 📞 Documentation Feedback

Found an issue? Have a suggestion?

- ✏️ Submit a PR to update docs
- 💬 Discuss with the team
- 📝 Open an issue
- 🎯 Help improve the docs!

---

## 🎉 Documentation Quality

This documentation is:

- ✅ Comprehensive
- ✅ Well-organized
- ✅ Easy to navigate
- ✅ Beginner-friendly
- ✅ Reference-ready
- ✅ Up-to-date
- ✅ Maintained

---

## 📚 Additional Resources

### External Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Strapi Docs](https://docs.strapi.io)
- [Turborepo Docs](https://turbo.build/repo/docs)

### Tools

- **verify-setup.js**: Run `npm run verify` to check setup
- **VS Code**: Markdown preview (Ctrl+Shift+V)
- **GitHub**: Automatic rendering

---

## ✅ Quick Checklist

Before you start developing:

- [ ] Read GETTING_STARTED.md
- [ ] Complete INSTALLATION.md
- [ ] Bookmark COMMANDS.md
- [ ] Understand ARCHITECTURE.md
- [ ] Configure ENVIRONMENT.md
- [ ] Review PROJECT_CHECKLIST.md

---

**Happy Learning!** 📚✨

---

_Last Updated: May 27, 2026_

---

## 🆕 Recent Updates

| Document | Description | Date |
|----------|-------------|------|
| **[XTRAWRKX_USER_MANUAL.md](./XTRAWRKX_USER_MANUAL.md)** | Complete end-user manual: login passes, Landing Firebase CMS, all suite apps (Orbit steps done; Books excluded) | Jun 2026 |
| **[LANDING_PREMIUM_REDESIGN.md](./LANDING_PREMIUM_REDESIGN.md)** | Complete premium redesign of the landing page — new design system, animations, all sections | May 2026 |
| **[LANDING_CONTENT_UPDATE_2026.md](./LANDING_CONTENT_UPDATE_2026.md)** | Full content refresh — brand repositioning, 5 core services, updated copy across all sections | May 2026 |
| **[LANDING_INDUSTRIES_UPDATE.md](./LANDING_INDUSTRIES_UPDATE.md)** | New Industries section (8 industries), expanded Why Choose Us to 6 cards, fixed Navbar dead links | May 2026 |
