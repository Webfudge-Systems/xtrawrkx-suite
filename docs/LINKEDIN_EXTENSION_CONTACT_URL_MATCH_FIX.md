# LinkedIn Extension — Contact URL Match Fix

## Summary

The extension showed **Import to CRM** for contacts that already existed in CRM when the stored `linkedIn` value did not exactly match the current profile URL. Matching now normalizes URLs and falls back to `/in/{slug}` comparison, so older imports (trailing slash, query params, www variance, etc.) resolve to **View in CRM**.

## Scope

- `apps/linkedin-extension/xtrawrkx-linkedin-extension/`
- `apps/linkedin-extension/xtrawrkx-linkedin-extension-marketplace/`

Key files:

- `src/utils/api-client.js` — `normalizeContactLinkedInUrl`, slug fallback in `findExistingContact` / `checkDuplicateContact`
- `src/utils/data-mapper.js` — canonicalize `linkedIn` on import
- `src/content/profile-url-utils.js` — canonical extraction always uses `https://www.linkedin.com/in/{slug}`

## Before / after

| Before | After |
|--------|--------|
| Exact `$eq` on raw URL only | Normalize → `$eq` on canonical URL, then `$containsi` + slug match |
| Older CRM rows with `?…`, trailing `/`, or non-www missed | Same person matched by LinkedIn slug |
| Import could create duplicates / overwrite risk | Duplicate check uses the same slug-aware lookup |

## How matching works now

1. Canonicalize to `https://www.linkedin.com/in/{slug}` (lowercase slug).
2. Query `filters[linkedIn][$eq]` with that URL.
3. If miss: `filters[linkedIn][$containsi]=/in/{slug}` (and `/pub/{slug}`), then verify slug client-side.
4. New imports store the canonical URL via the data mapper.

## Usage / deploy

1. Reload or republish both extension builds so users pick up the change.
2. Open a previously failing profile (already in CRM) — sidebar should show **View in CRM**.
3. Contacts with an **empty** LinkedIn field in CRM still will not match until a URL is set.

Optional follow-up: one-time DB cleanup to rewrite existing `contacts.linkedIn` values to the canonical form (not required for the extension fix to work).
