# Landing Page Mobile Responsive Update

## Summary
Improved mobile responsiveness across the landing home page to eliminate horizontal overflow, cramped layouts, and unusable sticky/stacked sections on small screens.

## Scope
- `apps/landing/app/page.js`, `layout.js`, `globals.css`
- Home sections: Navbar, Hero, Solutions, Services, Stats, FeatureShowcase, Industries, Testimonials, FAQ, CTA, Contact, Footer, ClientLogoStrip
- Shared UI: `SectionHeader.tsx`

## Details

### Global
- `overflow-x: clip` on `html`, `body`, and `<main>` to prevent sideways scroll from decorative elements.
- Section headings scale down on small viewports via updated `SectionHeader` size tokens.

### Section-specific
- **Hero**: Smaller clamp typography, stacked full-width CTAs on mobile.
- **Solutions**: Single column on mobile; stagger offsets only from `lg`; flexible card heights.
- **Services**: Sticky card stack disabled below `lg`; reduced padding and vertical gap on mobile.
- **Feature showcase**: Shorter scroll track (`70vh` per card) and sticky viewport on mobile; responsive content padding.
- **Stats / Industries / FAQ / CTA / Contact**: Tighter padding, responsive grids, readable type sizes.
- **Testimonials**: Cards use `min()` width; smaller quote text; narrower marquee fade masks on mobile.
- **Footer**: Removed `whitespace-nowrap`; WEBFUDGE wordmark uses `clamp()` instead of fixed `280px`.
- **Navbar**: Body scroll lock when mobile menu open; scrollable menu panel.

## Usage / Migration
No config changes. Run the landing app and verify at 320px–768px widths:

```bash
npm run dev --workspace=apps/landing
```

Test hamburger menu, horizontal scroll (should be none), and tap targets on forms/CTAs.
