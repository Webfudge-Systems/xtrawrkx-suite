# Landing Signup — Company Duplicate Check

## Summary

During website signup (Company Information step), the company name field now checks in **real time** against existing **client accounts** in the Xtrawrkx CRM org (registered companies only — lead companies are excluded).

## Scope

- **Backend:** `company-name-similarity.js`, `find-similar-companies.js`, `GET /api/client-accounts/similar-companies`
- **Landing:** `app/api/public/company-suggestions/route.js`, `CompanyNameField.jsx`, `AuthForm.jsx` step 2 validation

## Matching behavior

- Names are normalized (lowercase, punctuation removed, common suffixes like *Agency*, *Inc*, *LLC* stripped).
- Fuzzy scoring combines token overlap, substring match, and edit distance.
- **Exact / high** matches (≥85%): amber warning, list of similar records, **Sign in** link, and checkbox to confirm a different organization before continuing.
- **Exact match** (100% / same normalized name): signup is **blocked** — no checkbox bypass; Continue is disabled and the backend rejects new client account creation.
- **High (non-exact) match**: checkbox confirmation still required before continuing.
- **Possible** matches (60–84%): informational blue panel with suggestions (no checkbox required).

## API

Primary: `GET /api/auth/website/similar-companies?name=Webfudge&limit=5`

Fallback: `GET /api/client-accounts/similar-companies?name=Webfudge&limit=5`

Both must be registered **before** `/client-accounts/:id` in Strapi routes — otherwise `:id` captures `similar-companies` and returns 401.

Headers (production):

- `x-landing-signup-secret`: same as website signup

Landing proxy: `GET /api/public/company-suggestions?name=...` (tries auth path first, then client-accounts path)

## Configuration

Uses the same org resolution as website signup (`WEBSITE_SIGNUP_ORG_ID` / Xtrawrkx org auto-detect) and `LANDING_SIGNUP_SECRET` on backend + landing.

## Usage

No migration required. Restart Strapi after deploy so the new route is registered.
