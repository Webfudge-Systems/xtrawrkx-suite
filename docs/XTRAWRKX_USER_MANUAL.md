# Xtrawrkx Suite — Complete User Manual

**Version:** June 2026  
**Audience:** End users, team leads, org admins, and platform operators  
**Built by:** [Webfudge Systems](https://webfudgesystems.in)

---

## Table of contents

1. [Introduction](#1-introduction)
2. [Login credentials, URLs & access](#2-login-credentials-urls--access)
3. [Getting started](#3-getting-started)
4. [Orbit — Platform admin (steps done)](#4-orbit--platform-admin-steps-done)
5. [Fudge Base — Organization administration](#5-fudge-base--organization-administration)
6. [Fudge People — Sales CRM](#6-fudge-people--sales-crm)
7. [Fudge Work — Project management](#7-fudge-work--project-management)
8. [Xtrawrkx Landing — Public website & CMS](#8-xtrawrkx-landing--public-website--cms)
9. [Client Portal](#9-client-portal)
10. [Cross-app workflows](#10-cross-app-workflows)
11. [Roles, permissions & access](#11-roles-permissions--access)
12. [Notifications, search & collaboration](#12-notifications-search--collaboration)
13. [Troubleshooting & FAQ](#13-troubleshooting--faq)

---

## 1. Introduction

### What is Xtrawrkx?

Xtrawrkx is a connected business platform by **Webfudge Systems**. Instead of juggling separate tools for sales, delivery, and administration, your team works in a single suite that shares one login, one organization, and one data layer.

### Apps in the suite

| App | Product name | Who uses it | Typical URL |
| --- | --- | --- | --- |
| **Orbit** | Orbit (by Webfudge Systems) | Platform operators only | `orbit.10x1.webfudge.in` |
| **Fudge Base** | Fudge Base | Org admins, HR, IT | `accounts.xtrawrkx.com` |
| **Fudge People** | Fudge People | Sales, account managers | `crm.xtrawrkx.com` |
| **Fudge Work** | Fudge Work | Project managers, delivery teams | `pm.xtrawrkx.com` |
| **Landing** | xtrawrkx.com | Public visitors, community members | `xtrawrkx.com` |
| **Client Portal** | Xtrawrkx Client Portal | Your clients and their teams | `portal.xtrawrkx.com` |

> **Note:** Fudge Books (finance/accounting) is part of the suite but is **not covered** in this manual.

### How the apps connect

```
Orbit (platform admin)
    └── Creates organizations + owner accounts
            │
            ├── Fudge Base  → users, roles, security, billing
            ├── Fudge People → leads, deals, clients, proposals
            ├── Fudge Work   → projects, tasks, delivery
            └── Client Portal → client-facing projects & communities

Landing (public) → signup, events, communities → hands off to Client Portal
```

---

## 2. Login credentials, URLs & access

> **Security note:** Default passwords below are for **local development** and initial seeding. Change all production credentials via environment variables or admin tools before go-live. Never share production passwords in public channels.

### 2.1 Production app URLs

| App | URL | Login path |
| --- | --- | --- |
| **API (Strapi)** | `https://xtrawrkxsuits-production.up.railway.app` | `/admin` (Strapi super-admin panel) |
| **Orbit** | `https://orbit.10x1.webfudge.in` | `/login` |
| **Fudge Base** | `https://accounts.xtrawrkx.com` | `/login` |
| **Fudge People** | `https://crm.xtrawrkx.com` | `/login` |
| **Fudge Work** | `https://pm.xtrawrkx.com` | `/login` |
| **Landing** | `https://xtrawrkx.com` | `/auth` (public) · `/admin/login` (CMS) |
| **Client Portal** | `https://portal.xtrawrkx.com` | `/auth` |

**Local development ports:** Landing `3000` · CRM `3001` · Client Portal `3002` · Accounts `3003` · Orbit `3004` · PM `3005` · Strapi `1337`

### 2.2 Login credentials quick reference

| System | Who | Email | Default password | Auth backend |
| --- | --- | --- | --- | --- |
| **Orbit** | Platform super-admin | `admin@xtrawrkx.com` | `XtrawrkxAdmin@2025` | Strapi `platform-login` |
| **Landing CMS** | Content admin | `admin@xtrawrkx.com` | `password1234` | Firebase Auth |
| **Landing CMS** | Content admin (alt) | `xtrawrkxadmin@xmc.com` | *(set in Firebase)* | Firebase Auth |
| **Fudge People / Work / Base** | Org owner (new org) | Set when creating org in Orbit | Set in Orbit create form | Strapi org login |
| **Fudge People / Work / Base** | Team members (XMC bulk) | User’s work email | `Xtr@<FirstName>#XWK` | Strapi org login |
| **Landing public** | Website member | Self-registered at `/auth` | Chosen at signup | Strapi `internal/login` |
| **Client Portal** | Client contact | CRM contact email | Set via website signup or CRM | Strapi `client/login` |
| **Strapi admin panel** | API super-admin | Created on first visit to `/admin` | Set during first-time setup | Strapi admin JWT |

**Excluded from bulk password script:** `admin@xmc.com` and `admin@xtrawrkx.com` keep their own credentials.

**XMC bulk password examples:**

| User first name | Generated password |
| --- | --- |
| John | `Xtr@John#XWK` |
| Priya | `Xtr@Priya#XWK` |
| (no name, email `alex.smith@co.com`) | `Xtr@Alex#XWK` |

### 2.3 Orbit (platform admin) login

| Field | Value |
| --- | --- |
| URL | `https://orbit.10x1.webfudge.in/login` (local: `http://localhost:3004/login`) |
| Email | `admin@xtrawrkx.com` |
| Password | `XtrawrkxAdmin@2025` (local seed default) |

Production password is set via `PLATFORM_ADMIN_PASSWORD` in `apps/backend/.env`.

**Reset without wiping the database:**

```bash
# In apps/backend/.env set:
PLATFORM_ADMIN_RESET_PASSWORD=true

# Then run:
node apps/backend/scripts/sync-platform-admin.js --reset-password
```

Set `PLATFORM_ADMIN_RESET_PASSWORD=false` after a successful login.

**Full local reset** (wipes SQLite, re-seeds admin):

```bash
npm run reset:db
```

Then clear browser storage (`auth-token`, `auth-user`, `current-org-id`) or use a private window.

### 2.4 Workspace apps login (CRM, PM, Accounts)

All three workspace apps share the **same Strapi user account** per organization.

1. Open the app URL → `/login`
2. Enter your **org email** and **password**
3. You land on the app dashboard

| App | Production URL |
| --- | --- |
| Fudge People (CRM) | `https://crm.xtrawrkx.com/login` |
| Fudge Work (PM) | `https://pm.xtrawrkx.com/login` |
| Fudge Base (Accounts) | `https://accounts.xtrawrkx.com/login` |

**First login after Orbit creates your org:** Use the **owner email and password** you entered on the Orbit “Create organization” form.

**Invited users:** Use the password from the invite email, or the password your admin set in Fudge Base → Users.

### 2.5 Landing CMS admin login (Firebase)

The landing **content admin panel** (`/admin/*`) uses **Firebase Authentication**, separate from workspace Strapi login.

| Field | Value |
| --- | --- |
| URL | `https://xtrawrkx.com/admin/login` |
| Allowed admin emails | `admin@xtrawrkx.com`, `xtrawrkxadmin@xmc.com` (configurable via `NEXT_PUBLIC_ADMIN_EMAILS`) |
| Default seeded password | `password1234` |

**Seed or reset the Firebase CMS admin:**

```bash
npm run seed:firebase-admin -w @xtrawrkx/landing
```

Optional env overrides in `apps/landing/.env.local`:

```env
FIREBASE_ADMIN_EMAIL=admin@xtrawrkx.com
FIREBASE_ADMIN_PASSWORD=password1234
```

If the user already exists with a wrong password, provide a Firebase service account:

```bash
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccount.json npm run seed:firebase-admin -w @xtrawrkx/landing
```

### 2.6 Landing public member login (Strapi)

Website visitors sign up or sign in at **`/auth`**. This uses the Strapi backend (`/api/auth/internal/login` via the landing API route), **not** Firebase.

- **Sign up:** Choose your own email and password (minimum 6 characters) during the 4-step registration.
- **Sign in:** Same credentials → redirects to `/profile`.
- Signing up can also create a CRM client account and Client Portal access (see [§10.2](#102-website-signup--crm-client)).

### 2.7 Client Portal login

| Field | Details |
| --- | --- |
| URL | `https://portal.xtrawrkx.com/auth` |
| Email | Must match a CRM **contact** with active **client-portal-access** |
| Password | Set during website signup sync or provisioned by your account manager |

**No self-service signup** on the portal — contact your administrator if you need access.

**Website handoff:** From landing `/profile` → **Open company portal** pre-fills your email.

**Invite link:** `?from=invite&email=...&password=...` for first-time login.

### 2.8 Strapi backend admin panel

For API-level content type management (not the landing Firebase CMS):

1. Visit `https://xtrawrkxsuits-production.up.railway.app/admin` (local: `http://localhost:1337/admin`)
2. On first visit, create the Strapi super-admin account
3. Use this panel for raw content types, plugins, and API configuration

This is separate from Orbit, workspace apps, and the landing CMS admin.

---

## 3. Getting started

### 3.1 Sign in

See [Section 2 — Login credentials](#2-login-credentials-urls--access) for URLs and default passwords.

**Orbit** uses platform admin login only. Regular org users should use CRM, PM, or Accounts.

### 3.2 Organization context

Xtrawrkx is **multi-tenant**: every record belongs to an organization. When you work in CRM, PM, or Accounts, the app sends your active organization to the backend automatically.

- Your active org is stored as `current-org-id` in the browser.
- Orbit sets this when you click **Open Accounts** or **Open PM** for a company.
- If you belong to multiple orgs, use the org switcher in the app header (when available).

### 3.3 App launcher

From **Fudge Base → App Access**, you can see which apps your role can open. Users with CRM or PM read access see those apps in the workspace launcher.

### 3.4 Install as an app (PWA)

**Fudge People** and **Fudge Work** support installable Progressive Web Apps:

1. Open the app in Chrome or Edge.
2. Use the browser’s **Install app** prompt (or the in-app install banner).
3. The app icon appears on your desktop or home screen.
4. If offline, you see an offline page — live data requires an internet connection.

---

## 4. Orbit — Platform admin (steps done)

**Orbit** is the Webfudge Systems hub for creating and managing tenant organizations. It is **not** for day-to-day CRM or PM work — that happens inside each company’s workspace apps.

**Status:** All core Orbit flows below are **implemented and working**.

### 4.1 Who can access Orbit

| Requirement | Details |
| --- | --- |
| Account flag | `isPlatformAdmin: true` on your user record |
| Login endpoint | Platform login (`/api/auth/platform-login`) — not standard org login |
| Non-admins | Redirected to `/unauthorized` with a link back to sign in |

### 4.2 Orbit step-by-step workflow

#### Step 1 — Sign in to Orbit ✅

1. Go to your Orbit URL (e.g. `orbit.10x1.webfudge.in/login`).
2. Enter platform admin credentials — see [§2.3](#23-orbit-platform-admin-login) (`admin@xtrawrkx.com` / `XtrawrkxAdmin@2025` locally).
3. On success → you are redirected to **Organizations** (`/organizations`).
4. If you are already signed in as a platform admin, visiting `/` or `/login` sends you straight to `/organizations`.

**Unauthorized access:** If you sign in with a normal org account, you are sent to `/unauthorized` with guidance to use CRM, PM, or Accounts with your organization credentials.

#### Step 2 — Review the organization dashboard ✅

On `/organizations` you see:

| Element | What it shows |
| --- | --- |
| **KPI cards** | Total, Active, Trial, Suspended organization counts |
| **Tabs** | Filter list: All · Active · Trial · Suspended |
| **Search** | Find organizations by name or email |
| **Table** | Organization name, status, user count, owner, actions |
| **New organization** | Button → `/organizations/new` |

**Organization statuses:** `trial` · `active` · `suspended` · `cancelled`

#### Step 3 — Create a new organization ✅

1. Click **New organization** (or go to `/organizations/new`).
2. Fill in the form:

   **Company**
   - **Organization name** (required) — e.g. “Acme Operations”
   - Slug is generated automatically from the name.

   **Primary owner**
   - **Owner email** (required)
   - **Owner password** (required for new accounts; minimum 8 characters)
   - **First name / Last name** (optional)

3. Click **Create organization**.
4. On success → you are redirected to the new org’s detail page (`/organizations/[id]`).

**What happens behind the scenes:**
- A new tenant organization is created in the backend.
- If the owner email is new, an account is created and linked as **Admin**.
- If the email already exists, that user is linked as the org owner.
- Default org roles (Admin, Manager, Member) are provisioned.

#### Step 4 — Manage organization detail ✅

On `/organizations/[id]`:

| Area | Actions |
| --- | --- |
| **Header** | **Open Accounts** · **Open PM** (sets org context, opens app in new tab) |
| **KPI cards** | Status, member count, trial end date, created date |
| **Overview tab** | Profile: owner, slug, email, trial end, created; **status dropdown** |
| **Members tab** | All workspace users and their roles |
| **Activities tab** | Timeline of org-level events |

**Update status:**
1. Choose Trial, Active, Suspended, or Cancelled from the dropdown.
2. Click **Update status**.
3. Change is saved immediately.

#### Step 5 — Open workspace apps for a company ✅

From the org **list** or **detail** page:

1. Click **Open Accounts** or **Open PM**.
2. Orbit writes `current-org-id` to browser storage.
3. The target app opens in a **new tab** with that organization active.
4. The owner (or any user you invited in Fudge Base) can now sign in and work.

> CRM is configured in environment variables but is not exposed as an “Open CRM” button in Orbit UI today. Users reach CRM via the app launcher or direct URL after org setup.

#### Step 6 — Row actions from the organization list ✅

From each row (desktop) or card (mobile):

| Action | Result |
| --- | --- |
| **View / Edit** | Opens organization detail |
| **Open Accounts** | Launches Fudge Base for that org |
| **Open PM** | Launches Fudge Work for that org |
| **Delete** | Confirmation dialog → permanently removes organization (irreversible) |

#### Step 7 — Sign out ✅

Use **Sign out** in the Orbit sidebar → session cleared → return to `/login`.

### 4.3 Orbit sidebar navigation

| Item | Destination |
| --- | --- |
| Organizations | `/organizations` |
| Create organization | `/organizations/new` |
| Sign out | Clears session → `/login` |

### 4.4 Orbit quick reference

| Task | Path |
| --- | --- |
| Sign in | `/login` |
| List organizations | `/organizations` |
| Create organization | `/organizations/new` |
| View / edit organization | `/organizations/[id]` |
| Access denied | `/unauthorized` |

---

## 5. Fudge Base — Organization administration

**Fudge Base** (`accounts.xtrawrkx.com`) is where org admins manage people, permissions, structure, security, and billing.

### 5.1 Navigation

| Sidebar item | Route | Purpose |
| --- | --- | --- |
| Dashboard | `/` | Org overview and quick actions |
| Users | `/users` | Invite and manage team members |
| Roles & Permissions | `/roles` | CRM and PM access matrix |
| Departments | `/departments` | Department hierarchy |
| Teams | `/teams` | Team groupings |
| Security | `/security` | MFA, sessions, password rules *(org admins only)* |
| Audit Logs | `/audit-logs` | Cross-app activity history |
| Organization | `/settings` | Company profile |
| App Access | `/app-access` | Which apps each role can open |

**Billing** (`/billing`) is reachable from the dashboard Quick Actions and App Access — not in the main sidebar.

### 5.2 Dashboard (`/`)

- **KPI cards:** Active users, roles, departments, teams
- **Security health:** MFA adoption, pending invites, open incidents
- **Quick actions:** Add user · Manage roles · Review audit logs · Update billing
- **Recent workspace activity:** Last 6 audit entries
- **App access summary:** CRM/PM enabled status per subscription

### 5.3 Users (`/users`)

**Tabs:** All Users · Active · Invited · Suspended

**Invite a user:**
1. Click **Invite User**.
2. Enter email.
3. Choose **email invite** (default) or **direct add** with password.
4. Assign a **role** and **departments** (optional primary department).
5. Send — user appears as **Invited** until they accept.

**Edit a user:** Name, email, role, status (active/suspended), departments.

**Row actions:** Edit · Suspend / Activate

### 5.4 Roles & Permissions (`/roles`)

**Tabs:** All roles · System templates · Custom

Each role defines access per module at one of four levels:

| Level | Meaning |
| --- | --- |
| **None** | Module hidden |
| **Read** | View only |
| **Write** | Create and edit own records |
| **Manage** | Full access including others’ records |

**CRM modules (13):** dashboard, leads, contacts, deals, client accounts, client projects, invoices, proposals, meetings, calendar, analytics, settings

**PM modules (8):** dashboard, projects, tasks, my tasks, inbox, calendar, analytics, settings

**Presets:** Admin-like · Manager-like · Member-like — use as starting points for custom roles.

### 5.5 Departments & Teams

**Departments** (`/departments`):
- Create name, description, department lead, parent department (hierarchy), active/inactive status.
- Tabs: All · Active · Inactive

**Teams** (`/teams`):
- Create name, description, leader, parent department, multi-select members.
- Delete teams when no longer needed.

### 5.6 Security (`/security`) — org admins only

| Setting | Options |
| --- | --- |
| Require MFA | On / Off |
| Allow password login | On / Off |
| Minimum password length | Configurable |
| Session timeout | 1 hour – 7 days |
| Email domain restrictions | Comma-separated allowed domains |

Non-admins who open this page are redirected to `/unauthorized`.

### 5.7 Audit Logs (`/audit-logs`)

- **Views:** Table or Timeline (preference saved in browser)
- **Filters:** Module (accounts/crm/pm), severity, action type, entity type, actor, date range, search
- **Entity drawer:** Full record timeline; optional “Open in CRM” link
- Covers user invites, membership changes, and activity across all suite apps

### 5.8 Organization settings (`/settings`)

Edit: organization name (required), company email, phone, website, industry, company size.

Users without edit permission see a read-only view.

### 5.9 Billing (`/billing`)

- Subscription status per app (CRM, PM)
- Seat utilization and monthly spend (INR)
- Payment gateway integration is planned (placeholder UI today)

### 5.10 Typical admin workflows

| Goal | Steps |
| --- | --- |
| Onboard a hire | Dashboard → Add User → assign role & departments → send invite |
| Limit CRM access | Roles → edit role → set module levels → verify in App Access |
| Investigate an incident | Audit Logs → filter by date/actor → open entity drawer |
| Harden security | Security → enable MFA, set timeout, restrict email domains → Save |
| Update company profile | Organization → edit fields → Save |

---

## 6. Fudge People — Sales CRM

**Fudge People** (`crm.xtrawrkx.com`) is the sales workspace for leads, pipeline, clients, proposals, invoices, meetings, and automations.

### 6.1 Navigation overview

**Primary sidebar sections:**

| Section | Items |
| --- | --- |
| **Dashboard** | `/` — Personal, Sales, or Manager view |
| **Sales** | Lead Companies · Contacts · Deals · Pipeline Board |
| **Workspace** | Threads · Activity log · Proposals · Tasks · Meetings · Calendar · Documents *(coming soon)* |
| **Clients** | Client Accounts · Invoices · Projects |
| **System** | Analytics *(if permitted)* |
| **Automation** | `/automations` — workflow builder |

**Quick Actions FAB** (bottom-right, when you have write access):
- New Task · New Meeting · New Lead · New Proposal

**Global search** (header): Search leads, deals, contacts, and client accounts.

### 6.2 Dashboard (`/`)

Three views (availability depends on your org role):

| View | Who sees it | Highlights |
| --- | --- | --- |
| **Personal** | Everyone | My tasks, assigned leads, meetings today, overdue items |
| **Sales** | Org admins | Pipeline value, conversion rate, lead sources, proposals/invoices widgets |
| **Manager** | Admins + managers | Team performance, task distribution, team activity, assignment breakdown |

### 6.3 Lead Companies (`/sales/lead-companies`)

**Lead lifecycle statuses:** New → Contacted → Qualified → Lost → **Converted**

**List page features:**
- KPI cards by status
- Sortable, filterable, paginated table (30+ optional columns)
- Inline status changes
- Column visibility, reorder, and resize (saved locally)
- Advanced filter modal

**Row actions:** View · Edit · Email · Delete · **Convert to Client** · Add comment · Schedule meeting · Create deal

**Create lead** (`/sales/lead-companies/new`):
- Company profile: name, industry, website, address, employees, source, status, deal value, next connect date, assignee, notes
- Add one or more contacts in the same form

**Lead detail** (`/sales/lead-companies/[id]`):

| Tab | Content |
| --- | --- |
| Overview | Company info, KPIs, assignee, next connect date |
| Contacts | Linked contacts; add contact modal |
| Activities | Timeline + comments with @mentions |
| Deals | Related deals |
| Proposals | Related proposals |
| Meetings | Scheduled meetings |

**Convert to client:**
1. Open lead detail or use row action on the list.
2. Click **Convert to Client Account**.
3. Confirm in the modal.
4. Status becomes **CONVERTED**; a linked client account is created at `/clients/accounts/[id]`.

### 6.4 Contacts (`/sales/contacts`)

**List:** KPI stats, searchable table, filters.

**Create** (`/sales/contacts/new`): Personal info, company association (lead **or** client — mutually exclusive), role, assignee, source.

**Contact roles:** Primary · Technical · Decision Maker · Influencer · Gatekeeper · Other

**Detail tabs:** Overview · Activities · Details

### 6.5 Deals (`/sales/deals`)

**Pipeline stages:** Discovery → Prospect → Proposal → Negotiation → **Won** → Lost

**List page:**
- Toggle **Table** or **Kanban** view
- Inline stage and probability editing
- KPI cards and status tabs

**Pipeline board** (`/sales/deals/pipeline`):
- Full-screen kanban
- Drag deals between stages

**Create deal** (`/sales/deals/new`):
- Name, value, stage, probability, close date, priority, assignee
- Link to lead company and/or client account + primary contact

**Won deal → delivery project:**
1. Mark deal as **Won**.
2. Confirm **Create delivery project** in the prompt.
3. A project is created at `/clients/projects` (full PM management opens in Fudge Work).

**Detail tabs:** Overview · Contacts · Meetings · Products · Documents · Activities

### 6.6 Client Accounts (`/clients/accounts`)

**List:** KPI cards, status tabs, advanced filters, 30+ configurable columns.

**Detail tabs:** Overview · Contacts · Activities · Deals · Projects · Invoices · Meetings

**Create / edit:** Company details, billing, contracts, assignee, industry, status.

### 6.7 Proposals (`/clients/proposals`)

**Statuses:** Draft → Sent → Accepted / Rejected / Expired

**Proposal builder** (`/clients/proposals/new`):
- Select client (lead or client account)
- Line items, pricing (INR), scope, deliverables, terms, validity
- **Preview** and **PDF download**

**Detail:** Document preview, status workflow, client and billing sidebar.

### 6.8 Invoices (`/clients/invoices`)

**Statuses:** Draft · Sent · Paid · Overdue · Partial · Cancelled

**Invoice builder** (`/clients/invoices/new`):
- Org-prefilled “from” section
- Bill-to client and contact dropdown
- Line items, tax, discount, notes & terms
- Preview and PDF download

### 6.9 Tasks (`/clients/tasks`)

**Statuses:** Scheduled · In Progress · Internal Review · On Hold · Overdue · Completed · Cancelled

- Create tasks linked to leads, clients, deals, or projects
- Inline status changes from the table
- Appear on Personal dashboard and workspace calendar

### 6.10 Projects (`/clients/projects`)

- List of delivery projects with status, manager, client, dates, budget, task counts
- **Project board** (`/clients/projects/board`) — kanban view
- Full project management lives in **Fudge Work** (cross-link from detail)

### 6.11 Meetings (`/meetings`)

**Meeting types:** Discovery · Demo · Follow-up · Check-in · Review · Internal · Other

**List / calendar hub:**
- Tabs: All · Upcoming · Today · Past · Cancelled · Analytics
- Toggle **List** or **Calendar** (FullCalendar)
- Export meetings

**Create** (`/meetings/new`):
- Title, type, date/time, location or video link
- Host and multi-attendee picker (required/optional/host roles)
- Link to lead, deal, client, or contact

### 6.12 Calendar (`/calendar`)

Unified view of **meetings**, **tasks**, and **projects**.

- Filters: All · Meetings · Tasks · Projects
- Drag to reschedule meetings
- Click an event to open its detail page

### 6.13 Threads (`/threads`)

- All comment threads across leads, deals, contacts, and client accounts in one place
- Search threads, post replies, @mention teammates, emoji reactions
- Jump to source entity from any thread

### 6.14 Activity log (`/activities`)

- Paginated organization-wide audit trail
- Covers contacts, lead companies, deals, and comments
- Click through to entity detail where supported

### 6.15 Automations (`/automations`)

**Workflow builder** (`/automations/new`, `/automations/[id]`):

| Triggers (examples) | Actions (examples) |
| --- | --- |
| Lead Created | Send Email |
| Deal Updated | Create Task |
| Meeting Completed | Update Deal |
| Contact Added | Assign User |
| Invoice Overdue | Add Note / Comment |

- Visual drag-and-drop canvas
- Condition nodes for branching
- Test run → Publish → Pause / Resume from list

### 6.16 Key CRM workflows

#### Lead → Client → Deal → Delivery

```
New Lead → Qualify → Create Deal → Send Proposal
    → Win Deal → Create Delivery Project (PM)
    → Convert to Client Account (if not already)
    → Create Invoice
```

#### Daily sales routine

1. Open **Personal** dashboard — review overdue tasks and today’s meetings.
2. Check **Lead Companies** — filter by “next connect today”.
3. Log calls and comments on lead/contact detail pages.
4. Move deals on the **Pipeline board**.
5. Review **Threads** for team mentions.

### 6.17 Coming soon in CRM

| Feature | Location |
| --- | --- |
| Documents | Workspace sidebar |
| Log Call | Quick Actions FAB |
| Send WhatsApp | Quick Actions FAB |
| Reports & Forecasts | Analytics |
| CRM Settings (users, branding) | `/settings` placeholder |

---

## 7. Fudge Work — Project management

**Fudge Work** (`pm.xtrawrkx.com`) is the delivery workspace for projects, tasks, team collaboration, and client accounts.

### 7.1 Navigation overview

**Navigate section:**

| Item | Route | Notes |
| --- | --- | --- |
| Dashboard | `/` | KPIs, widgets, global search |
| My Tasks | `/my-tasks` | Personal task hub |
| Inbox | `/inbox` | Activity, notifications, threads |
| Message | `/message` | Direct messages |
| Clients | `/clients/accounts` | CRM client accounts in PM |
| Reports | Coming soon | Sidebar placeholder |

**Projects section (dynamic):**
- Up to 4–6 recent projects with progress
- **+** button → new project (Admin/Manager only)
- **All projects** → `/projects`

**Tools:**
- Calendar → `/calendar`
- Documents → coming soon

**Quick Actions FAB:** New Task · New Project · New Client

### 7.2 Dashboard (`/`)

- KPI cards: To Do · In Progress · Done · Overdue
- **My Tasks** widget
- **Upcoming Deadlines** calendar strip
- **Task Overview** status chart
- **Team Workload** distribution
- **Projects Overview** snapshot
- Global search (projects + tasks)

### 7.3 My Tasks (`/my-tasks`)

**Status tabs:** My Tasks · In Progress · Overdue · All Tasks

**View modes** (saved in browser):

| Mode | Best for |
| --- | --- |
| **List** | Quick scanning by status group |
| **Table** | Sortable columns, inline edits, subtasks |
| **Kanban** | Drag tasks between status columns |
| **Timeline** | Gantt-style date planning |

**Task actions:** View · Edit · Duplicate · Comment · Delete (role-dependent)

**Quick create:** FAB or `?createTask=1` URL parameter opens create modal.

### 7.4 Projects (`/projects`)

**Status tabs:** All · Active · Planning · In Progress · On Hold · Completed

**Views:** Table · Kanban board (drag between status columns)

**Columns:** Status, progress %, owner, dates, task counts, team, client, budget — all toggleable.

**Create project** (`/projects/add`):
- Name, description, status, dates, budget
- Client account, project manager, team members
- Privacy flag (admin only)
- Pre-fill client via `?clientAccount=` query param

### 7.5 Project detail (`/projects/[slug]`)

| Tab | Content |
| --- | --- |
| Overview | Status, dates, budget, client, PM, team, KPIs, description |
| Tasks | Full task list for this project |
| Activity | Timeline + comments with @mentions |
| Files | Placeholder (limited today) |

### 7.6 Task detail (`/tasks/[id]`)

| Tab | Content |
| --- | --- |
| Overview | Status, priority, assignees, dates, description, recurrence |
| Subtasks | Child tasks; quick-create subtask |
| Comments | Threaded discussion |
| Activity | Full audit timeline |
| Files | Placeholder |

**Assignment approval:** When a Member creates a task and assigns someone, Admins/Managers must approve the assignment before it takes effect.

### 7.7 Inbox (`/inbox`)

| Tab | Content |
| --- | --- |
| All activity | Org-wide PM activity feed with deep links |
| Notifications & alerts | Unread/read/archived; mark all read |
| Threads | Project and task comment threads |

Notification types include mentions, task comments, project comments, and direct messages.

### 7.8 Messages (`/message`)

- 1:1 chat with org members
- Contact list (excluding yourself)
- @mention support in composer
- Deep link: `/message?with={userId}`
- Unread badge on sidebar

### 7.9 Clients in PM (`/clients/accounts`)

Same client account data as CRM, governed by CRM `client_accounts` permissions.

**Detail tabs:** Overview · Contacts · Activities · Deals · Projects · Invoices · Meetings

Cross-links open CRM records where configured; PM projects are managed here.

### 7.10 Calendar (`/calendar`)

- Meetings (from CRM) + tasks + project milestones
- Filters: All · Meetings · Tasks · Projects
- Today summary sidebar

### 7.11 PM role restrictions

| Org role | Create projects | Edit projects | Create tasks | Edit tasks |
| --- | --- | --- | --- | --- |
| **Admin** | Yes | All | Yes | Broad |
| **Manager** | Yes | Own PM projects | Yes | Own/team tasks |
| **Member** | No | No | If on project team | Own assigned only |

Members can only change **status** on tasks assigned to them (not full field edits).

### 7.12 Key PM workflows

#### Run a delivery project

1. Create project (or receive one from a **Won deal** in CRM).
2. Add team members and set dates/budget.
3. Create tasks in the **Tasks** tab — assign, set due dates, add subtasks.
4. Track on **My Tasks** (Kanban or Timeline).
5. Collaborate via comments → notifications land in **Inbox**.

#### Weekly planning

1. Open **Calendar** → filter Tasks.
2. Review **Upcoming Deadlines** on Dashboard.
3. Switch My Tasks to **Timeline** view for the week ahead.
4. Post blockers in task comments → teammates get Inbox notifications.

---

## 8. Xtrawrkx Landing — Public website & CMS

**xtrawrkx.com** is the public marketing site for prospects, community members, and event attendees. It has **two separate login systems**:

| Area | URL | Auth | Purpose |
| --- | --- | --- | --- |
| **Public member area** | `/auth`, `/profile` | Strapi (`internal/login`) | Sign up, profile, portal handoff |
| **CMS admin panel** | `/admin/login`, `/admin/*` | Firebase Auth | Manage events, resources, team, gallery |

See [§2.5–2.6](#25-landing-cms-admin-login-firebase) for CMS admin credentials.

### 8.1 Public pages

| Page | URL | Purpose |
| --- | --- | --- |
| Home | `/` | Hero, services, events, communities, CTA |
| About | `/about` | Company story |
| Team | `/teams` | Leadership and team directory |
| Services | `/services` | Service catalog |
| Service detail | `/services/[slug]` | Individual service |
| Communities | `/communities` | Community hub |
| Community detail | `/communities/[slug]` | XEV-FIN, XEN, XEVTG, XD-D, etc. |
| Events | `/events` | Upcoming and past events |
| Event detail | `/events/[slug]` | Event info and registration CTA |
| Event registration | `/events/[slug]/register` | Sign up for an event (auth may be required) |
| Event gallery | `/events/[slug]/gallery` | Event photos |
| Season registration | `/events/season/[season]/register` | Season-based event signup |
| Resources | `/resources` | Articles, whitepapers, reports |
| Resource detail | `/resources/[slug]` | Individual resource article |
| Gallery | `/gallery` | Photo/media gallery |
| Contact | `/contact-us` | Contact form and newsletter |
| Engagement models | `/modals` | How we work with clients |
| Auth | `/auth` | Sign in or multi-step signup |
| Profile | `/profile` | Member profile (protected) |
| Sitemap | `/sitemap` | HTML sitemap |
| Privacy / Terms | `/privacy-policy` · `/terms-of-service` | Legal |

### 8.2 Sign up and sign in (`/auth`)

**Sign up (4 steps):**
1. **Personal** — name, email, password
2. **Company** — company name, type, industry
3. **Address** — location fields
4. **Social** — LinkedIn, bio (skippable)

**Sign in:** Email + password (Strapi) → redirects to `/profile`.

After signup, the backend may automatically:
- Create a **CRM client account** in the Xtrawrkx org (website signup API)
- Provision **Client Portal** access with your chosen password
- Start an onboarding project

### 8.3 Profile & client portal handoff (`/profile`)

- Edit sections: Personal · Company · Address · Social
- **Open company portal** — launches Client Portal with email pre-filled
- **ProfileCommunityCard** — join communities, complete setup, open portal with intent (`complete-setup`, `communities`, `join`)
- Navbar (when logged in): View profile · Open company portal · Log out

### 8.4 Event registration workflow

1. Browse `/events` → select an event.
2. Click **Register** → `/events/[slug]/register`.
3. Sign in at `/auth` if prompted.
4. Complete form: company, designation, company type, personal details.
5. Payment confirmation and success email (when payment flow is enabled).
6. View ticket / registration in profile or Client Portal → Events.

### 8.5 Contact form & inquiries

**Contact us** (`/contact-us`):
- Submits via Gmail SMTP API route
- Delivered to `webfudgesystems@gmail.com` (configurable)
- Requires `EMAIL_USER` and `EMAIL_PASS` in landing env

**CMS admin view:** `/admin/contact-inquiries` — review and manage submissions.

### 8.6 CMS architecture overview

The landing site can run in two data modes (controlled by `NEXT_PUBLIC_USE_CMS_DATA`):

| Mode | `USE_CMS_DATA` | Data source |
| --- | --- | --- |
| **Firebase CMS** (production) | `true` | Firestore collections + Cloudinary images |
| **Static fallback** | `false` | Bundled static data files |

**Supporting services:**

| Service | Role |
| --- | --- |
| **Firebase Firestore** | Events, services, team, resources, gallery, registrations |
| **Firebase Auth** | CMS admin login only (`/admin/*`) |
| **Cloudinary** | Image uploads from admin panel (unsigned preset) |
| **Strapi API** | Public member auth, website signup → CRM sync |

**Key env vars** (`apps/landing/.env.local` / `.env.production`):

```env
NEXT_PUBLIC_USE_CMS_DATA=true
NEXT_PUBLIC_ADMIN_EMAILS=admin@xtrawrkx.com,xtrawrkxadmin@xmc.com
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
NEXT_PUBLIC_STRAPI_API_URL=https://xtrawrkxsuits-production.up.railway.app/api
LANDING_SIGNUP_SECRET=...   # must match Strapi backend
```

### 8.7 CMS admin — sign in & access

1. Go to **`https://xtrawrkx.com/admin/login`**
2. Sign in with a Firebase admin account (email must be in `NEXT_PUBLIC_ADMIN_EMAILS`)
3. Default credentials — see [§2.5](#25-landing-cms-admin-login-firebase):
   - Email: `admin@xtrawrkx.com`
   - Password: `password1234`
4. On success → redirected to `/admin/dashboard`
5. Non-admin Firebase users are rejected with “Access denied. Admin privileges required.”

**Seed or reset CMS admin:**

```bash
npm run seed:firebase-admin -w @xtrawrkx/landing
```

### 8.8 CMS admin — navigation & modules

| Sidebar item | Route | What you manage |
| --- | --- | --- |
| **Dashboard** | `/admin/dashboard` | KPIs, recent activity, system status (Firestore + Cloudinary health) |
| **Resources** | `/admin/resources` | Whitepapers, articles, reports, interviews, newsletters |
| **Events** | `/admin/events` | Event listings, hero images, dates, status |
| **Registrations** | `/admin/registrations` | Event registration records |
| **Services** | `/admin/services` | Service offerings (XMC, XGV, XMB categories) |
| **Gallery** | `/admin/gallery` | Photo/media gallery items |
| **Team** | `/admin/team` | Team member profiles (core / employee) |
| **Contact Inquiries** | `/admin/contact-inquiries` | Contact form submissions |
| **Consultation Bookings** | `/admin/consultation-bookings` | Consultation requests |
| **Failed Payments** | `/admin/failed-payments` | Payment failures *(route exists; not in sidebar)* |

**Create flows:** Each module has a **New** action → `/admin/{module}/new` (or `/edit/[id]` for resources).

### 8.9 CMS workflows by module

#### Resources (`/admin/resources`)

- **Types:** whitepaper · article · report · interview · newsletter
- **Categories:** Finance · Technology · Manufacturing · Market Analysis · etc.
- **Status:** published · draft · archived
- **Actions:** Create, edit, upload cover image (Cloudinary), bulk select, grid/list view, search and filter
- **Public view:** `/resources` and `/resources/[slug]`

#### Events (`/admin/events`)

- **Fields:** title, description, date, location, status (upcoming / ongoing / completed), hero image, background, slug
- **Actions:** Create event, manage registrations link, view gallery
- **Public view:** `/events`, `/events/[slug]`, `/events/[slug]/register`, `/events/[slug]/gallery`

#### Services (`/admin/services`)

- **Fields:** title, description, company (XMC / XGV / XMB), category, active flag
- **Public view:** `/services`, `/services/[slug]`

#### Team (`/admin/team`)

- **Fields:** name, title, category (core / employee), location, email, LinkedIn, bio, photo
- **Public view:** `/teams`

#### Gallery (`/admin/gallery`)

- **Fields:** title, description, image URL (Cloudinary), category, tags
- **Public view:** `/gallery` and event-specific galleries

#### Registrations (`/admin/registrations`)

- View all event registrations
- Filter and search attendees
- Cross-reference with events module

#### Contact inquiries & consultation bookings

- **Contact inquiries:** Submissions from `/contact-us` form
- **Consultation bookings:** Booking requests from site CTAs
- Review status: new · in progress · resolved (inquiries) / pending · confirmed · completed (bookings)

### 8.10 Firestore collections reference

| Collection | Key fields |
| --- | --- |
| `events` | title, description, date, location, status, heroImage, background, slug |
| `services` | title, description, company, category, isActive |
| `team` | name, title, category, location, email, linkedin, img, bio, isActive |
| `resources` | title, description, type, category, content, image, publishDate |
| `gallery` | title, description, url, category, tags |

Images are stored on **Cloudinary**; Firestore holds metadata and URLs.

### 8.11 Image uploads (Cloudinary)

1. In any CMS create/edit form, use the image upload control.
2. Images upload via **unsigned preset** (`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`).
3. Preset must be configured as **Unsigned** in Cloudinary dashboard.
4. Recommended: folder `xtrawrkx/`, max 5 MB, formats jpg/png/gif/webp.

### 8.12 CMS admin daily workflow

```
Sign in at /admin/login
    → Dashboard: check stats & system health
    → Events: add/update upcoming events
    → Resources: publish new articles or whitepapers
    → Registrations: monitor sign-ups
    → Contact Inquiries: respond to new leads
    → Team / Gallery / Services: keep content current
    → Sign out from sidebar
```

### 8.13 Landing troubleshooting

| Problem | Fix |
| --- | --- |
| CMS login fails | Run `npm run seed:firebase-admin -w @xtrawrkx/landing`; verify Firebase env vars |
| “Access denied” on admin | Email must be in `NEXT_PUBLIC_ADMIN_EMAILS` |
| Public pages show stale data | Confirm `NEXT_PUBLIC_USE_CMS_DATA=true` and Firestore has records |
| Image upload fails | Check Cloudinary preset is **unsigned** and env vars are set |
| `/auth` signup fails | Verify Strapi is running and `NEXT_PUBLIC_STRAPI_API_URL` is correct |
| Website signup not in CRM | Match `LANDING_SIGNUP_SECRET` on landing and backend |

---

## 9. Client Portal

**Xtrawrkx Client Portal** gives your clients a secure workspace for projects, tasks, events, communities, and documents.

### 9.1 Access

- **No self-service signup** on the portal — access is granted by your administrator or via landing website signup.
- Sign in at `/auth` — see [§2.7](#27-client-portal-login).
- **Website handoff:** Landing profile can open the portal with `from=xtrawrkx-website` and your email pre-filled.
- **Invite link:** `from=invite` with email/password in URL for first-time login.

### 9.2 Navigation

**Primary work:** Dashboard · Projects · Tasks · Messages

**Collaboration:** Events · Communities · Services

**Management:** Company Members · Files/Documents · Billing *(billing pages planned)*

**Settings:** Settings · About · Privacy · Terms

### 9.3 Key pages

| Page | What you can do |
| --- | --- |
| **Dashboard** (`/dashboard`) | Overview stats, recent tasks, projects, communities |
| **Projects** (`/projects`) | Browse, search, filter, create projects |
| **Project detail** (`/projects/[id]`) | Tasks, team, discussion board, budget/progress |
| **Tasks** (`/tasks`) | List, filter, create tasks and subtasks |
| **Messages** (`/messages`) | Chat with the Xtrawrkx team |
| **Events** (`/events`) | Your registrations, tickets, galleries |
| **Communities** (`/communities`) | Browse, join, track membership status |
| **Company** (`/company`) | Manage company members (Admin/Manager roles) |
| **Files** (`/files`) | Download shared documents |
| **Settings** (`/settings`) | Profile, password, notifications, timezone |

### 9.4 Client workflows

| Goal | Steps |
| --- | --- |
| Check project status | Dashboard → Projects → open project |
| Complete a task | Tasks → open task → update status |
| Message your team | Messages → select conversation → send |
| Join a community | Communities → select → submit membership request |
| Add a team member | Company → Add member (Admin/Manager only) |
| Download a document | Files → search → download |

---

## 10. Cross-app workflows

### 10.1 New customer onboarding (end to end)

| Step | App | Action |
| --- | --- | --- |
| 1 | **Orbit** | Platform admin creates organization + owner account ✅ |
| 2 | **Fudge Base** | Owner signs in, invites team, assigns roles |
| 3 | **Fudge People** | Sales team adds leads, runs pipeline |
| 4 | **Fudge People** | Win deal → create delivery project |
| 5 | **Fudge Work** | Delivery team executes project and tasks |
| 6 | **Fudge People** | Send proposal and invoice |
| 7 | **Client Portal** | Client views projects, tasks, and files |

### 10.2 Website signup → CRM client

When someone registers on the landing site:

1. Account created on xtrawrkx.com.
2. Backend creates a **client account** in your CRM org (secured API).
3. Primary contact and onboarding project may be provisioned automatically.
4. User can open Client Portal from their profile.

### 10.3 Won deal → delivery project

1. In **Fudge People**, mark deal **Won**.
2. Confirm **Create delivery project**.
3. Project appears in CRM `/clients/projects` and **Fudge Work** `/projects`.
4. PM team manages tasks, timeline, and delivery.

### 10.4 Lead → client conversion

1. Qualify lead in **Fudge People**.
2. Click **Convert to Client Account**.
3. Client account created; lead status = **CONVERTED**.
4. All deals, proposals, and invoices link to the client account going forward.

### 10.5 Activity and audit trail

| Source | Visible in |
| --- | --- |
| CRM comments and updates | CRM Activity log, Threads, entity timelines |
| PM task/project changes | PM Inbox, entity activity panels |
| User management | Fudge Base Audit Logs |
| All modules | Fudge Base Audit Logs (filtered by module) |

---

## 11. Roles, permissions & access

### 11.1 Organization roles

Every user has an **organization role** (Admin, Manager, Member, or custom):

| Role | Typical access |
| --- | --- |
| **Admin** | Full access to all modules; Security settings; all dashboard views |
| **Manager** | Team oversight; Manager dashboard; broader edit rights |
| **Member** | Personal dashboard; edit own assigned records only |

Org **admins** bypass all CRM/PM module permission checks.

### 11.2 Module permissions

Defined in **Fudge Base → Roles & Permissions**. Each module has:

| Level | Can do |
| --- | --- |
| **Read** | View records and pages |
| **Write** | Create records; edit/delete **own** assigned records |
| **Manage** | Edit/delete **any** record in the module |

### 11.3 CRM dashboard views by org role

| Org role | Dashboard views |
| --- | --- |
| Member | Personal only |
| Manager | Personal + Manager |
| Admin | Personal + Manager + Sales |

### 11.4 PM project/task rules by org role

| Action | Admin | Manager | Member |
| --- | --- | --- | --- |
| Create project | ✅ | ✅ | ❌ |
| Edit any project | ✅ | Own PM projects only | ❌ |
| Create task on project | ✅ | ✅ | If on team |
| Edit task fields | ✅ | Team tasks | Own tasks (status only) |
| Approve task assignments | ✅ | ✅ | ❌ |

### 11.5 Platform admin (Orbit only)

Separate from org roles. Requires `isPlatformAdmin: true`. Used only for creating and managing tenant organizations.

---

## 12. Notifications, search & collaboration

### 12.1 In-app notifications

Triggered by:
- Comments on leads, deals, contacts, tasks, projects
- @mentions (marked urgent)
- Direct messages
- Record updates assigned to you

**Where to find them:**
- **Fudge People:** Sidebar activity feed; Inbox in PM
- **Fudge Work:** Inbox → Notifications tab; bell dropdown
- **Fudge Base:** Audit Logs for admin actions

### 12.2 Global search

| App | Searches |
| --- | --- |
| Fudge People | Leads, deals, contacts, client accounts |
| Fudge Work | Projects, tasks |

Use keyboard navigation in the search modal to jump directly to a record.

### 12.3 Comments & @mentions

Available on:
- Lead companies, contacts, deals, client accounts (CRM)
- Projects and tasks (PM)
- Threads page aggregates all CRM conversations

Type `@` followed by a name to notify a teammate.

### 12.4 Direct messages

**Fudge Work → Message:** 1:1 org chat with read receipts and unread badges.

---

## 13. Troubleshooting & FAQ

### I can’t sign in (workspace apps)

- Confirm you are using the correct app URL — see [§2.1](#21-production-app-urls).
- Workspace login credentials: [§2.4](#24-workspace-apps-login-crm-pm-accounts). XMC users may use `Xtr@<FirstName>#XWK` after bulk password assignment.
- Ask your org admin to check your status in **Fudge Base → Users** (Active vs Suspended vs Invited).
- Invited users must complete the invite email flow before signing in.
- Clear browser storage (`auth-token`, `auth-user`, `current-org-id`) and try again.

### Landing CMS admin login fails

- Verify Firebase env vars are set on the landing app.
- Run `npm run seed:firebase-admin -w @xtrawrkx/landing`.
- Confirm your email is listed in `NEXT_PUBLIC_ADMIN_EMAILS`.
- Default: `admin@xtrawrkx.com` / `password1234` — see [§2.5](#25-landing-cms-admin-login-firebase).

### Landing public `/auth` login fails

- Uses Strapi, not Firebase — check `NEXT_PUBLIC_STRAPI_API_URL` points to the live API.
- Sign up first if you have no account; there is no default public member password.

### Client Portal login fails

- Email must match a CRM contact with active portal access — see [§2.7](#27-client-portal-login).
- Run `node apps/backend/scripts/diagnose-client-portal-login.js user@example.com` to check provisioning.

### I see “Access denied” or “This module is not available for your role”

- Your role lacks read access to that module. Contact your admin.
- Admin can fix this in **Fudge Base → Roles & Permissions**.

### I can’t edit a record someone else owns

- With **Write** access you can only edit records **assigned to you**.
- Ask for **Manage** access on that module, or ask the record owner/admin to reassign it.

### Orbit says “Unauthorized”

- You are signed in with a regular org account, not a platform admin account.
- Use CRM, PM, or Accounts for day-to-day work.
- Platform admin access is provisioned by Webfudge Systems.

### Data looks empty after login

- Confirm the correct organization is active (`current-org-id`).
- If you were opened from Orbit, use **Open Accounts** or **Open PM** again to reset context.
- New orgs start empty — add data via CRM or invite users in Fudge Base.

### Calendar shows wrong dates

- Dates are stored in UTC and displayed in your local timezone.
- Overdue tasks are calculated by calendar day in your locale.

### PWA / offline message

- Fudge People and Fudge Work require an internet connection for live data.
- Reload the page after reconnecting.

### Where do I manage users and billing?

- **Users, roles, security:** Fudge Base (`accounts.xtrawrkx.com`)
- **Billing:** Fudge Base → Billing (payment gateway coming soon)
- **New organizations:** Orbit (platform admin only)

---

## Quick reference card

| I want to… | Go to… |
| --- | --- |
| **Sign in to Orbit** | `orbit.10x1.webfudge.in/login` · `admin@xtrawrkx.com` / `XtrawrkxAdmin@2025` |
| **Sign in to CRM / PM / Accounts** | App URL `/login` · org email + password (or `Xtr@<FirstName>#XWK`) |
| **Sign in to Landing CMS** | `xtrawrkx.com/admin/login` · `admin@xtrawrkx.com` / `password1234` |
| **Sign in to Client Portal** | `portal.xtrawrkx.com/auth` · CRM contact email + portal password |
| Create a new company (tenant) | **Orbit** → New organization ✅ |
| Manage landing events/content | **Landing CMS** → `/admin/dashboard` |
| Invite a team member | **Fudge Base** → Users → Invite |
| Set what a role can access | **Fudge Base** → Roles & Permissions |
| Add a sales lead | **Fudge People** → Sales → Lead Companies → New |
| Move a deal through pipeline | **Fudge People** → Deals or Pipeline Board |
| Convert lead to client | Lead detail → Convert to Client |
| Send a proposal | **Fudge People** → Workspace → Proposals → New |
| Create an invoice | **Fudge People** → Clients → Invoices → New |
| Schedule a meeting | **Fudge People** → Meetings → New |
| Start a delivery project | **Fudge Work** → Projects → Add (or from Won deal) |
| Manage my tasks | **Fudge Work** → My Tasks |
| Message a colleague | **Fudge Work** → Message |
| See all org activity | **Fudge Base** → Audit Logs |
| Register for an event | **xtrawrkx.com** → Events → Register |
| Client views their project | **Client Portal** → Projects |

---

## Document info

| Field | Value |
| --- | --- |
| Covers | Orbit ✅, Fudge Base, Fudge People, Fudge Work, Landing (public + Firebase CMS), Client Portal |
| Excludes | Fudge Books |
| Login credentials | §2 — Orbit, workspace, CMS admin, public auth, client portal, bulk XMC pattern |
| Orbit status | All core steps documented as **done** (sign in, list, create, detail, open apps, delete, sign out) |
| Related docs | [LOCAL_DB_RESET.md](./LOCAL_DB_RESET.md) · [ENV_FILES.md](./ENV_FILES.md) · [LANDING_WEBSITE_SIGNUP_CRM.md](./LANDING_WEBSITE_SIGNUP_CRM.md) · [CLIENT_PORTAL_AUTH_UPDATE.md](./CLIENT_PORTAL_AUTH_UPDATE.md) |

---

*Built by Webfudge Systems · [webfudgesystems.in](https://webfudgesystems.in) · [webfudgesystems@gmail.com](mailto:webfudgesystems@gmail.com)*
