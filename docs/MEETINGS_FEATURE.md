# Meetings Module — Full Stack Feature

## Summary

A full-stack Meetings module for the CRM, covering scheduled meetings, client calls, demos, and internal sessions. It introduces a Strapi backend content type, a frontend service, a list page with table + calendar toggle, a new-meeting form, a detail page with 5 tabs, and CRM activity logging. Navigation is updated from the "coming soon" placeholder to live routes.

---

## Scope

**Backend:**
- `apps/backend/src/api/meeting/` — new content type (schema, controller, routes, service)

**Frontend:**
- `apps/crm/lib/api/meetingService.js` — API client
- `apps/crm/app/meetings/page.js` — list page
- `apps/crm/app/meetings/new/page.js` — create form
- `apps/crm/app/meetings/[id]/page.js` — detail page
- `apps/crm/components/MeetingsCalendarView.jsx` — FullCalendar wrapper component

**Navigation:**
- `apps/crm/components/CRMSidebar.jsx` — Meetings + Schedule Meeting links updated
- `apps/crm/lib/navigation.js` — same updates

**New dependency:**
- `@fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction`

---

## Backend Schema — `meeting`

| Field | Type | Notes |
|---|---|---|
| `title` | string (required) | Meeting title |
| `startTime` | datetime (required) | Start datetime |
| `endTime` | datetime | End datetime |
| `meetingType` | enum | `discovery / demo / follow_up / check_in / review / internal / other` |
| `status` | enum | `scheduled / completed / cancelled / no_show` (default: `scheduled`) |
| `location` | string | Physical address or video URL |
| `isVirtual` | boolean | Default: false |
| `agenda` | text | Pre-meeting agenda |
| `notes` | text | Post-meeting summary / notes |
| `outcome` | enum | `positive / neutral / negative / pending` (default: `pending`) |
| `reminderPreset` | enum | `none / 10min / 30min / 1hour / 1day` (default: `30min`) |
| `visibility` | enum | `public / team / private` (default: `public`) |
| `attendeesMeta` | JSON | Array of `{contactId, role, rsvp}` for RSVP tracking |
| `recurrenceRule` | string | rrule format (Phase 2) |
| `recordingUrl` | string | Link to recording |
| `aiSummary` | text | Firefly.ai / AI populated (Phase 3) |
| `transcriptUrl` | string | Transcript link (Phase 3) |
| `externalMeetingId` | string | Zoom/Firefly meeting ID (Phase 3) |
| `organizer` | manyToOne → user | Meeting organiser |
| `assignedTo` | manyToOne → user | Owner |
| `deal` | manyToOne → deal | Linked deal |
| `clientAccount` | manyToOne → client-account | Linked account |
| `leadCompany` | manyToOne → lead-company | Linked lead |
| `contact` | manyToOne → contact | Primary attendee |
| `attendees` | manyToMany → contact | Additional attendees |
| `organization` | manyToOne → organization | Tenant |

---

## List Page (`/meetings`)

- **4 KPI cards**: Total, Upcoming, Today, Completed this week
- **6 tabs**: All | Upcoming | Today | Past | Cancelled | Analytics
- **Table view** (default): Title, Date & Time, Duration, Type, Status, Related To, Attendees (avatar stack), Owner, Actions
- **Calendar view** (toggle): FullCalendar with Month / Week / Day views, color-coded by meeting type
- **Filter panel**: type, status, from/to date
- **Analytics tab**: CSS-based status breakdown, by-type bar, day-of-week chart, top owners leaderboard

## New Meeting Page (`/meetings/new`)

Sections using `FormSectionCard`:
1. Meeting Details (title, type, status, outcome, visibility)
2. Schedule (start/end datetime, auto-computed duration, reminder preset)
3. Location (physical or virtual, isVirtual checkbox)
4. Agenda (textarea)
5. Attendees (primary contact + multi-attendee picker with roles)
6. Link to CRM (deal, client account, lead company)
7. Pre-meeting Notes

Supports URL prefill params: `?date=`, `?deal=`, `?clientAccount=`, `?leadCompany=`

## Detail Page (`/meetings/[id]`)

5-tab pill layout:

| Tab | Content |
|---|---|
| Overview | Meeting details, agenda (inline edit), linked CRM records sidebar |
| Attendees | All attendees with role + RSVP tracking (Accepted/Pending/Declined) |
| Notes & Recording | Inline-editable post-meeting notes, recording URL, AI summary placeholder |
| Tasks | Tasks linked to this meeting, inline create task form |
| Activity | CRM activity timeline via `EntityActivityPanel` |

Header actions: Status badge, Complete / Cancel quick buttons, Edit link, Delete.

---

## Navigation

- **Sidebar**: "Meetings" in Workspace section → `/meetings` (was `coming-soon`)
- **Quick action**: "Schedule Meeting" → `/meetings/new` (was `coming-soon`)

---

## Phase Roadmap

### Phase 2 (Next sprint — no schema changes needed)
- Drag-drop and resize on calendar (FullCalendar `interaction` plugin already installed, enable `editable: true`)
- RSVP email notifications
- Recurring meetings (`rrule` library, expand from `recurrenceRule` field)
- Conflict detection on save
- Reminder cron job (Strapi scheduled jobs)

### Phase 3 — Firefly.ai Integration
- `POST /meetings/firefly-webhook` backend route
- Receives Firefly callback → populates `aiSummary`, `transcriptUrl`, `recordingUrl` by matching `externalMeetingId`
- "Extract Tasks" button parses Firefly action items → auto-creates CRM tasks
- Full transcript view in Notes tab
