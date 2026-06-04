# Lead company detail — Add Contact modal

## Summary

On the lead company detail page **Contacts** tab, users can add a linked contact without leaving the page. An **Add Contact** button (orange–pink gradient) sits beside the results count; it opens a modal form aligned with the CRM add-contact pattern.

## Scope

- **App:** `apps/crm`
- **File:** `app/sales/lead-companies/[id]/page.js`

## Behavior

- **Fields:** First name, last name, email (required); phone, job title, department; role dropdown (includes primary, technical, decision maker, influencer, contact, gatekeeper).
- **API:** `contactService.create` with `leadCompany` set to the current lead, `source: LEAD_COMPANY`, `companyName` from the lead, `assignedTo` from the lead owner when present, and `isPrimaryContact` when role is `PRIMARY_CONTACT`.
- **After save:** Contacts list is refreshed via `loadLinkedContacts(true)`; modal closes and resets.
- **Empty state:** Primary action opens the same modal; secondary link opens the company editor.

## Refactor

Contact loading for the tab is centralized in `loadLinkedContacts` (optional loading spinner) so the list can be refreshed after creating a contact.
