# Proposal Builder Feature

## Summary
Added a full-featured Proposal / SOW Builder at `/clients/proposals/new`. Users fill a multi-section form and the data is transformed into a professionally styled proposal document that can be previewed in-app and downloaded as a PDF.

**Upload mode:** A header toggle lets users switch to **Upload PDF** — a shorter form (proposal info, client details, PDF file) that stores the document on Strapi and links it to the proposal record (`creationMode: UPLOAD`, `proposalFile` media).

## Scope
- **App:** `apps/crm`
- **New file:** `apps/crm/app/clients/proposals/new/page.js`
- **Existing page updated (navigation):** `apps/crm/app/clients/proposals/page.js` (already had the "Create Proposal" button routing to `/clients/proposals/new`)

## Form Sections

| # | Section | Fields |
|---|---------|--------|
| 1 | Proposal Information | Document type (SOW/Proposal/Quote), title, doc number, date, valid until, currency |
| 2 | Client Details | Company name, contact person, email, phone, address |
| 3 | Prepared By | Your company name, contact name, email, phone |
| 4 | Project Information | Project name, project overview |
| 5 | Scope of Work — Modules | Dynamic modules: name, price, deliverables, acceptance criteria |
| 6 | Timeline & Milestones | Estimated timeline, dynamic milestones with payment % (auto-computes amounts) |
| 7 | Billing & Change Control | Out-of-scope rate, rate unit, warranty days, payment terms, tax/GST info |
| 8 | Assumptions | Dynamic list |
| 9 | Security & Compliance | Dynamic list (pre-filled with sensible defaults) |
| 10 | Deliverables at Handover | Dynamic list (pre-filled with common deliverables) |
| 11 | Out of Scope | Dynamic list |
| 12 | Acceptance & Next Steps | Custom notes (falls back to standard template) |

## Features

### Proposal Preview
- **"Preview Proposal" button** opens a modal showing the professionally styled document (matching the SOW PDF structure from the reference)
- Document includes: branded header with gradient, client/prepared-by info, all sections with numbered headings, pricing table, milestone payment table

### PDF Download
- Implemented using `html2canvas` + `jspdf` (both already in `package.json`)
- Dynamic import for code-splitting (loads only on demand)
- Multi-page PDF support — long proposals automatically span multiple A4 pages
- Filename: `{proposalNumber}-{clientName}.pdf`

### Computed Values
- **Total module value** auto-calculated and shown in form as a live banner
- **Milestone amounts** auto-computed from payment % × total value
- **Milestone % warning** shown when milestone percentages don't sum to 100%
- **Number-to-words** converter for Indian numbering (lakh/crore) appended under total

### Validation
- Required: Client Company Name, Project Name, Client Email, at least one named module
- Error banner at top of form on submit or preview
- Individual field error messages inline

## Usage

1. Navigate to **Clients → Proposals → New Proposal** (or click "Create Proposal" from the proposals list)
2. Fill in each section — only a few fields are required
3. Click **"Preview Proposal"** to see the formatted document
4. In the preview modal, click **"Download PDF"** to save the PDF
5. Click **"Save Proposal"** to save and return to the proposals list
