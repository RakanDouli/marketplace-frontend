# Syrian Marketplace Frontend - Styles Documentation

## 🎯 **Current Architecture Overview**

This document explains our **clean, modern SCSS system** for the Syrian marketplace. The system is built with **direct SCSS variables** and **responsive typography** using CSS `clamp()`, optimized for Arabic/English bilingual support.

---

## 📁 **Architecture - Clean & Simple**

### **Global Styles Structure**
```
styles/
├── variables.scss      # All design tokens (spacing, colors, fonts, etc.)
├── typography.scss     # Font families only (headers vs body)
├── base.scss          # CSS reset and base styles
├── themes.scss        # Light/dark theme definitions
└── main.scss          # Main entry point (imports all above)
```

### **Component Styles Structure** 
```
components/slices/
├── Text/
│   ├── Text.tsx               # React component with variants
│   ├── Text.module.scss       # Responsive typography with clamp()
│   └── index.ts              # Exports
├── Button/
│   ├── Button.tsx             # Button component
│   ├── Button.module.scss     # Button styles + ThemeToggle + LanguageSelector
│   └── index.ts              # Exports
├── Container/
│   ├── Container.tsx          # Layout container
│   ├── Container.module.scss  # Container styles
│   └── index.ts
└── [other slices...]
```

**Key Principles:**
- ✅ **Each .module.scss imports `../../../styles/variables`** at the top
- ✅ **Typography uses direct clamp() values** (no font-size variables)
- ✅ **Font families managed in typography.scss** (headers vs body)
- ✅ **CSS custom properties** for themes with HSL values
- ✅ **Direct SCSS variables** like `$space-md`, `$weight-bold` (no functions)

---

## 🎨 **Design Tokens (variables.scss)**

### **Spacing System - Direct Variables**
```scss
// Simple, direct spacing variables
$space-xs: 0.25rem;     // 4px
$space-sm: 0.5rem;      // 8px  
$space-md: 1rem;        // 16px
$space-lg: 2rem;        // 32px
$space-xl: 4rem;        // 64px
$space-xxl: 8rem;       // 128px
```

### **Typography - Responsive Clamp Variables** 
```scss
// Font sizes with responsive clamp() - used directly in Text.module.scss
$font-xs: clamp(0.75rem, 0.5vw, 0.8rem);    // 12–13px
$font-sm: clamp(0.875rem, 0.6vw, 0.95rem);  // 14–15px
$font-base: clamp(1rem, 0.8vw, 1.1rem);     // 16–18px
$font-lg: clamp(1.125rem, 1vw, 1.25rem);    // 18–20px
$font-xl: clamp(1.25rem, 1.2vw, 1.4rem);    // 20–22px
$font-2xl: clamp(1.5rem, 1.5vw, 1.75rem);   // 24–28px
$font-3xl: clamp(1.875rem, 2vw, 2.25rem);   // 30–36px
$font-4xl: clamp(2.25rem, 2.5vw, 2.75rem);  // 36–44px
$font-5xl: clamp(3rem, 3.5vw, 3.75rem);     // 48–60px
$font-6xl: clamp(3.75rem, 4.5vw, 4.5rem);   // 60–72px
```

### **Font Weights & Line Heights**
```scss
// Font weights - Direct SCSS variables
$weight-normal: 400;
$weight-medium: 500;
$weight-semibold: 600;
$weight-bold: 700;

// Line heights - Direct SCSS variables
$line-none: 1;
$line-tight: 1.25;
$line-snug: 1.375;
$line-normal: 1.5;
$line-relaxed: 1.625;
$line-loose: 2;
```

### **Font Families**
```scss
// Two main font families - used in typography.scss
$font-headers: 'Beiruti', 'Cairo', 'Segoe UI', Tahoma, Geneva, sans-serif;
$font-body: 'Rubik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
$font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

### **Colors & Layout**
```scss
// Brand colors
$syrian-blue: hsl(214, 69%, 32%);
$syrian-red: hsl(350, 84%, 44%);

// Breakpoints
$breakpoint-sm: 640px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;

// Border radius
$radius-sm: 0.25rem;
$radius-md: 0.5rem;
$radius-lg: 0.75rem;
$radius-full: 9999px;

// Layout dimensions
$header-height: 80px;
$header-height-mobile: 70px;
```

---

## 🔤 **Typography System**

### **Font Management (typography.scss)**
```scss
// Import Google Fonts
@import url('https://fonts.googleapis.com/css2?family=Beiruti:wght@200..900&family=Rubik:ital,wght@0,300..900;1,300..900&display=swap');

// Body font family
body {
  font-family: $font-body; // Rubik
}

// Headers font family  
h1, h2, h3, h4, h5, h6 {
  font-family: $font-headers; // Beiruti
}

// Paragraphs font family
p {
  font-family: $font-body; // Rubik
}
```

### **Text Component (Text.module.scss)**
The Text slice handles all font sizes with responsive clamp values:

```scss
@import '../../../styles/variables';

// Base styles
%text-base {
  margin: 0;
  line-height: $line-normal;
  color: hsl(var(--text));
}

// Header base styles (uses Beiruti font from typography.scss)
%header-base {
  @extend %text-base;
  font-family: $font-headers;
}

// Body base styles (uses Rubik font from typography.scss)
%body-base {
  @extend %text-base;
  font-family: $font-body;
}

// Heading variants with clamp()
.h1 {
  @extend %header-base;
  font-size: clamp(3.75rem, 4.5vw, 4.5rem); // 60-72px
  font-weight: 700;
  line-height: 1.25;
}

.h2 {
  @extend %header-base;
  font-size: clamp(2.25rem, 2.5vw, 2.75rem); // 36-44px
  font-weight: 700;
  line-height: 1.25;
}

// Body text variants
.paragraph {
  @extend %body-base;
  font-size: clamp(1rem, 0.8vw, 1.1rem); // 16-18px
  font-weight: 400;
}

.small {
  @extend %body-base;
  font-size: clamp(0.875rem, 0.6vw, 0.95rem); // 14-15px
  font-weight: 400;
}
```

---

## 🌙 **Theme System**

### **CSS Custom Properties (themes.scss)**
```css
/* Light theme (default) */
:root,
[data-theme="light"] {
  --primary: 214 69% 32%;        /* Syrian blue */
  --secondary: 350 84% 44%;      /* Syrian red */
  --surface: 0 0% 100%;          /* White */
  --text: 222 84% 5%;            /* Dark text */
}

/* Dark theme */
[data-theme="dark"] {
  --primary: 217 91% 60%;        /* Lighter blue */
  --secondary: 0 84% 60%;        /* Adjusted red */
  --surface: 222 84% 5%;         /* Dark surface */
  --text: 210 20% 98%;           /* Light text */
}
```

### **Using Theme Colors**
```scss
// In component .module.scss files
.button {
  background-color: hsl(var(--primary));           // Solid
  border: 1px solid hsl(var(--primary) / 0.5);     // 50% opacity
  color: hsl(var(--text));
}
```

---

## 🛠 **Creating New Slices**

### **1. Component Structure**
```
components/slices/NewSlice/
├── NewSlice.tsx           # React component
├── NewSlice.module.scss   # Component styles
└── index.ts              # Export file
```

### **2. SCSS Module Template**
```scss
// NewSlice.module.scss
@import '../../../styles/variables';

.newSlice {
  // Use spacing variables
  padding: $space-md;
  margin-bottom: $space-lg;
  
  // Use border radius
  border-radius: $radius-md;
  
  // Use theme colors  
  background-color: hsl(var(--surface));
  color: hsl(var(--text));
  border: 1px solid hsl(var(--border));
}

// Size variants
.small {
  padding: $space-sm;
}

.large {
  padding: $space-xl;
}

// State variants
.active {
  background-color: hsl(var(--primary) / 0.1);
  border-color: hsl(var(--primary));
}

// Responsive behavior
@media (max-width: $breakpoint-md) {
  .newSlice {
    padding: $space-sm;
  }
}
```

### **3. React Component Template**
```tsx
// NewSlice.tsx
import React from 'react';
import styles from './NewSlice.module.scss';

export interface NewSliceProps {
  size?: 'small' | 'medium' | 'large';
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const NewSlice: React.FC<NewSliceProps> = ({
  size = 'medium',
  active = false,
  children,
  className = ''
}) => {
  return (
    <div 
      className={`
        ${styles.newSlice} 
        ${styles[size]} 
        ${active ? styles.active : ''} 
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
};

export default NewSlice;
```

---

## 📋 **Quick Reference**

### **Common Patterns**
```scss
// Spacing
padding: $space-md;           // 1rem
margin: $space-lg $space-md;  // 2rem 1rem

// Typography (don't use variables - use clamp directly)
font-size: clamp(1rem, 0.8vw, 1.1rem);  // Responsive
font-weight: 600;                        // Use numbers
line-height: 1.5;                        // Use numbers

// Colors
background-color: hsl(var(--primary));
border: 1px solid hsl(var(--border));
color: hsl(var(--text-muted));

// Border radius
border-radius: $radius-md;    // 0.5rem

// Responsive
@media (max-width: $breakpoint-md) {
  // Mobile styles
}
```

### **DO ✅**
- Import variables: `@import '../../../styles/variables';`
- Use direct SCSS variables: `$space-md`, `$weight-bold`
- Use clamp() directly for font-size (no variables)
- Use HSL theme colors: `hsl(var(--primary))`
- Use logical properties: `margin-inline-start`

### **DON'T ❌**
- Use font-size variables (use clamp directly)
- Use functions like `map-get()` or `@include`
- Hardcode values like `16px` (use variables)
- Mix old and new patterns
- Put global styles in component modules

---

## 🚀 **Benefits of This System**

1. **Simple & Predictable** - Direct variables, no complex functions
2. **Responsive Typography** - Automatic scaling with clamp()
3. **Theme Support** - Runtime theme switching with CSS custom properties
4. **Arabic/English** - Proper font handling for both languages
5. **Maintainable** - Clear separation of concerns
6. **Performant** - No runtime CSS generation
7. **TypeScript** - Full type safety with CSS modules

---

**This system provides a solid, clean foundation for the Syrian marketplace with modern best practices and excellent developer experience.**