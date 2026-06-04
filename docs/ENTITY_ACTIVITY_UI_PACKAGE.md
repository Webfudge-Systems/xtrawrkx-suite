# Entity activity UI in `@webfudge/ui`

## Summary

`ActivitiesTimeline` and `EntityActivityPanel` live in **`packages/ui`** so CRM, PM, and future apps share one implementation.

## Scope

| Area | Change |
| ------ | ------ |
| `@webfudge/ui` | `components/ActivitiesTimeline/`, `components/EntityActivityPanel/`; exported from the main package entry. |
| `apps/crm` | Detail pages and the global activities log import both components from `@webfudge/ui`. |
| `apps/pm` | Project detail imports `EntityActivityPanel` from `@webfudge/ui`. |

## UI notes (reference alignment)

- Timeline: solid orange vertical line and orange event nodes; action pills **CREATE** (green), **COMMENT** (blue), **UPDATE** (slate), **DELETE** (red); field diff “new” value uses a light emerald highlight.
- Panel: **Timeline (N event(s))** always shows the count from `activityCount` or `crmTimeline.length`.

## Usage

```js
import { ActivitiesTimeline, EntityActivityPanel } from '@webfudge/ui';
```

`EntityActivityPanel` expects the same props as before (timeline data, comment fetch/add functions, optional `entityHrefForRow`, etc.). `ActivitiesTimeline` props are unchanged.

## Migration

Import from `@webfudge/ui` only; CRM no longer ships wrapper files under `apps/crm/components/`.
