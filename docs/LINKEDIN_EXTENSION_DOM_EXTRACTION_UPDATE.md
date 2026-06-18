# LinkedIn Extension — DOM Extraction Update

## Summary

Removed the AI/HTML extraction layer from the LinkedIn Chrome extension. Profile import now uses **DOM parsing only** (`ProfileStructuredParser` with LinkedIn IDs, classes, ARIA labels, and `componentkey` selectors). The separate `xtrawrkx-linkedin-extract-api` service was deleted.

## Scope

- `apps/linkedin-extension/xtrawrkx-linkedin-extension/` — extension UI, content scripts, background worker
- Removed: `apps/linkedin-extension/xtrawrkx-linkedin-extract-api/`

## What changed

### Removed

- AI profile extraction (`/extract-linkedin`)
- AI outreach generation (`/generate-outreach`, Generate Pitch UI)
- Full-page HTML capture and preview panel
- `profileCaptureMode.js`, `profile-page-capture.js`
- Strapi proxy calls: `sync-linkedin-enriched`, `generate-linkedin-outreach`
- Dev probe scripts that depended on the extract API

### Added / kept

- `profile-dom-prep.js` — scrolls the page and expands lazy sections before parsing (no `outerHTML` upload)
- `EXTRACT_PROFILE_PREPARED` message — scroll/expand → `ProfileStructuredParser` → CRM import
- Single **Import to CRM** button for profiles, companies, and search results

## Import flow (profiles)

1. User opens a LinkedIn profile and clicks **Import to CRM** in the sidebar.
2. Content script runs `ProfileDomPrep.prepareProfileDom()` to load lazy sections.
3. `ProfileStructuredParser.parseFromDocument()` reads fields from the live DOM.
4. Background worker maps data via `data-mapper.js` and `POST /api/contacts` (+ optional lead company).

### Company deduplication on contact import (2026-06)

When importing a profile with a company name, the extension **reuses an existing lead company** (or client account) instead of creating a duplicate:

1. Match by **LinkedIn company URL** from the profile’s current experience (`/company/...` link).
2. Else match by **exact company name** (case-insensitive) on lead companies, then client accounts.
3. Only create a new lead company if no match is found.

Contact 2 at “Company A” links to the same lead company created for Contact 1. If the lead was converted to a client account, the new contact links to `clientAccount` only when that client account’s name matches exactly.

**2026-06 fix:** Client-account list API ignores name filters; the extension now filters client-side and never falls back to the first company in the list (which incorrectly linked Google employees to Accel). Company names from LinkedIn image alt text are cleaned (`Google logo` → `Google`).

Reload the extension after pulling this change.

## Usage

Reload the unpacked extension in `chrome://extensions` after pulling this change. No extract API or AI keys are required.

## Migration

See prior notes in this file for AI removal. No backend changes required.

## Experience extraction consistency (2026-06)

### Problem

DOM prep was clicking `/details/education`, `/details/skills`, and similar **navigation links**, which moved the browser off the main profile. That caused wrong headlines, missing experience, and inconsistent results across profiles.

### Fix

- **`profile-url-utils.js`** — detects `/in/{slug}/details/*` sub-pages and redirects to the canonical `/in/{slug}` URL before extraction.
- **`profile-dom-prep.js`** — only clicks in-page **buttons** inside the Experience section (`Show all N experience`). Never clicks `<a href>` links to `/details/*`.
- **`profile-structured-parser.js`** — parses **leaf** `entity-collection-item` nodes (skips company group headers); improved legacy list / `pvs-entity` parsing.
- **`linkedin-extractor.js`** — always stores canonical profile URL; re-runs extraction after redirect.

Reload the extension after pulling this change.

## Grouped multi-role experience (2026-06)

### Problem

When someone held **multiple roles at the same company**, LinkedIn uses a different DOM layout: the **company name** is the top-level header and each role is a nested `<ul><li>` with its own title and dates. The old parser treated the first line as the job title, so **Palo Alto Networks** became the job title and **Pune District…** became the company.

### Fix (`profile-structured-parser.js`)

- **`isGroupedCompanyExperience()`** — detects company-header + nested role list layout.
- **`parseGroupedCompanyRoles()`** — emits **one experience entry per nested role**, sharing company name, location, and company URL from the parent header.
- **`parseNestedRoleItem()`** — handles leaf entity items that sit inside a grouped block.
- **`isInsideGroupedCompanyRoleList()`** — skips nested `<li>` items when the parent grouped block is already parsed (avoids duplicates).
- **`isAggregateEmploymentLine()`** — recognizes header lines like `Full-time · 1 yr 11 mos` so they are not mistaken for company names.
- **`isNestedRoleLi()` / `isExperienceTopLevelList()`** — distinguishes nested role rows from full experience entries; prevents the main Experience `<ul>` from being treated as “roles under Palo Alto” (which incorrectly stamped Palo Alto on every job).
- **`findGroupedCompanyAncestor()`** — only applies grouped company context when the parsed node is actually inside a nested role row.

After reload, profiles like Omkar Kulkarni should show **Staff Software Engineer** and **Software Engineer** as separate selectable roles (both @ Palo Alto Networks), while Harvard, Sarvatra, etc. keep their own company names.

## LinkedIn Activity Score (2026-06)

### Summary

The extension reads the profile **Activity** carousel (post timestamps like `1d`, `3h`, `1w`) and computes an **Activity Score** from 0–100. More recent and frequent posts yield a higher score.

### Score tiers

| Score | Label |
|-------|--------|
| 80–100 | Very Active |
| 60–79 | Active |
| 40–59 | Moderate |
| 20–39 | Low Activity |
| 0–19 | Inactive |

### UI

Shown in the sidebar above experience selection, with a progress bar and summary (e.g. “3 recent posts, posted in the last day”). The score is also added to CRM contact notes on import.

### Files

- `profile-structured-parser.js` — `parseActivity()`, `calculateActivityScore()`
- `profile-dom-prep.js` — scrolls to Experience only (not Activity; avoids Images tab navigation)
- `sidebar.html` / `sidebar.js` / `sidebar.css` — Activity Score card

## Extension UI refresh (2026-06)

### Summary

Sidebar restyled to match CRM/PM: orange brand (`#F5630F`), elevated cards, gradient logo, circular avatar with ring. Profile photo extracted from LinkedIn top card (`aria-label="Profile photo"` / `topcard-logo-image`).

### Shared tokens

`src/shared/brand-tokens.css` mirrors `packages/config/src/brand/colors.js`. The extension uses vanilla CSS (not React), so it cannot import `@webfudge/ui` directly — card/label patterns mirror `Card` and `SidebarCardTitle` from that package.

### Profile photo

Parsed into `profilePhoto` / `profileImage` fields. Sidebar displays the LinkedIn CDN image with `referrerpolicy="no-referrer"`. Reload extension after update.

## CRM record view UI (2026-06)

### Summary

Existing-contact sidebar (Details / Related / Company / Chats tabs) restyled to match CRM `InfoRow` + elevated `Card` patterns: icon labels, orange accents, metric cards, accordion sections, company hero header.

### Files

- `sidebar.html` — restructured all four tab panels
- `sidebar.css` — CRM record view styles, metrics grid, accordions, list items
- `sidebar.js` — accordion toggles, section count IDs


### Problem

Experience appeared several seconds after other profile fields because DOM prep ran multiple full-page scroll passes (~20s) and several parallel extractions raced each other.

### Fix

- **Faster DOM prep** — jump directly to Experience, expand, skip redundant full-page scrolling when items are already present.
- **No Activity scroll** — DOM prep no longer scrolls into the Activity section (that triggered LinkedIn’s Images/posts tab and caused infinite re-extraction loops).
- **Same-profile URL guard** — `/in/{slug}/recent-activity/*` and other subpaths are ignored by URL watchers; import skips re-extract when `extractionComplete` is already set.
- **Experience loading state** — sidebar shows “Loading experience…” until `extractionComplete` payload arrives.
- **Removed duplicate** `forceDataExtraction()` on sidebar init.

If you previously deployed `xtrawrkx-linkedin-extract-api` on Railway, you can decommission that service. The extension talks only to the Strapi CRM API.
