# 🎨 Brand Colors - Quick Reference

## Primary Colors

```
┌─────────────────────────────────────────────────┐
│  BRAND ORANGE                                   │
│  #F5630F                                        │
│  RGB(245, 99, 15)                              │
│  bg-orange-500 | bg-brand-primary              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  BRAND DARK                                     │
│  #1A1A1A                                        │
│  RGB(26, 26, 26)                               │
│  bg-dark-900 | bg-brand-dark                   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  BRAND LIGHT                                    │
│  #FFFAF7                                        │
│  RGB(255, 250, 247)                            │
│  bg-light-50 | bg-brand-light                  │
└─────────────────────────────────────────────────┘
```

## Common Patterns

### Buttons
```jsx
// Primary
<button className="bg-orange-500 text-white hover:bg-orange-600">

// Secondary  
<button className="bg-white text-orange-500 border-orange-500">

// Ghost
<button className="text-orange-500 hover:bg-orange-50">
```

### Badges
```jsx
// Active
<span className="bg-orange-500 text-white">

// Count
<span className="bg-orange-100 text-orange-700">

// Inactive
<span className="bg-gray-100 text-gray-600">
```

### Cards
```jsx
// Light
<div className="bg-light-50 border-orange-100">

// White
<div className="bg-white border-gray-200">

// Dark
<div className="bg-dark-900 text-white">

// Gradient
<div className="bg-gradient-brand text-white">
```

### Text
```jsx
// Heading
<h1 className="text-dark-900">

// Body
<p className="text-dark-700">

// Brand
<span className="text-orange-500">

// Muted
<span className="text-gray-500">
```

## Gradients

```css
bg-gradient-brand      /* Orange → Yellow */
bg-gradient-orange     /* Orange variations */
bg-gradient-sunset     /* Orange → Gold → Yellow */
bg-gradient-warm       /* Cream → Light */
```

## Shadows

```css
shadow-brand          /* Orange shadow */
shadow-brand-lg       /* Large orange shadow */
shadow-dark           /* Dark shadow */
shadow-soft           /* Subtle shadow */
```

## CSS Variables (Optional)

```css
:root {
  --brand-primary: #F5630F;
  --brand-dark: #1A1A1A;
  --brand-light: #FFFAF7;
}
```

## JavaScript

```javascript
import { brandColors } from '@webfudge/config';

brandColors.primary   // #F5630F
brandColors.dark      // #1A1A1A
brandColors.light     // #FFFAF7
```

---

**Pro Tip:** Use `bg-orange-500` for consistency across the platform!
