# Badge Component

CRM-style status badges with soft backgrounds and borders.

## Features

- ✅ 20+ predefined variants
- ✅ Status-specific colors (NEW, Active, Pending, etc.)
- ✅ Soft backgrounds with borders
- ✅ Optional dot indicator
- ✅ 3 size options
- ✅ Font: Host Grotesk (CRM standard)

## Usage

### Basic Badge

```jsx
import { Badge } from '@webfudge/ui';

<Badge>Default</Badge>
<Badge variant="new">NEW</Badge>
<Badge variant="success">Success</Badge>
```

### All Variants

```jsx
// Basic Colors
<Badge variant="default">Default</Badge>
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Danger</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="orange">Orange</Badge>
<Badge variant="purple">Purple</Badge>
<Badge variant="pink">Pink</Badge>
<Badge variant="gray">Gray</Badge>

// Status Badges
<Badge variant="new">NEW</Badge>
<Badge variant="active">Active</Badge>
<Badge variant="pending">Pending</Badge>
<Badge variant="completed">Completed</Badge>
<Badge variant="cancelled">Cancelled</Badge>
<Badge variant="qualified">Qualified</Badge>
<Badge variant="contacted">Contacted</Badge>
<Badge variant="lost">Lost</Badge>
```

### Sizes

```jsx
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>
```

### With Dot Indicator

```jsx
<Badge dot>With Dot</Badge>
<Badge variant="success" dot>Active</Badge>
<Badge variant="warning" dot>Pending</Badge>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | `'default'` | Badge color variant |
| `size` | string | `'md'` | Badge size (sm, md, lg) |
| `dot` | boolean | `false` | Show dot indicator |
| `className` | string | - | Additional CSS classes |
| `children` | node | - | Badge content |

## Variants

### Basic Colors
- `default` - Gray badge
- `primary` - Blue badge
- `success` - Green badge
- `warning` - Amber badge
- `danger`/`error` - Red badge
- `info` - Blue badge
- `orange` - Orange badge
- `purple` - Purple badge
- `pink` - Pink badge
- `gray` - Gray badge

### Status Badges
- `new` - Blue (for new items)
- `active` - Green (for active status)
- `pending` - Amber (for pending items)
- `completed` - Green (for completed items)
- `cancelled` - Red (for cancelled items)
- `qualified` - Purple (for qualified leads)
- `contacted` - Blue (for contacted status)
- `lost` - Gray (for lost opportunities)

## Color Scheme

All badges follow the CRM design pattern:
```css
bg-{color}-50 text-{color}-700 border border-{color}-200
```

Examples:
- **NEW Badge**: `bg-blue-50 text-blue-700 border-blue-200`
- **Active**: `bg-green-50 text-green-700 border-green-200`
- **Pending**: `bg-amber-50 text-amber-700 border-amber-200`

## Typography

Uses **Host Grotesk** font (CRM standard):
- Font weight: 600 (semibold)
- Letter spacing: 0.025em (tracking-wide)
- Text transform: uppercase (optional via className)

## Examples

### Lead Status

```jsx
<Badge variant="new">NEW</Badge>
<Badge variant="contacted">CONTACTED</Badge>
<Badge variant="qualified">QUALIFIED</Badge>
<Badge variant="lost">LOST</Badge>
```

### Deal Status

```jsx
<Badge variant="pending" dot>Pending</Badge>
<Badge variant="active" dot>Active</Badge>
<Badge variant="completed" dot>Won</Badge>
<Badge variant="cancelled" dot>Lost</Badge>
```

### Task Priority

```jsx
<Badge variant="danger" size="sm">High</Badge>
<Badge variant="warning" size="sm">Medium</Badge>
<Badge variant="success" size="sm">Low</Badge>
```

### Count Badges

```jsx
<Badge variant="primary" size="sm">24</Badge>
<Badge variant="orange" size="sm">156</Badge>
<Badge variant="gray" size="sm">0</Badge>
```

## Custom Styling

You can add custom classes:

```jsx
<Badge variant="new" className="uppercase">
  NEW
</Badge>

<Badge variant="success" className="font-bold">
  Active
</Badge>
```

## Accessibility

- Uses semantic HTML (`<span>`)
- Good color contrast ratios
- Screen reader friendly

---

**Based on:** Xtrawrkx CRM Design  
**Font:** Host Grotesk  
**Status:** ✅ Production Ready
