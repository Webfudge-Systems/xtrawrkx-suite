# Client Portal Workflow Update

## Summary

Unified the client engagement experience across **Client Portal**, **CRM**, **PM**, and shared packages. Clients can submit tasks, follow a visible workflow pipeline, chat with Xtrawrkx (separate from internal CRM activity), and apply to communities with CRM-approved onboarding. XEN paid tiers align with the landing website structure.

## Scope

### Backend (Strapi)

- **Task schema** (`apps/backend/src/api/task/content-types/task/schema.json`)
  - `isSharedWithClient`, `createdBySource`, `clientWorkflowStage`, `clientActionRequired`, `clientActionType`, `clientActionNotes`, `clientApprovalStatus`, `stageHistory`
  - Extended `status` enum for client-facing states
- **Client chat** (`apps/backend/src/api/chat-message/`)
  - New `chat-message` content type — separate from `crm-activity` comments and `direct-message`
  - `GET /api/chat-messages/clientAccount/:id`, `GET/POST /api/chat-messages`
- **Task client routes** (`apps/backend/src/api/task/routes/custom-task.js`)
  - `GET /tasks/list-for-client`
  - `POST /tasks/client-create`
  - `POST /tasks/:id/client-action` (client approve/reject/close)
  - `PATCH /tasks/:id/share-with-client`
  - `PATCH /tasks/:id/advance-client-stage`
- **Community approval** — `approve` accepts `tier` + `membershipType` for XEN paid sync

### Shared packages

- `@webfudge/utils` — `communityTiers.js`, `clientTaskWorkflow.js` (XEN X0–X5, pipeline stages)
- `@webfudge/ui` — `TaskWorkflowPipeline`, `ClientChatPanel`

### Client Portal

- `MainLayout` → `WorkspaceLayoutContent` (consistent with CRM/PM/Accounts)
- Task detail page (`/tasks/[id]`) — real API + pipeline UI + client actions
- Task create → `POST /tasks/client-create` (auto-shared)
- Community join form — XEN tier selection; profile details prefilled when logged in
- Community applications remain **pending until CRM approval**

### CRM

- Client accounts list — Communities + Portal onboarding columns
- Client account detail — **Client chat** tab (external) + **Communities** tab (approve/reject, XEN tier)

### PM

- Task detail — `ClientTaskWorkflowPanel` (share with client, advance stage, request client decision)

## Client task workflow

| Stage | Meaning |
|-------|---------|
| CLIENT_SUBMITTED | Client created the task |
| XTRAWRKX_REVIEW | Xtrawrkx reviewing / accepting |
| ACCEPTED | Accepted by Xtrawrkx |
| IN_PROGRESS | Work in progress |
| CLIENT_DECISION | Quote, financial decision, or approval needed from client |
| CLIENT_REVIEW | Completed work awaiting client review |
| CLOSED | Client reviewed and closed |

**Rules**

- Client-created tasks are automatically `isSharedWithClient: true`
- Internal tasks are hidden from the portal unless explicitly shared from PM/CRM
- `stageHistory` records each transition for the portal status timeline

## Community onboarding

1. Client completes community form in portal (details prefilled from account/onboarding)
2. For **XEN**, client selects tier (X0–X5)
3. Submission status = `SUBMITTED` — **no automatic membership**
4. CRM reviews on client account **Communities** tab
5. On approve → `community-membership` created with tier in `membershipData`

## Chat separation

| Channel | Storage | Audience |
|---------|---------|----------|
| CRM Activities / Threads | `crm-activity` comments | Internal team |
| PM Messages | `direct-message` | Internal 1:1 |
| Client Portal + CRM Client chat | `chat-message` | Client ↔ Xtrawrkx |

## Usage / migration

1. Restart Strapi after schema changes so `chat-message` and new task fields are registered.
2. Existing tasks: set `isSharedWithClient` from PM task detail or CRM as needed.
3. Client portal chat will work once backend is running with the new `chat-message` API.

## Key files

- `apps/backend/src/utils/client-task-workflow.js`
- `apps/backend/src/utils/client-portal-request.js`
- `packages/ui/components/TaskWorkflowPipeline/`
- `packages/ui/components/ClientChatPanel/`
- `apps/crm/components/ClientAccountCommunitiesPanel.jsx`
- `apps/crm/components/ClientAccountChatPanel.jsx`
- `apps/pm/components/ClientTaskWorkflowPanel.jsx`
