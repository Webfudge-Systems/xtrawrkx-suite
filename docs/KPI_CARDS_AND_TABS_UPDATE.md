# KPI Cards and Tabs Update Summary

## Overview

Updated all CRM pages to use the new reusable KPICard component and enhanced TabsWithActions functionality with proper filtering.

## Component Created

### KPICard Component

**Location:** `packages/ui/components/KPICard/`

**Features:**

- Reusable card component for displaying key performance indicators
- Icon on the right side with rounded background
- Support for both subtitle and change/trend indicators
- 8 color schemes: orange, yellow, green, red, blue, purple, emerald, indigo
- Optional click handler for interactive cards
- Responsive design matching CRM style

**Props:**

- `title` - The title/label for the KPI
- `value` - The main value to display
- `subtitle` - Optional subtitle text (e.g., "5 deals", "No items")
- `change` - Optional change/trend indicator (e.g., "+12%", "-5%")
- `changeType` - Type of change: 'increase' or 'decrease' (affects color)
- `icon` - Icon component to display
- `colorScheme` - Color scheme selection
- `onClick` - Optional click handler
- `className` - Additional CSS classes

## Component Updated

### TabsWithActions Component

**Location:** `packages/ui/components/TabsWithActions/`

**Enhancement:**

- Fixed to accept both `id` and `key` props for backward compatibility
- Proper handling of tab identification across all pages

## Pages Updated

### 1. Dashboard (`apps/crm/app/page.js`)

**KPI Cards:**

- Total Leads (Blue) - with trend indicator
- Pipeline Value (Green) - with trend indicator
- Conversion Rate (Purple) - with trend indicator
- Active Deals (Orange) - with trend indicator

**Tabs:** N/A (Dashboard doesn't use filtering tabs)

---

### 2. Deals Page (`apps/crm/app/sales/deals/page.js`)

**KPI Cards:**

- New Deals (Orange)
- Contacted Deals (Yellow)
- Qualified Deals (Green)
- Lost Deals (Red)

**Tabs:**

- All Deals
- Prospect
- Proposal
- Negotiation
- Won
- Lost

**Filtering:** Tabs filter deals by stage status

---

### 3. Lead Companies Page (`apps/crm/app/sales/lead-companies/page.js`)

**KPI Cards:**

- New Leads (Orange)
- Contacted Leads (Yellow)
- Qualified Leads (Green)
- Lost Leads (Red)

**Tabs:**

- All Companies
- New
- Contacted
- Qualified
- Lost

**Filtering:** Tabs filter companies by status

---

### 4. Contacts Page (`apps/crm/app/sales/contacts/page.js`)

**KPI Cards:**

- Total Contacts (Blue)
- With Email (Green) - shows percentage
- With Phone (Purple) - shows percentage
- With Company (Orange) - shows percentage

**Tabs:**

- All Contacts
- With Email
- With Phone
- With Company

**Filtering:** Tabs filter contacts by data completeness

---

### 5. Client Accounts Page (`apps/crm/app/clients/accounts/page.js`)

**KPI Cards:**

- Total Clients (Blue)
- Active Clients (Green)
- Inactive Clients (Red)

**Tabs:**

- All Clients
- Active
- Inactive

**Filtering:** Tabs filter accounts by status

---

## Design Consistency

All KPI cards now follow the same design pattern:

- Icon positioned on the right
- Rounded square background (rounded-2xl)
- Large bold value (text-4xl)
- Colored status dot with subtitle or trend
- Elevated card variant with hover effects
- Consistent spacing and padding

## Tab Functionality

All tabs now:

- Show count badges in orange/white styling
- Filter data based on selected tab
- Update results count dynamically
- Reset pagination when changing tabs
- Maintain consistent orange active state
- Use glass morphism design

## Benefits

✅ **Consistency** - Unified design across all CRM pages
✅ **Maintainability** - Single component to update
✅ **Reusability** - Can be used in any new pages
✅ **Performance** - Optimized filtering logic
✅ **User Experience** - Clear visual feedback and filtering
✅ **Accessibility** - Proper semantic HTML and keyboard support

## Files Modified

1. `packages/ui/components/KPICard/KPICard.jsx` - Created
2. `packages/ui/components/KPICard/index.js` - Created
3. `packages/ui/components/KPICard/README.md` - Created
4. `packages/ui/components/index.js` - Added KPICard export
5. `packages/ui/src/index.js` - Added KPICard export
6. `packages/ui/components/TabsWithActions/TabsWithActions.jsx` - Fixed id/key handling
7. `apps/crm/app/page.js` - Updated to use KPICard
8. `apps/crm/app/sales/deals/page.js` - Updated to use KPICard
9. `apps/crm/app/sales/lead-companies/page.js` - Updated to use KPICard
10. `apps/crm/app/sales/contacts/page.js` - Updated to use KPICard and added tabs
11. `apps/crm/app/clients/accounts/page.js` - Updated to use KPICard

## Testing Checklist

- [ ] Dashboard displays KPI cards with trend indicators
- [ ] Deals page tabs filter correctly (All, Prospect, Proposal, etc.)
- [ ] Lead Companies page tabs filter correctly (All, New, Contacted, etc.)
- [ ] Contacts page tabs filter correctly (All, With Email, etc.)
- [ ] Client Accounts page tabs filter correctly (All, Active, Inactive)
- [ ] KPI cards display correct counts
- [ ] Clicking tabs updates filtered results
- [ ] Results count updates when switching tabs
- [ ] Pagination resets when changing tabs
- [ ] Search works in combination with tab filters
- [ ] All color schemes render correctly
- [ ] Responsive design works on mobile/tablet/desktop

## Future Enhancements

- Add animations for tab transitions
- Add export/filter functionality to tabs
- Add ability to customize tab colors per page
- Add keyboard shortcuts for tab navigation
- Add tab presets/saved filters

---

## PM Dashboard Update: Orange Inside Icons

### What changed
`KPICard` now supports an `iconColorScheme` prop that overrides ONLY the inner icon color, while preserving the `colorScheme`-driven icon background and status dot color.

### Why
The PM dashboard KPI cards need the same colored backgrounds/dots as the status (To Do/In Progress/Done/Overdue), but with orange icons inside (per the reference design).

### Usage
- In `apps/pm/app/page.js`, the cards now use `colorSchemes = ['blue', 'yellow', 'green', 'red']`
- And each KPI card sets `iconColorScheme="orange"` to force orange inner icons
