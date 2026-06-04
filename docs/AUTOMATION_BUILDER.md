# Automation Builder — Feature Summary

## Summary

A full **Visual Automation Builder** module added to the Webfudge CRM. Users can build drag-and-drop
workflow automations (similar to Zapier/Make) directly within the CRM — starting from CRM events
(triggers) and defining sequences of actions, conditions, and utilities. The UI is fully consistent
with existing CRM pages (same header, card patterns, spacing, and `@webfudge/ui` components).

---

## Scope

### New routes

| Route | Description |
|---|---|
| `/automations` | Workflow list hub (Table + KPICards + tabs) |
| `/automations/new` | Create a new workflow in the visual builder |
| `/automations/[id]` | Edit an existing workflow in the visual builder |

### New files — CRM app

```
apps/crm/app/automations/
  page.js                                  List/hub page
  new/page.js                              New workflow shell
  [id]/page.js                             Edit workflow shell
  components/
    AutomationBuilderPage.jsx              3-panel builder layout + header actions
    AutomationCanvas.jsx                   Center canvas (pan/zoom, nodes, SVG edges)
    AutomationNode.jsx                     Node card (handles, menu, config preview)
    NodeLibrary.jsx                        Left panel — grouped draggable node items
    NodeConfigPanel.jsx                    Right panel — dynamic form per node type
    ExecutionLogsPanel.jsx                 Placeholder for future execution history
  hooks/
    useAutomationBuilder.js                useReducer state: nodes, edges, selection
  services/
    automationService.js                   Save/load/delete/test (localStorage-backed)
  utils/
    nodeTypes.js                           Full node type registry + config schemas
    aiWorkflowGenerator.js                 Stub for future AI workflow generation
```

### New files — packages/ui

```
packages/ui/components/NodeHandle/
  NodeHandle.jsx                           Reusable connection handle dot for canvas nodes
packages/ui/components/WorkflowStatusBadge/
  WorkflowStatusBadge.jsx                  Draft / Active / Paused / Error pill badge
```

Both are exported from `packages/ui/src/index.js` and available via `@webfudge/ui`.

### Modified files

| File | Change |
|---|---|
| `packages/ui/components/index.js` | Export `NodeHandle`, `WorkflowStatusBadge` |
| `packages/ui/src/index.js` | Export `NodeHandle`, `WorkflowStatusBadge` |
| `apps/crm/lib/navigation.js` | `automationNavItems[0]` href changed from coming-soon → `/automations` |
| `apps/crm/components/CRMSidebar.jsx` | `automationLinks[0]` href changed → `/automations` |

---

## Architecture

```
AutomationsList (/automations)
  └─ Table of saved workflows (getWorkflows → localStorage)

AutomationBuilderPage (new/[id])
  ├─ CRMPageHeader
  │    └─ Editable workflow name | WorkflowStatusBadge | Save / Test / Publish buttons
  ├─ NodeLibrary (left 280px)
  │    └─ Searchable grouped list of draggable node types
  ├─ AutomationCanvas (center flex-1)
  │    ├─ CSS grid dot background
  │    ├─ Pan (mouse drag on empty canvas)
  │    ├─ Zoom (scroll wheel + buttons, 0.3–2×)
  │    ├─ AutomationNode cards (absolute positioned, draggable)
  │    └─ SVG bezier edges (arrowheads, delete on hover)
  └─ NodeConfigPanel (right 320px)
       └─ Dynamic form from node configSchema (Input/Select/Textarea)
```

---

## Node types

### Triggers
| ID | Label |
|---|---|
| `trigger_lead_created` | Lead Created |
| `trigger_deal_updated` | Deal Updated |
| `trigger_meeting_completed` | Meeting Completed |
| `trigger_contact_created` | Contact Added |
| `trigger_invoice_overdue` | Invoice Overdue |

### Actions
| ID | Label |
|---|---|
| `action_send_email` | Send Email |
| `action_create_task` | Create Task |
| `action_update_deal` | Update Deal |
| `action_assign_user` | Assign User |
| `action_add_note` | Add Note / Comment |

### Conditions
| ID | Label |
|---|---|
| `condition_if_else` | If / Else (TRUE + FALSE branches) |

### Utilities
| ID | Label |
|---|---|
| `utility_delay` | Delay (minutes/hours/days/weeks) |
| `utility_webhook` | Webhook (HTTP request) |

---

## State shape

```js
{
  workflow: { id, name, status, description, version, createdAt, updatedAt },
  nodes: [
    {
      id,          // unique node ID
      typeId,      // key into NODE_TYPE_MAP
      type,        // 'trigger' | 'action' | 'condition' | 'utility'
      label,
      iconName,
      position: { x, y },
      config: {},  // field values from configSchema
      isStart,     // boolean, only true for the default Start node
    }
  ],
  edges: [
    {
      id,
      sourceNodeId,
      sourceHandle,  // 'output' | 'output-true' | 'output-false'
      targetNodeId,
      targetHandle,  // 'input'
    }
  ],
  selectedNodeId: null
}
```

---

## Service layer

`automationService.js` functions are all `async` and localStorage-backed for now.
Swap implementations for Strapi API calls without touching call sites.

| Function | Description |
|---|---|
| `getWorkflows()` | List all saved workflows |
| `getWorkflow(id)` | Get a single workflow |
| `saveWorkflow(workflow)` | Create or update a workflow |
| `deleteWorkflow(id)` | Delete by ID |
| `runTestWorkflow(workflow)` | Dry-run, returns per-node mock results |
| `publishWorkflow(id)` | Set status → `active` |
| `pauseWorkflow(id)` | Set status → `paused` |

---

## Canvas interactions

| Interaction | How |
|---|---|
| Add node | Drag from NodeLibrary → drop on canvas |
| Move node | Drag node card |
| Select node | Click node → opens NodeConfigPanel |
| Connect nodes | Drag from output handle → drop on input handle |
| Delete edge | Hover edge → click × delete button |
| Delete node | Node action menu → Delete |
| Duplicate node | Node action menu → Duplicate |
| Pan canvas | Drag on empty canvas background |
| Zoom | Scroll wheel or ± buttons (bottom-right) |
| Reset view | Maximize button |

---

## Future-ready placeholders

| Placeholder | File | Description |
|---|---|---|
| AI Workflow Generator | `utils/aiWorkflowGenerator.js` | `generateWorkflowFromPrompt()` stub |
| Execution Logs | `components/ExecutionLogsPanel.jsx` | Per-node history UI shell |
| Version history | `workflow.version` field in state | Incremented on every save |
| Templates marketplace | `utils/nodeTypes.js` → `WORKFLOW_TEMPLATES` | Empty array, ready to populate |

---

## Usage / Migration

No backend changes required for the initial version — all data stored in `localStorage`.

To connect to the Strapi backend later:
1. Create a `workflow` content type in Strapi with `name`, `status`, `nodes` (JSON), `edges` (JSON).
2. Replace the functions in `automationService.js` with Strapi REST or GraphQL calls.
3. Remove localStorage logic.
