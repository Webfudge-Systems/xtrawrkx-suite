# Action Buttons Summary - CRM Pages

This document outlines all action buttons available across CRM pages.

## 📍 Lead Companies Page

**Location:** `/apps/crm/app/sales/lead-companies/page.js`

### Header Actions (Top Right)

- **Add** - Create new lead company
- **Filter** - Filter lead companies
- **Import** - Import lead companies from file
- **Export** - Export lead companies data

### Tabs Actions (Right Side)

- **Search** - Search lead companies by name, email, contact
- **Add (+)** - Quick add new lead company
- **Filter (🔍)** - Advanced filtering options
- **Column Visibility (👁️)** - Show/hide table columns
- **Export** - Export filtered data

### Tab Filters (Left Side)

- All Companies
- New
- Contacted
- Qualified
- Lost

### Row Actions (In Table)

- **Phone Icon** - Mark as Contacted
- **Check Icon** - Mark as Qualified
- **Trash Icon** - Delete company

---

## 💼 Deals Page

**Location:** `/apps/crm/app/sales/deals/page.js`

### Header Actions (Top Right)

- **Add** - Create new deal
- **Filter** - Filter deals
- **Import** - Import deals from file
- **Export** - Export deals data

### Tabs Actions (Right Side)

- **Search** - Search deals by name, company, client
- **Add (+)** - Quick add new deal
- **Filter (🔍)** - Advanced filtering options
- **Column Visibility (👁️)** - Show/hide table columns
- **Export** - Export filtered data

### Tab Filters (Left Side)

- All Deals
- Prospect
- Proposal
- Negotiation
- Won
- Lost

### Additional Actions

- **View Pipeline** - Switch to pipeline view (Kanban board)

---

## 👥 Contacts Page

**Location:** `/apps/crm/app/sales/contacts/page.js`

### Header Actions (Top Right)

- **Add** - Create new contact
- **Filter** - Filter contacts
- **Import** - Import contacts from file
- **Export** - Export contacts data

### Tabs Actions (Right Side)

- **Search** - Search contacts by name, email, company
- **Add (+)** - Quick add new contact
- **Filter (🔍)** - Advanced filtering options
- **Column Visibility (👁️)** - Show/hide table columns
- **Export** - Export filtered data

### Tab Filters (Left Side)

- All Contacts
- With Email
- With Phone
- With Company

---

## 🏢 Client Accounts Page

**Location:** `/apps/crm/app/clients/accounts/page.js`

### Header Actions (Top Right)

- **Add** - Create new client account
- **Filter** - Filter client accounts
- **Import** - Import client accounts from file
- **Export** - Export client accounts data

### Tabs Actions (Right Side)

- **Search** - Search client accounts by name, email
- **Add (+)** - Quick add new client account
- **Filter (🔍)** - Advanced filtering options
- **Column Visibility (👁️)** - Show/hide table columns
- **Export** - Export filtered data

### Tab Filters (Left Side)

- All Clients
- Active
- Inactive

---

## 🎯 Action Button Types

### Primary Actions

1. **Add/Create** - Available in both header and tabs
   - Header: Dropdown with options
   - Tabs: Quick add button

2. **Search** - Only in tabs section
   - Real-time filtering
   - Searches across multiple fields

3. **Filter** - Available in both locations
   - Advanced filtering options
   - Multiple criteria support

4. **Export** - Available in both locations
   - CSV format
   - Includes filtered results

5. **Import** - Only in header
   - Bulk data upload
   - CSV/Excel support

### Secondary Actions

6. **Column Visibility** - Only in tabs
   - Show/hide columns
   - Customize table view

7. **View Toggle** (Deals page only)
   - List view
   - Pipeline/Board view

### Row Actions (In-table)

- **Edit** - Click row to edit
- **Status Update** - Quick status change buttons
- **Delete** - Remove item (with confirmation)

---

## 🎨 Button Styles

### Header Actions

```jsx
<div className="flex items-center gap-3">
  <Button variant="primary" icon={Plus}>
    Add
  </Button>
  <Button variant="outline" icon={Filter}>
    Filter
  </Button>
  <Button variant="outline" icon={Upload}>
    Import
  </Button>
  <Button variant="outline" icon={Download}>
    Export
  </Button>
</div>
```

### Tabs Actions

```jsx
<TabsWithActions
  showSearch={true}
  showAdd={true}
  showFilter={true}
  showColumnVisibility={true}
  showExport={true}
/>
```

---

## 🔄 Action States

### Enabled States

- Default: Fully clickable
- Hover: Background change + shadow
- Active: Pressed state

### Disabled States

- Loading: Show spinner
- No Data: Gray out export
- No Permission: Hide button

---

## 📱 Responsive Behavior

### Desktop (> 1024px)

- All buttons visible
- Full labels shown
- Tooltips on hover

### Tablet (768px - 1024px)

- Icons only for some buttons
- Dropdown for secondary actions
- Tooltips always visible

### Mobile (< 768px)

- Collapsed to menu button
- Drawer with all actions
- Priority actions shown

---

## ♿ Accessibility

### Keyboard Navigation

- Tab to focus buttons
- Enter/Space to activate
- Escape to cancel actions

### Screen Readers

- Proper ARIA labels
- Button role announcements
- Action confirmation messages

### Visual

- High contrast mode support
- Focus indicators
- Loading state announcements

---

## 🧪 Testing Checklist

- [ ] Add button creates new item
- [ ] Search filters results in real-time
- [ ] Filter opens filter panel
- [ ] Export downloads CSV file
- [ ] Import opens upload dialog
- [ ] Column visibility toggles columns
- [ ] Tab filters update results
- [ ] Row actions work correctly
- [ ] Responsive layout adapts properly
- [ ] Keyboard navigation works
- [ ] Screen reader announces actions

---

## 🔮 Future Enhancements

1. **Bulk Actions**
   - Select multiple items
   - Bulk edit/delete/export
   - Bulk status update

2. **Advanced Filters**
   - Saved filter presets
   - Custom filter builder
   - Filter by date range

3. **Custom Views**
   - Save column layout
   - Custom sorting
   - Personalized defaults

4. **Action History**
   - Track user actions
   - Undo/Redo support
   - Audit trail

5. **Quick Actions**
   - Keyboard shortcuts
   - Command palette (Cmd+K)
   - Context menu (right-click)
