# @webfudge/ui - Package Structure

## 📂 Directory Organization

```
@webfudge/ui/
│
├── 📦 components/              # Core UI Components (14)
│   ├── Avatar/
│   │   ├── Avatar.jsx
│   │   └── index.js
│   ├── Badge/
│   │   ├── Badge.jsx
│   │   └── index.js
│   ├── Button/
│   │   ├── Button.jsx
│   │   └── index.js
│   ├── Card/
│   │   ├── Card.jsx
│   │   └── index.js
│   ├── Checkbox/
│   │   ├── Checkbox.jsx
│   │   └── index.js
│   ├── EmptyState/
│   │   ├── EmptyState.jsx
│   │   └── index.js
│   ├── Input/
│   │   ├── Input.jsx
│   │   └── index.js
│   ├── Modal/
│   │   ├── Modal.jsx
│   │   └── index.js
│   ├── Pagination/
│   │   ├── Pagination.jsx
│   │   └── index.js
│   ├── Select/
│   │   ├── Select.jsx
│   │   └── index.js
│   ├── Table/
│   │   ├── Table.jsx
│   │   └── index.js
│   ├── Tabs/
│   │   ├── Tabs.jsx
│   │   └── index.js
│   ├── Textarea/
│   │   ├── Textarea.jsx
│   │   └── index.js
│   └── index.js               # Components category export
│
├── 🏗️ layouts/                # Layout Components (2)
│   ├── Container/
│   │   ├── Container.jsx
│   │   └── index.js
│   ├── PageHeader/
│   │   ├── PageHeader.jsx
│   │   └── index.js
│   └── index.js               # Layouts category export
│
├── ⏳ feedback/               # Feedback Components (5)
│   ├── LoadingSpinner/
│   │   ├── LoadingSpinner.jsx
│   │   └── index.js
│   └── index.js               # Feedback category export
│
├── 🎨 themes/                 # Theme Configuration
│   └── index.js               # Colors, spacing, typography, shadows
│
├── 📄 src/
│   └── index.js               # Main package entry point
│
├── 📄 index.js                # Root entry (exports from src)
├── 📄 package.json            # Package configuration
└── 📄 README.md               # Documentation
```

## 🎯 Component Categories

### 1. Components (components/)

**Purpose:** Core reusable UI components  
**Count:** 14 components

**Form Components (5):**

- `Button` - Action buttons with variants
- `Input` - Text input fields
- `Select` - Dropdown selectors
- `Checkbox` - Boolean checkboxes
- `Textarea` - Multi-line text input

**Display Components (6):**

- `Card` - Content containers
- `Badge` - Status indicators
- `Avatar` - User/entity avatars
- `Table` - Data tables
- `Pagination` - Page navigation
- `EmptyState` - Empty state placeholders

**Navigation Components (2):**

- `Tabs` - Tabbed interfaces
- `Modal` - Overlay dialogs

### 2. Layouts (layouts/)

**Purpose:** Page structure and container components  
**Count:** 2 components

- `Container` - Responsive width container (sm/default/lg)
- `PageHeader` - Page header with breadcrumbs, search, actions

### 3. Feedback (feedback/)

**Purpose:** Loading states and user feedback  
**Count:** 5 variants

- `LoadingSpinner` - Inline loading spinner
- `PageLoader` - Full-page loading overlay
- `SkeletonLoader` - Content placeholder skeleton
- `CardSkeleton` - Card loading skeleton
- `TableSkeleton` - Table loading skeleton

### 4. Themes (themes/)

**Purpose:** Design system configuration  
**Exports:**

- `colors` - Complete color palette
- `spacing` - Spacing scale
- `typography` - Font configuration
- `shadows` - Shadow definitions
- `borderRadius` - Border radius values
- `theme` - Complete theme object

## 📥 Import Patterns

### Pattern 1: Main Export (Recommended)

Import everything from the main package:

```javascript
import { Button, Input, Card, Container, LoadingSpinner, theme } from '@webfudge/ui'
```

### Pattern 2: Category Exports

Import from specific categories:

```javascript
// Layout components
import { Container, PageHeader } from '@webfudge/ui/layouts'

// Feedback components
import { LoadingSpinner, PageLoader } from '@webfudge/ui/feedback'

// Theme
import { colors, theme } from '@webfudge/ui/themes'
```

### Pattern 3: Individual Components

Import directly from component folders:

```javascript
import { Button } from '@webfudge/ui/components/Button'
import { Container } from '@webfudge/ui/layouts/Container'
```

## 🔄 Export Flow

```
Component File (*.jsx)
    ↓
Component Index (*/index.js)
    ↓
Category Index (components/index.js, layouts/index.js, etc.)
    ↓
Main Entry (src/index.js)
    ↓
Root Entry (index.js)
    ↓
Consumer App
```

## 📦 Package Configuration

### package.json Exports

```json
{
  "main": "./index.js",
  "exports": {
    ".": "./index.js", // Main export
    "./components": "./components/index.js", // All components
    "./components/*": "./components/*/index.js", // Individual components
    "./layouts": "./layouts/index.js", // All layouts
    "./layouts/*": "./layouts/*/index.js", // Individual layouts
    "./feedback": "./feedback/index.js", // Feedback components
    "./themes": "./themes/index.js" // Theme config
  }
}
```

## 🎨 Design Principles

### 1. Single Responsibility

Each component has one clear purpose and responsibility.

### 2. Composition

Components can be composed together to create complex UIs.

### 3. Prop-driven

All components are controlled via props, making them predictable.

### 4. Tailwind-first

Styling uses Tailwind CSS utilities for consistency.

### 5. Accessibility

Components follow ARIA guidelines and accessibility best practices.

## 🔗 Component Dependencies

### Internal Dependencies

- `LoadingSpinner` → `framer-motion`
- All components → `clsx` (class management)
- Icon components → `lucide-react`

### External Dependencies

- `react` (peer dependency)
- `react-dom` (peer dependency)
- `next` (peer dependency, for Next.js features)

## 🚀 Usage in Apps

### Setup in Next.js App

1. Install the package:

```bash
npm install @webfudge/ui
```

2. Configure Tailwind:

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './node_modules/@webfudge/ui/**/*.{js,jsx}'],
}
```

3. Import and use:

```javascript
import { Button, Card, Container } from '@webfudge/ui'

function MyPage() {
  return (
    <Container>
      <Card title="Welcome">
        <Button variant="primary">Get Started</Button>
      </Card>
    </Container>
  )
}
```

## 📊 Statistics

| Metric               | Value     |
| -------------------- | --------- |
| Total Components     | 20+       |
| Component Categories | 4         |
| Theme Tokens         | 100+      |
| File Structure Depth | 3 levels  |
| Export Patterns      | 3 methods |

## ✅ Structure Benefits

1. **Clear Organization** - Components grouped by purpose
2. **Easy Navigation** - Logical folder structure
3. **Flexible Imports** - Multiple import patterns
4. **Scalable** - Easy to add new components
5. **Maintainable** - Clear file locations
6. **Tree-shakeable** - Import only what you need

## 🎯 Adding New Components

To add a new component:

1. **Choose Category** - Determine if it's a component, layout, or feedback element
2. **Create Folder** - Create `NewComponent/` in the appropriate category
3. **Add Files**:
   ```
   NewComponent/
   ├── NewComponent.jsx
   └── index.js
   ```
4. **Export** - Add to category index.js
5. **Document** - Update README.md
6. **Test** - Verify imports work

Example:

```javascript
// components/Alert/Alert.jsx
export function Alert({ children, variant = 'info' }) {
  return <div className={...}>{children}</div>;
}

// components/Alert/index.js
export { Alert } from './Alert';

// components/index.js
export { Alert } from './Alert';
```

---

**Last Updated:** January 8, 2026  
**Structure Version:** 2.0  
**Status:** ✅ Optimized & Clean
