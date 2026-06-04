# Landing Page — Industries & Why Choose Us Update

## Summary

Extended the landing page with a new **Industries We Serve** section and expanded the **Why Choose Us** (FeatureShowcase) from 4 cards to 6 to fully reflect the brand positioning for Webfudge Systems. Fixed broken Navbar links that pointed to non-existent page sections.

## Scope

- `apps/landing/components/sections/home/Navbar.tsx`
- `apps/landing/components/sections/home/FeatureShowcase.tsx`
- `apps/landing/components/sections/home/FAQSection.tsx`
- `apps/landing/components/sections/home/IndustriesSection.tsx` *(new)*
- `apps/landing/components/sections/home/index.ts`
- `apps/landing/app/page.js`

---

## Details

### 1. Navbar — Fixed dead links

**Before:**
```
Home | Services | Solutions | Projects | About | Process | Contact
```
`#projects` and `#process` had no corresponding sections on the home page, causing broken anchor navigation.

**After:**
```
Home | Services | Solutions | About | Industries | Contact
```
- Removed `Projects` (no section exists) and `Process` (section exists but not rendered on home).
- Added `Industries` linking to the new `#industries` section.

---

### 2. FeatureShowcase — Why Choose Us expanded to 6 items

Added two new scroll-stacking cards to cover all 6 brand differentiators:

| # | Eyebrow | Title |
|---|---------|-------|
| 01 | Scalability | Scalable & Secure Architecture |
| 02 | Usability | Easy to Use, Every Time |
| 03 | Affordability | Affordable Solutions for Every Business |
| 04 | Long-term Support | Built to Last, Supported Always |
| 05 | UI/UX Design | **Modern UI/UX Focused Platforms** *(new)* |
| 06 | Business Focus | **Built Around Your Business** *(new)* |

The section height automatically adjusts (`n * 100vh`) so scrolling behaviour stays consistent.

---

### 3. FAQSection — Added `id="faq"`

Added `id="faq"` to the `<section>` element so future nav links (e.g. `href="#faq"`) resolve correctly.

---

### 4. IndustriesSection — New section

New component at `components/sections/home/IndustriesSection.tsx`:
- Section anchor: `id="industries"`
- Light gray background (`#f8f8f8`) for visual contrast after the FeatureShowcase
- `SectionHeader` with eyebrow "Industries We Serve"
- 4×2 responsive card grid (2 cols mobile, 4 cols desktop)
- 8 industries: Startups, Agencies, Ecommerce, Healthcare, Education, Logistics, Real Estate, Service Businesses
- Each card: Lucide icon, industry name, brief description
- Hover animation: card lifts, icon fills orange, accent underline animates in
- CTA button at bottom: "Discuss Your Requirements" → `#contact`

---

### 5. Page order

```
Navbar → Hero → Solutions (About) → Services → Stats → FeatureShowcase (Why Us)
→ IndustriesSection ← NEW
→ Testimonials → FAQ → CTA → Contact → Footer
```

---

## Usage / Migration

No breaking changes. The new section is additive. Existing anchor links remain functional. The `index.ts` barrel export was updated — any code importing from `components/sections/home` can now also import `IndustriesSection`.
