# Landing Events — Registration Deadline

## Summary

Events in the landing admin can set a **registration deadline**. Public registration closes automatically at the end of that calendar day (local time). Admins can also disable registration with the **Enable registration** toggle.

## Scope

- `apps/landing/src/utils/eventRegistration.js` — `isRegistrationOpen`, deadline parsing/formatting
- `apps/landing/app/(admin)/admin/events/page.jsx` — Add/Edit event modal (Basic Info → Registration settings)
- `apps/landing/app/(admin)/admin/events/new/page.jsx` — Create event page (aligned with shared util)
- `apps/landing/app/(primary)/events/[slug]/page.jsx` — Hide register CTAs when closed; show deadline hint
- `apps/landing/app/(primary)/events/[slug]/register/page.jsx` — Block form when closed
- `apps/landing/app/(primary)/events/season/[season]/register/page.jsx` — Block closed events in season picker

## Firestore fields

| Field | Type | Notes |
|-------|------|--------|
| `registrationEnabled` | boolean | Default `true`; set `false` to close manually |
| `registrationDeadline` | Date / Timestamp | Optional; inclusive through end of selected day |

## Behavior

- No deadline → registration stays open until status is `completed`/`cancelled` or `registrationEnabled` is false.
- Deadline set → registration closes after **23:59:59** on that date (browser local timezone).
- Event status `completed` or `cancelled` also closes registration.

## Usage

1. Admin → **Events** → Create or Edit event.
2. Under **Registration settings**, set **Registration deadline** (optional).
3. Uncheck **Enable registration** to close immediately without a date.
