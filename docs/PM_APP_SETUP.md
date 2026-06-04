# PM App Setup Summary

## Summary

The `apps/pm` app has been built as a full-featured Project Management dashboard. All pages have been updated to use `@webfudge/ui` components throughout for full UI consistency with `apps/crm`. The UI architecture shares the same tailwind preset, `@webfudge/auth`, `@webfudge/ui` components, and page header pattern. The PM features are based on the [xtrawrkx-pm-dashboard](https://github.com/Abhirajmaid/xtrawrkx_suits/tree/master/xtrawrkx-pm-dashboard) reference repository.

### UI Component Standardization (Latest Update)
All PM pages now use `@webfudge/ui` components consistently:

| Custom Element | Replaced With |
|---|---|
| Custom stat cards | `KPICard` (colorScheme, icon, value, subtitle) |
| `<table>` elements | `Table` (columns with render fns, variant="modern") |
| Custom empty divs | `EmptyState` (icon, title, description, action) |
| Tab bar + search | `TabsWithActions` (tabs, showSearch, showAdd, showExport, showViewToggle) |
| Custom modals | `Modal` (isOpen, onClose, title, size) |
| Custom buttons | `Button` (variant="primary/secondary/outline/ghost/danger") |
| Text inputs | `Input` (label, error) |
| Select dropdowns | `Select` (options, label) |
| Textareas | `Textarea` (label, rows) |
| Checkboxes | `Checkbox` |
| Status/priority labels | `Badge` (variant="success/warning/danger/info/purple") |
| User avatar initials | `Avatar` (fallback, size) |
| Container cards | `Card` (variant, padding, hoverable, glass) |
| Loading states | `LoadingSpinner`, `TableSkeleton`, `PageLoader` |

## Scope

- App: `apps/pm` (port 3002)
- New files: 20+ across `app/`, `components/`, `lib/`
- Modified: `package.json`, `tailwind.config.js`, `app/globals.css`, `app/layout.js`

## Architecture

```
apps/pm/
├── app/
│   ├── layout.js               # AuthProvider + LayoutContent
│   ├── globals.css             # Matches CRM (Host Grotesk, Tailwind)
│   ├── page.js                 # Dashboard
│   ├── login/page.js
│   ├── unauthorized/page.js
│   ├── coming-soon/page.js
│   ├── projects/
│   │   ├── page.js             # Projects list (list/grid, tabs, search)
│   │   ├── add/page.js         # Create project form
│   │   └── [slug]/page.js      # Project detail (4 tabs)
│   ├── my-tasks/page.js        # Task table with inline editing
│   ├── analytics/page.js       # Charts + key metrics
│   ├── inbox/page.js           # Notifications
│   └── message/page.js         # Messaging
├── components/
│   ├── LayoutContent.jsx       # Auth gate + PMSidebar shell
│   ├── PMSidebar.jsx           # Collapsible sidebar with live projects
│   ├── PMPageHeader.jsx        # Breadcrumbs, search, notifications, profile
│   └── GlobalSearchModal.jsx   # Search tasks + projects
└── lib/
    ├── strapiClient.js          # HTTP client (same as CRM)
    └── api/
        ├── projectService.js
        ├── taskService.js
        ├── dataTransformers.js
        ├── notificationService.js
        └── index.js
```

## Pages & Features

### Dashboard (`/`)
- Greeting header with current date
- 4 KPI stat cards: To Do / In Progress / Done / Overdue tasks
- My Tasks table (collaborator tasks)
- Projects panel with "Create New Project" CTA and due dates
- People count widget
- Private Notepad (persisted to localStorage)

### Projects (`/projects`)
- Status tabs: All / Planning / Active / In Progress / On Hold / Completed / Cancelled
- List view table (name, status dropdown, progress bar, team avatars, due date, actions)
- Grid view cards with progress
- Inline status update via dropdown
- Delete with confirmation modal
- CSV export
- KPI cards (Total, Active, Completed, On Hold)

### Project Detail (`/projects/[slug]`)
- **Overview tab**: Project details, progress bar, team preview, task status breakdown
- **Tasks tab**: Full table with inline status/priority selectors, checkbox complete toggle, delete, add task inline
- **Members tab**: Team list with per-member task stats, invite/remove members
- **Discussion tab**: Chat-style message thread

### Add Project (`/projects/add`)
- Form: name, description, status, start/end dates, budget, project manager selector (auto-selects current user), client account
- Redirects to project detail after creation with 2s success screen

### My Tasks (`/my-tasks`)
- Tabs: All / My Tasks / To Do / In Progress / Internal Review / Done / Overdue
- Full table: checkbox select, task name + complete toggle, project link, status dropdown, priority dropdown, assignee avatars, due date inline edit, delete
- Inline task creation with project, status, priority, due date
- Bulk delete
- CSV export
- Confetti animation on task completion

### Analytics (`/analytics`)
- Key metrics cards: Projects, Tasks, Completed, In Progress, Overdue
- Task completion rate donut chart (SVG)
- Task-by-status horizontal bar chart (CSS)
- Task-by-project progress bars (completed vs remaining)
- Task-by-assignee bar chart with avatar initials
- Polls every 10 seconds for live updates

### Inbox (`/inbox`)
- All / Unread / Read tabs with counts
- Notification search
- Two-panel layout: list left, detail right
- Mark as read on click, Mark all as read
- Polls every 5 seconds

### Messages (`/message`)
- User list with search
- Chat thread per user (Enter to send)
- Two-panel layout: users left, chat right

## UI Consistency with CRM

- Same tailwind preset from `packages/config/tailwind.preset`
- Same `brand-*` color tokens (`brand-primary: #F5630F`, `brand-foreground`, etc.)
- Same Host Grotesk font
- Same `PMPageHeader` structure as `CRMPageHeader`
- Same `@webfudge/ui` components: `Card`, `Avatar`, `Button`, `Input`, `LoadingSpinner`
- Same `@webfudge/auth` for `AuthProvider` / `useAuth`
- Same sidebar layout pattern (collapse toggle, quick actions, navigation grid, tools accordion, user footer)
- Same auth gate pattern in `LayoutContent.jsx`

## API / Services

All services use `lib/strapiClient.js` (reads token from `auth-token`, `strapi_token`, or `xtrawrkx-authToken` in localStorage).

- `projectService` — CRUD for `/api/projects`, search, team management
- `taskService` — CRUD for `/api/tasks`, `getPMTasksByAssignee` filters out CRM tasks (those with `leadCompany / clientAccount / contact / deal` relations)
- `notificationService` — Same as CRM
- `dataTransformers` — Maps Strapi enums to UI labels, transforms nested relations

## How to Use

```bash
# Install deps
cd apps/pm
npm install

# Start dev server
npm run dev
# → http://localhost:3002

# Or from root
turbo dev --filter=@webfudge/pm
```

## Migration Notes

- The old placeholder `app/page.js` has been replaced with the full dashboard.
- `tailwind.config.js` now includes `./components/**` and `../../packages/ui/**` in content.
- `package.json` now depends on `@webfudge/ui`, `@webfudge/auth`, `@webfudge/utils`, `lucide-react`, `clsx`, and `canvas-confetti`.
