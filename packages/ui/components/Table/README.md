# Table Component

A modern, flexible table component with multiple style variants for displaying tabular data.

## Features

- Multiple style variants (default, modern, compact)
- Responsive design with horizontal scrolling
- Customizable columns with render functions
- Optional drag-to-resize column widths (`resizableColumns`)
- Row click handlers
- Hover states and transitions
- Clean, professional appearance
- Fully accessible

## Usage

```jsx
import { Table } from '@webfudge/ui'

const columns = [
  {
    key: 'name',
    label: 'NAME',
    render: (value, row) => <span className="font-medium">{value}</span>,
  },
  {
    key: 'email',
    label: 'EMAIL',
  },
  {
    key: 'status',
    label: 'STATUS',
    render: (value) => <Badge variant={value}>{value}</Badge>,
  },
]

const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
]

function MyComponent() {
  return (
    <Table
      columns={columns}
      data={data}
      keyField="id"
      variant="modern"
      onRowClick={(row) => console.log('Clicked:', row)}
    />
  )
}
```

## Props

| Prop              | Type       | Default     | Description                                      |
| ----------------- | ---------- | ----------- | ------------------------------------------------ |
| `columns`         | `Array`    | `[]`        | Array of column definitions                      |
| `data`            | `Array`    | `[]`        | Array of data rows                               |
| `keyField`        | `string`   | `'id'`      | Field to use as unique key for rows              |
| `variant`         | `string`   | `'default'` | Style variant: 'default', 'modern', or 'compact' |
| `onRowClick`      | `function` | `undefined` | Callback when row is clicked                     |
| `className`       | `string`   | `''`        | Additional CSS classes for table                 |
| `headerClassName` | `string`   | `''`        | Additional CSS classes for header                |
| `bodyClassName`   | `string`   | `''`        | Additional CSS classes for body                  |
| `rowClassName`    | `string`   | `''`        | Additional CSS classes for rows                  |
| `resizableColumns` | `boolean` | `false`     | Show resize handles on column header edges       |
| `columnWidths`    | `object`   | `{}`        | Pixel widths keyed by column `key`               |
| `onColumnWidthsChange` | `function` | `undefined` | Called when a column is resized              |
| `minColumnWidth`  | `number`   | `72`        | Minimum width in pixels when resizing            |

## Column Definition

Each column object supports the following properties:

```typescript
{
  key: string;              // Data field key
  label: string;            // Column header text
  title?: string;           // Alternative to label
  width?: string;           // Fixed column width (e.g., '200px')
  defaultWidth?: string;    // Reset target on header resize-handle double-click
  minWidth?: number;        // Per-column minimum when resizing (pixels)
  resizable?: boolean;      // Set false to disable resize for this column
  render?: (value, row, rowIndex) => ReactNode;  // Custom render function
  className?: string;       // Cell CSS classes
  headerClassName?: string; // Header cell CSS classes
}
```

## Variants

### Default

Clean, minimal styling with subtle borders and hover effects.

```jsx
<Table columns={columns} data={data} variant="default" />
```

**Features:**

- Gray background header
- White background body
- Light gray borders
- Subtle hover effect

### Modern (Recommended for CRM)

Professional, polished look with rounded borders and enhanced hover states.

```jsx
<Table columns={columns} data={data} variant="modern" />
```

**Features:**

- Rounded container with border
- Bold headers
- Blue-tinted hover effect
- Enhanced visual hierarchy
- Perfect for CRM interfaces

### Compact

Space-efficient design with reduced padding.

```jsx
<Table columns={columns} data={data} variant="compact" />
```

**Features:**

- Reduced padding
- No container border
- Thicker header border
- Ideal for dashboards with limited space

## Examples

### Basic Table

```jsx
<Table
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
  ]}
  data={[
    { id: 1, name: 'John', email: 'john@example.com' },
    { id: 2, name: 'Jane', email: 'jane@example.com' },
  ]}
/>
```

### With Custom Rendering

```jsx
const columns = [
  {
    key: 'user',
    label: 'USER',
    render: (_, row) => (
      <div className="flex items-center gap-3">
        <Avatar src={row.avatar} fallback={row.name[0]} />
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'role',
    label: 'ROLE',
    render: (value) => <Badge>{value}</Badge>,
  },
]

;<Table columns={columns} data={users} variant="modern" />
```

### With Row Click

```jsx
<Table
  columns={columns}
  data={data}
  onRowClick={(row) => router.push(`/users/${row.id}`)}
  variant="modern"
/>
```

### With Fixed Column Widths

```jsx
const columns = [
  { key: 'name', label: 'Name', width: '200px' },
  { key: 'email', label: 'Email', width: '250px' },
  { key: 'status', label: 'Status', width: '100px' },
]

;<Table columns={columns} data={data} />
```

### In a Card Container

```jsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <Table columns={columns} data={data} variant="modern" />

  {/* Pagination */}
  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
  </div>
</div>
```

## Styling

### Custom Header Styling

```jsx
<Table columns={columns} data={data} headerClassName="bg-blue-50" />
```

### Custom Row Styling

```jsx
<Table
  columns={columns}
  data={data}
  rowClassName={(row) => (row.status === 'urgent' ? 'bg-red-50' : '')}
/>
```

### Custom Cell Styling

```jsx
const columns = [
  {
    key: 'amount',
    label: 'Amount',
    className: 'text-right font-bold',
    render: (value) => formatCurrency(value),
  },
]
```

## Accessibility

The table component follows accessibility best practices:

- Semantic HTML table structure
- Proper table headers with scope
- Keyboard navigation support (when onRowClick is provided)
- Screen reader friendly
- Focus indicators for interactive rows

## Performance

For large datasets:

1. **Use pagination** - Don't render thousands of rows at once
2. **Memoize render functions** - Avoid re-renders
3. **Virtual scrolling** - For extremely large lists (use a library like react-virtual)

```jsx
// Example with pagination
const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

;<Table columns={columns} data={paginatedData} />
```

## Integration with Other Components

### With Loading State

```jsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  {loading ? (
    <div className="p-12 flex justify-center">
      <LoadingSpinner size="lg" />
    </div>
  ) : (
    <Table columns={columns} data={data} variant="modern" />
  )}
</div>
```

### With Empty State

```jsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  {data.length === 0 ? (
    <EmptyState title="No data found" description="Get started by adding your first item" />
  ) : (
    <Table columns={columns} data={data} variant="modern" />
  )}
</div>
```

## Best Practices

1. **Use meaningful labels** - Keep headers clear and concise
2. **Consistent column widths** - Fixed widths for predictable layouts
3. **Render functions for complex cells** - Custom formatting and components
4. **Provide loading states** - Better user experience
5. **Add empty states** - Guide users when no data
6. **Enable sorting** - For better data exploration
7. **Use appropriate variant** - Match your design system
8. **Keyboard accessibility** - Allow keyboard navigation for clickable rows

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Migration from Old Table

If you're migrating from the old table component:

**Before:**

```jsx
<Card variant="elevated" className="overflow-hidden">
  <Table columns={columns} data={data} />
</Card>
```

**After:**

```jsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <Table columns={columns} data={data} variant="modern" />
</div>
```
