# KPICard Component

A reusable card component for displaying key performance indicators (KPIs) with an icon, title, value, and optional subtitle.

## Features

- Clean, modern design with icon on the right
- Support for 8 color schemes
- Optional click handler for interactive cards
- Responsive and accessible
- Consistent with design system

## Usage

```jsx
import { KPICard } from '@webfudge/ui'
import { Briefcase } from 'lucide-react'

function Dashboard() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Total Sales"
        value={1234}
        subtitle="5 new today"
        icon={Briefcase}
        colorScheme="orange"
      />
    </div>
  )
}
```

## Props

| Prop          | Type                 | Default      | Description                                                                             |
| ------------- | -------------------- | ------------ | --------------------------------------------------------------------------------------- |
| `title`       | `string`             | required     | The title/label for the KPI                                                             |
| `value`       | `number` \| `string` | required     | The main value to display                                                               |
| `subtitle`    | `string`             | `undefined`  | Optional subtitle text (e.g., "5 deals", "No items")                                    |
| `change`      | `string`             | `undefined`  | Optional change/trend indicator (e.g., "+12%", "-5%")                                   |
| `changeType`  | `string`             | `'increase'` | Type of change: 'increase' or 'decrease' (affects color)                                |
| `icon`        | `React.Component`    | `undefined`  | Icon component to display (from lucide-react or similar)                                |
| `colorScheme` | `string`             | `'blue'`     | Color scheme: 'orange', 'yellow', 'green', 'red', 'blue', 'purple', 'emerald', 'indigo' |
| `iconColorScheme` | `string`        | `'orange'`   | Override for the inner icon color scheme (background dot remains driven by `colorScheme`) |
| `onClick`     | `function`           | `undefined`  | Optional click handler for the card                                                     |
| `className`   | `string`             | `''`         | Optional additional CSS classes                                                         |

**Note:** You can use either `subtitle` or `change`/`changeType`, but not both. If `change` is provided, it will be displayed instead of `subtitle`.

## Color Schemes

Available color schemes:

- `orange` - Orange accent with light background
- `yellow` - Yellow accent with light background
- `green` - Green accent with light background
- `red` - Red accent with light background
- `blue` - Blue accent with light background (default)
- `purple` - Purple accent with light background
- `emerald` - Emerald accent with light background
- `indigo` - Indigo accent with light background

## Examples

### Basic Usage

```jsx
<KPICard
  title="New Leads"
  value={42}
  subtitle="10 new this week"
  icon={Users}
  colorScheme="green"
/>
```

### With Click Handler

```jsx
<KPICard
  title="Active Deals"
  value={15}
  subtitle="3 closing soon"
  icon={Briefcase}
  colorScheme="blue"
  onClick={() => router.push('/deals')}
/>
```

### With Change/Trend Indicator

```jsx
<KPICard
  title="Total Leads"
  value={1234}
  change="+12%"
  changeType="increase"
  icon={Users}
  colorScheme="blue"
/>
```

### Without Icon

```jsx
<KPICard title="Revenue" value="$125,000" subtitle="Up 12% from last month" colorScheme="emerald" />
```

### Grid Layout

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <KPICard title="Metric 1" value={100} icon={Icon1} colorScheme="orange" />
  <KPICard title="Metric 2" value={200} icon={Icon2} colorScheme="yellow" />
  <KPICard title="Metric 3" value={300} icon={Icon3} colorScheme="green" />
  <KPICard title="Metric 4" value={400} icon={Icon4} colorScheme="red" />
</div>
```

## Accessibility

- Semantic HTML structure
- Proper color contrast ratios
- Hover states for interactive cards
- Keyboard accessible when onClick is provided

## Styling

The component uses Tailwind CSS and follows the Webfudge design system. It automatically applies:

- Elevated card variant with shadow
- Responsive padding
- Hover effects for interactive cards
- Color-coordinated backgrounds and icons
