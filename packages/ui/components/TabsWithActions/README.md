# TabsWithActions Component

A powerful, CRM-style tabs component with integrated search, actions, and view toggles. Perfect for data-heavy applications that need filtering, searching, and multiple view options.

## Features

- ✅ **Badge Counts** - Show counts next to each tab
- ✅ **Integrated Search** - Built-in search functionality
- ✅ **Action Buttons** - Add, filter, export, and more
- ✅ **View Toggle** - Switch between list and board views
- ✅ **Glassmorphism** - Beautiful backdrop blur effects
- ✅ **Responsive** - Adapts to mobile and desktop
- ✅ **Customizable** - Control which features to show

## Usage

### Basic Example

```javascript
import { TabsWithActions } from '@webfudge/ui';

function LeadsList() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <TabsWithActions
      tabs={[
        { id: 'all', label: 'All Companies', badge: 1159 },
        { id: 'new', label: 'New', badge: 1156 },
        { id: 'contacted', label: 'Contacted', badge: 3 },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      showSearch={true}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      showAdd={true}
      onAddClick={() => console.log('Add clicked')}
    />
  );
}
```

### Full Featured Example

```javascript
import { TabsWithActions } from '@webfudge/ui';

function CRMLeads() {
  const [activeTab, setActiveTab] = useState('all');
  const [activeView, setActiveView] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <TabsWithActions
      // Tabs configuration
      tabs={[
        { id: 'all', label: 'All Companies', badge: 1159 },
        { id: 'new', label: 'New', badge: 1156 },
        { id: 'contacted', label: 'Contacted', badge: 3 },
        { id: 'qualified', label: 'Qualified', badge: 0 },
        { id: 'lost', label: 'Lost', badge: 0 },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      
      // Search
      showSearch={true}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search leads..."
      
      // Actions
      showAdd={true}
      onAddClick={handleAddLead}
      addTitle="Add New Lead"
      
      showExport={true}
      onExportClick={handleExport}
      exportTitle="Export"
      
      showFilter={true}
      onFilterClick={handleFilterClick}
      filterTitle="Advanced Filters"
      
      showColumnVisibility={true}
      onColumnVisibilityClick={handleColumnToggle}
      columnVisibilityTitle="Show/Hide Columns"
      
      // View toggle
      showViewToggle={true}
      activeView={activeView}
      onViewChange={setActiveView}
      viewOptions={['list', 'board']}
      
      // Styling
      variant="glass"
    />
  );
}
```

## Props

### Tab Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | `Array<Tab>` | **Required** | Array of tab objects |
| `tabs[].id` | `string` | **Required** | Unique tab identifier |
| `tabs[].label` | `string` | **Required** | Tab display label |
| `tabs[].badge` | `number` | - | Optional count badge |
| `activeTab` | `string` | - | Currently active tab ID |
| `onTabChange` | `(tabId: string) => void` | - | Tab change handler |

### Search Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showSearch` | `boolean` | `false` | Show search input |
| `searchQuery` | `string` | `""` | Current search value |
| `onSearchChange` | `(query: string) => void` | - | Search change handler |
| `searchPlaceholder` | `string` | `"Search..."` | Search placeholder text |

### Action Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showAdd` | `boolean` | `false` | Show add button |
| `onAddClick` | `() => void` | - | Add button handler |
| `addTitle` | `string` | `"Add New"` | Add button tooltip |
| `showExport` | `boolean` | `false` | Show export button |
| `onExportClick` | `() => void` | - | Export button handler |
| `exportTitle` | `string` | `"Export"` | Export button text |
| `showFilter` | `boolean` | `false` | Show filter button |
| `onFilterClick` | `() => void` | - | Filter button handler |
| `filterTitle` | `string` | `"Filter"` | Filter button tooltip |
| `showColumnVisibility` | `boolean` | `false` | Show column visibility button |
| `onColumnVisibilityClick` | `() => void` | - | Column visibility handler |
| `columnVisibilityTitle` | `string` | `"Column Visibility"` | Column visibility tooltip |

### View Toggle Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showViewToggle` | `boolean` | `false` | Show view toggle buttons |
| `activeView` | `string` | `"list"` | Current active view |
| `onViewChange` | `(view: string) => void` | - | View change handler |
| `viewOptions` | `Array<string>` | `["list", "board"]` | Available view options |

### Styling Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"glass"` \| `"modern"` \| `"default"` | `"glass"` | Visual style variant |
| `className` | `string` | - | Additional CSS classes |

## Variants

### Glass (Default)
Beautiful glassmorphism design with backdrop blur:
```javascript
<TabsWithActions variant="glass" tabs={tabs} />
```

### Modern
Clean, modern design with subtle shadows:
```javascript
<TabsWithActions variant="modern" tabs={tabs} />
```

### Default
Simple, minimalist design:
```javascript
<TabsWithActions variant="default" tabs={tabs} />
```

## Examples

### CRM Leads List

```javascript
const LeadsPage = () => {
  const [status, setStatus] = useState('all');
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  
  const statuses = [
    { id: 'all', label: 'All', badge: 1159 },
    { id: 'new', label: 'New', badge: 1156 },
    { id: 'contacted', label: 'Contacted', badge: 3 },
    { id: 'qualified', label: 'Qualified', badge: 0 },
    { id: 'lost', label: 'Lost', badge: 0 },
  ];
  
  return (
    <div>
      <TabsWithActions
        tabs={statuses}
        activeTab={status}
        onTabChange={setStatus}
        showSearch
        searchQuery={search}
        onSearchChange={setSearch}
        showAdd
        onAddClick={() => router.push('/leads/new')}
        showViewToggle
        activeView={view}
        onViewChange={setView}
        showExport
        onExportClick={handleExport}
        variant="glass"
      />
      
      {view === 'list' ? (
        <LeadsList status={status} search={search} />
      ) : (
        <LeadsBoard status={status} search={search} />
      )}
    </div>
  );
};
```

### Simple Filter Tabs

```javascript
<TabsWithActions
  tabs={[
    { id: 'active', label: 'Active', badge: 24 },
    { id: 'archived', label: 'Archived', badge: 156 },
  ]}
  activeTab={filter}
  onTabChange={setFilter}
  variant="modern"
/>
```

## Responsive Behavior

- **Desktop**: Full search bar, all action buttons visible with labels
- **Tablet**: Condensed search, icon-only buttons
- **Mobile**: Hide search on small screens, icon-only buttons, horizontal scroll for tabs

## Accessibility

- ✅ Keyboard navigation support
- ✅ ARIA labels on icon buttons
- ✅ Focus indicators
- ✅ Screen reader friendly

## Related Components

- **Tabs** - Simple tab component without actions
- **Table** - Works great with TabsWithActions for filtered lists
- **Modal** - For add/edit forms triggered by action buttons

---

**Status:** ✅ Production Ready  
**Extracted From:** Xtrawrkx CRM Portal
