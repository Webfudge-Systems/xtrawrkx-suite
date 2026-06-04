# @webfudge/ui

Production-ready UI component library for WebFudge Platform.

## 📦 Installation

```bash
npm install @webfudge/ui
# or
yarn add @webfudge/ui
```

## 🏗️ Package Structure

```
@webfudge/ui/
├── components/       # 🎨 Core UI Components (14 components)
│   ├── Button        # Action button
│   ├── Input         # Text input field
│   ├── Select        # Dropdown selector
│   ├── Checkbox      # Checkbox input
│   ├── Textarea      # Multi-line text input
│   ├── Card          # Content container
│   ├── Badge         # Status badge
│   ├── Avatar        # User avatar
│   ├── Table         # Data table
│   ├── Pagination    # Page navigation
│   ├── EmptyState    # Empty placeholder
│   ├── Tabs          # Tabbed interface
│   └── Modal         # Overlay dialog
│
├── layouts/          # 🏗️ Layout Components (2 components)
│   ├── Container     # Responsive container
│   └── PageHeader    # Page header with breadcrumbs
│
├── feedback/         # ⏳ Feedback Components (5 variants)
│   └── LoadingSpinner
│       ├── LoadingSpinner
│       ├── PageLoader
│       ├── SkeletonLoader
│       ├── CardSkeleton
│       └── TableSkeleton
│
└── themes/           # 🎨 Theme Configuration
    ├── colors        # Color palette
    ├── spacing       # Spacing scale
    ├── typography    # Font configuration
    └── shadows       # Shadow definitions
```

## 🎯 Usage Examples

### Import Components

```javascript
// From main export
import { Button, Input, Card } from '@webfudge/ui'

// From specific categories
import { Container, PageHeader } from '@webfudge/ui/layouts'
import { LoadingSpinner } from '@webfudge/ui/feedback'
import { theme, colors } from '@webfudge/ui/themes'

// Individual component imports
import { Button } from '@webfudge/ui/components/Button'
```

### Form Components

```javascript
import { Button, Input, Select, Checkbox, Textarea } from '@webfudge/ui'

function MyForm() {
  return (
    <form>
      {/* Text Input */}
      <Input label="Email" type="email" placeholder="Enter your email" required />

      {/* Dropdown Select */}
      <Select label="Country" options={countries} onChange={setCountry} />

      {/* Checkbox */}
      <Checkbox label="I agree to terms" checked={agreed} onChange={setAgreed} />

      {/* Multi-line Text */}
      <Textarea label="Description" rows={5} placeholder="Enter details" />

      {/* Submit Button */}
      <Button variant="primary" type="submit">
        Submit
      </Button>
    </form>
  )
}
```

### Display Components

```javascript
import { Card, Badge, Avatar, Table, EmptyState } from '@webfudge/ui'

function Dashboard() {
  return (
    <>
      {/* Card Container */}
      <Card title="User Stats" variant="elevated">
        <Badge variant="success">Active</Badge>
        <Avatar src={user.avatar} size="lg" />
      </Card>

      {/* Data Table */}
      <Table columns={columns} data={users} onRowClick={handleRowClick} />

      {/* Empty State */}
      {users.length === 0 && (
        <EmptyState title="No users found" description="Add your first user to get started" />
      )}
    </>
  )
}
```

### Layout Components

```javascript
import { Container, PageHeader } from '@webfudge/ui/layouts'

function Page() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back!"
        breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]}
        showSearch
        onAddClick={handleAdd}
      />

      <Container size="default">{/* Your page content */}</Container>
    </>
  )
}
```

### Feedback Components

```javascript
import { LoadingSpinner, PageLoader, SkeletonLoader } from '@webfudge/ui/feedback'

function LoadingExamples() {
  return (
    <>
      {/* Inline Spinner */}
      {loading && <LoadingSpinner size="md" />}

      {/* Full Page Loader */}
      {loadingPage && <PageLoader message="Loading dashboard..." />}

      {/* Content Skeleton */}
      {!loaded && <SkeletonLoader lines={3} />}
    </>
  )
}
```

### Using Themes

```javascript
import { theme, colors } from '@webfudge/ui/themes'

// Access theme colors
const primaryColor = colors.primary[500]
const successColor = colors.success.DEFAULT

// Use spacing
const padding = theme.spacing.lg

// Apply shadows
const shadow = theme.shadows.md
```

## 🎨 Component Variants

### Button

- **Variants:** `primary`, `secondary`, `outline`, `ghost`, `danger`
- **Sizes:** `sm`, `md`, `lg`

```javascript
<Button variant="primary" size="md">
  Click Me
</Button>
```

### Card

- **Variants:** `default`, `elevated`, `outlined`, `ghost`, `glass`

```javascript
<Card variant="elevated" title="My Card">
  Content
</Card>
```

### Container

- **Sizes:** `sm` (768px), `default` (1280px), `lg` (full width)

```javascript
<Container size="default">Content</Container>
```

### Badge

- **Variants:** `default`, `primary`, `success`, `warning`, `danger`, `info`

```javascript
<Badge variant="success">Active</Badge>
```

## 📚 Import Patterns

### Method 1: Main Export (Recommended)

```javascript
import { Button, Card, Container } from '@webfudge/ui'
```

### Method 2: Category Exports

```javascript
import { Container, PageHeader } from '@webfudge/ui/layouts'
import { LoadingSpinner } from '@webfudge/ui/feedback'
```

### Method 3: Individual Components

```javascript
import { Button } from '@webfudge/ui/components/Button'
```

## 🎯 TypeScript Support

All components include TypeScript definitions:

```typescript
import { Button, type ButtonProps } from '@webfudge/ui';

const MyButton: React.FC<ButtonProps> = (props) => {
  return <Button {...props} />;
};
```

## 🎨 Styling

Components use **Tailwind CSS**. Configure Tailwind to include the UI package:

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './node_modules/@webfudge/ui/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Your custom theme
    },
  },
}
```

## 🔗 Related Packages

- **@webfudge/utils** - Formatting and utility functions
- **@webfudge/auth** - Authentication and RBAC
- **@webfudge/hooks** - Custom React hooks
- **@webfudge/config** - Configuration management

## 📊 Component Overview

| Category       | Count  | Components                                                              |
| -------------- | ------ | ----------------------------------------------------------------------- |
| **Form**       | 5      | Button, Input, Select, Checkbox, Textarea                               |
| **Display**    | 6      | Card, Badge, Avatar, Table, Pagination, EmptyState                      |
| **Navigation** | 2      | Tabs, Modal                                                             |
| **Layout**     | 2      | Container, PageHeader                                                   |
| **Feedback**   | 5      | LoadingSpinner, PageLoader, SkeletonLoader, CardSkeleton, TableSkeleton |
| **Total**      | **20** |                                                                         |

## 🤝 Contributing

When adding new components:

1. Place in appropriate category folder
2. Include PropTypes or TypeScript types
3. Add Tailwind styling
4. Export from category index
5. Update this README

## 📝 License

MIT License - WebFudge Systems

---

**Version:** 0.1.0  
**Status:** ✅ Production Ready  
**Extracted From:** xtrawrkx CRM Portal
