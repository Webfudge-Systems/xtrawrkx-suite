# 🎨 WebFudge Platform - Brand Colors

Official brand color guidelines and usage documentation.

## 🎯 Primary Brand Colors

### Orange - Primary Brand Color
**HEX:** `#F5630F`  
**RGB:** `245, 99, 15`  
**Tailwind:** `orange-500` or `brand-primary`

```css
color: #F5630F;
background: #F5630F;
```

**Usage:**
- ✅ Primary buttons and CTAs
- ✅ Active states and selections
- ✅ Important highlights
- ✅ Brand elements
- ❌ Avoid for body text
- ❌ Avoid for large backgrounds

---

### Dark - Primary Dark Color
**HEX:** `#1A1A1A`  
**RGB:** `26, 26, 26`  
**Tailwind:** `dark-900` or `brand-dark`

```css
color: #1A1A1A;
background: #1A1A1A;
```

**Usage:**
- ✅ Headers and titles
- ✅ Body text
- ✅ Icons
- ✅ Borders
- ❌ Avoid for primary buttons
- ❌ Use sparingly for backgrounds

---

### Light - Primary Light Color
**HEX:** `#FFFAF7`  
**RGB:** `255, 250, 247`  
**Tailwind:** `light-50` or `brand-light`

```css
color: #FFFAF7;
background: #FFFAF7;
```

**Usage:**
- ✅ Page backgrounds
- ✅ Card backgrounds
- ✅ Section backgrounds
- ❌ Never for text (low contrast)
- ❌ Avoid for borders

---

## 🌈 Extended Palettes

### Orange Palette

| Shade | HEX | RGB | Usage |
|-------|-----|-----|-------|
| 50 | `#fff7ed` | 255, 247, 237 | Very light backgrounds |
| 100 | `#ffedd5` | 255, 237, 213 | Light backgrounds |
| 200 | `#fed7aa` | 254, 215, 170 | Subtle highlights |
| 300 | `#fdba74` | 253, 186, 116 | Hover states |
| 400 | `#fb923c` | 251, 146, 60 | Secondary actions |
| **500** | **`#F5630F`** | **245, 99, 15** | **PRIMARY** |
| 600 | `#ea580c` | 234, 88, 12 | Darker actions |
| 700 | `#c2410c` | 194, 65, 12 | Active pressed |
| 800 | `#9a3412` | 154, 52, 18 | Dark accents |
| 900 | `#7c2d12` | 124, 45, 18 | Very dark |

### Yellow/Gold Palette

| Shade | HEX | Usage |
|-------|-----|-------|
| 50 | `#fefce8` | Very light backgrounds |
| 200 | `#fef08a` | Subtle highlights |
| 400 | `#facc15` | Gradient complement |
| 500 | `#eab308` | Accent color |

### Dark Palette

| Shade | HEX | RGB | Usage |
|-------|-----|-----|-------|
| 50 | `#f8f8f8` | 248, 248, 248 | Very light gray |
| 100 | `#e8e8e8` | 232, 232, 232 | Light gray |
| 300 | `#b0b0b0` | 176, 176, 176 | Medium gray |
| 500 | `#6d6d6d` | 109, 109, 109 | Gray text |
| 700 | `#333333` | 51, 51, 51 | Dark gray |
| 800 | `#262626` | 38, 38, 38 | Very dark |
| **900** | **`#1A1A1A`** | **26, 26, 26** | **PRIMARY DARK** |

---

## 🎨 Brand Gradients

### Primary Brand Gradient
```css
background: linear-gradient(135deg, #F5630F 0%, #fb923c 50%, #eab308 100%);
```
**Tailwind:** `bg-gradient-brand`

### Orange Gradient
```css
background: linear-gradient(135deg, #F5630F 0%, #fb923c 100%);
```
**Tailwind:** `bg-gradient-orange`

### Sunset Gradient
```css
background: linear-gradient(135deg, #F5630F 0%, #fdba74 50%, #fde047 100%);
```
**Tailwind:** `bg-gradient-sunset`

### Warm Light Gradient
```css
background: linear-gradient(135deg, #fff7ed 0%, #FFFAF7 100%);
```
**Tailwind:** `bg-gradient-warm`

---

## 💫 Shadows

### Brand Shadow
```css
box-shadow: 0 4px 14px 0 rgba(245, 99, 15, 0.25);
```
**Tailwind:** `shadow-brand`

### Brand Large Shadow
```css
box-shadow: 0 10px 40px 0 rgba(245, 99, 15, 0.2);
```
**Tailwind:** `shadow-brand-lg`

### Dark Shadow
```css
box-shadow: 0 4px 14px 0 rgba(26, 26, 26, 0.15);
```
**Tailwind:** `shadow-dark`

---

## 📝 Usage Examples

### Buttons

```jsx
// Primary Button
<button className="bg-orange-500 text-white hover:bg-orange-600">
  Click Me
</button>

// Secondary Button
<button className="bg-white text-orange-500 border border-orange-500">
  Learn More
</button>

// Ghost Button
<button className="text-orange-500 hover:bg-orange-50">
  Cancel
</button>
```

### Cards

```jsx
// Light Card
<div className="bg-light-50 border border-orange-100 shadow-soft">
  Content
</div>

// Dark Card
<div className="bg-dark-900 text-white">
  Content
</div>

// Gradient Card
<div className="bg-gradient-brand text-white">
  Content
</div>
```

### Text

```jsx
// Headings
<h1 className="text-dark-900 font-bold">Main Heading</h1>

// Body Text
<p className="text-dark-700">Body content here</p>

// Brand Text
<span className="text-orange-500 font-semibold">Highlighted</span>
```

### Badges

```jsx
// Active Badge
<span className="bg-orange-500 text-white px-3 py-1 rounded-full">
  Active
</span>

// Count Badge
<span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
  24
</span>
```

---

## 🚀 Using in Tailwind

### In tailwind.config.js

```javascript
module.exports = {
  presets: [require('@webfudge/config/tailwind.preset')],
  // Your custom config
};
```

### Direct Import

```javascript
import { brandColors } from '@webfudge/config';

const myColor = brandColors.primary; // #F5630F
```

---

## ✅ Do's and Don'ts

### ✅ Do

- Use orange-500 for primary actions
- Use dark-900 for text and headers
- Use light-50 for backgrounds
- Maintain consistent brand presence
- Use gradients for hero sections
- Use shadows for depth

### ❌ Don't

- Don't use too many colors at once
- Don't use brand colors for body text
- Don't create custom orange shades
- Don't use light colors for text
- Don't overuse gradients
- Don't ignore accessibility

---

## ♿ Accessibility

### Color Contrast Ratios

| Background | Text | Ratio | WCAG |
|------------|------|-------|------|
| `#F5630F` | White | 4.5:1 | ✅ AA |
| `#1A1A1A` | White | 16.1:1 | ✅ AAA |
| `#FFFAF7` | `#1A1A1A` | 16.8:1 | ✅ AAA |
| `#F5630F` | Black | 4.6:1 | ✅ AA |

---

## 📦 Package Location

- **Config:** `packages/config/src/brand/colors.js`
- **Tailwind Preset:** `packages/config/tailwind.preset.js`
- **Theme:** `packages/ui/themes/index.js`

---

**Version:** 1.0.0  
**Last Updated:** January 8, 2026  
**Status:** ✅ Official Brand Guidelines
