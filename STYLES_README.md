# Syrian Marketplace Frontend - Styles Documentation

## 🎯 **Overview**

This document explains our **modern SCSS design system** for the Syrian automotive marketplace. The system is built using **7-1 architecture** with **CSS custom properties** and **design tokens**, optimized for Syrian users with Arabic-first approach.

---

## 📁 **Architecture - Modern React + SCSS**

### **Global Styles Structure**
```
styles/
├── abstracts/          # Design system foundation
│   ├── _tokens.scss    # Design tokens (colors, spacing, typography)
│   └── _mixins.scss    # Reusable SCSS patterns
├── base/               # Base styles
│   ├── _reset.scss     # Modern CSS reset
│   └── _typography.scss # Typography system
├── themes/             # Theme definitions
│   └── _themes.scss    # Light/dark themes with CSS custom properties
└── main.scss           # Main entry point
```

### **Component Styles Structure**
```
components/
├── slices/
│   ├── Button/
│   │   ├── Button.tsx           # React component
│   │   ├── Button.module.scss   # Component-specific styles
│   │   └── index.ts            # Exports
│   └── Container/
│       ├── Container.tsx
│       ├── Container.module.scss
│       └── index.ts
├── forms/
│   └── ContactForm/
│       ├── ContactForm.tsx
│       └── ContactForm.module.scss
└── cards/
    └── ListingCard/
        ├── ListingCard.tsx
        └── ListingCard.module.scss
```

**Why This Approach:**
- ✅ **Co-location** - Styles live next to components
- ✅ **CSS Modules** - Automatic scoping, no naming conflicts
- ✅ **Maintainability** - Easy to find and update component styles
- ✅ **Tree-shaking** - Unused styles are automatically removed

### **Global vs Component Styles**

**Global Styles (`styles/`) - Use for:**
- ✅ Design tokens and variables
- ✅ Base styles (reset, typography)
- ✅ Theme definitions
- ✅ Utility classes (.flex, .text-center, etc.)
- ✅ System-wide patterns

**Component Styles (`.module.scss`) - Use for:**
- ✅ Component-specific styling
- ✅ Component states and variants
- ✅ Component layout and positioning
- ✅ Component animations and transitions

**Example:**
```scss
// ❌ DON'T put in global styles
.button-primary { }
.card-header { }
.modal-overlay { }

// ✅ DO put in component .module.scss
.button { }  // Button.module.scss
.header { }  // Card.module.scss  
.overlay { } // Modal.module.scss
```

---

## 🎨 **Design Tokens**

### **Color System**
```scss
// Syrian brand colors
$syrian-blue: hsl(214, 69%, 32%);    // Primary - Syrian flag blue
$syrian-red: hsl(350, 84%, 44%);     // Secondary - Syrian flag red

// Semantic colors
$success: hsl(142, 76%, 36%);        // Green for successful actions
$warning: hsl(38, 92%, 50%);         // Amber for warnings
$error: hsl(0, 84%, 60%);            // Red for errors
$info: hsl(217, 91%, 60%);           // Blue for information
```

### **Spacing System**
```scss
// Systematic spacing scale
$spacing: (
  0: 0,
  1: 0.25rem,      // 4px
  2: 0.5rem,       // 8px
  4: 1rem,         // 16px
  8: 2rem,         // 32px
  
  // Semantic spacing (user's proven approach)
  xs: 0.25rem,     // 4px
  sm: 0.5rem,      // 8px
  md: 1rem,        // 16px
  lg: 2rem,        // 32px
  xl: 4rem,        // 64px
  xxl: 8rem,       // 128px
);
```

### **Typography Scale**
```scss
// Font sizes
$font-sizes: (
  xs: 0.75rem,     // 12px
  sm: 0.875rem,    // 14px
  base: 1rem,      // 16px
  lg: 1.125rem,    // 18px
  xl: 1.25rem,     // 20px
  2xl: 1.5rem,     // 24px
  3xl: 1.875rem,   // 30px
  4xl: 2.25rem,    // 36px
);

// Font families (Arabic/Latin approach)
$font-families: (
  sans: ('Inter', -apple-system, BlinkMacSystemFont, sans-serif),
  arabic: ('Cairo', 'Segoe UI', Tahoma, Geneva, sans-serif),
  mono: ('JetBrains Mono', 'Fira Code', Consolas, monospace),
);
```

### **Responsive Breakpoints**
```scss
$breakpoints: (
  sm: 640px,       // Mobile landscape
  md: 768px,       // Tablet
  lg: 1024px,      // Desktop
  xl: 1280px,      // Large desktop
  2xl: 1536px,     // Extra large
);

// Container max widths
$container-max-widths: (
  sm: 640px,
  md: 768px,
  lg: 1024px,
  xl: 1280px,
  2xl: 1400px,
  full: 100%,
);
```

---

## 🌙 **Theme System - Modern CSS Custom Properties**

### **How Themes Work**
We use `data-theme` attributes and CSS custom properties with **HSL values** for alpha transparency support:

```css
/* Light theme (default) */
:root,
[data-theme="light"] {
  --primary: 214 69% 32%;        /* Syrian blue */
  --secondary: 350 84% 44%;      /* Syrian red */
  --bg-primary: 0 0% 100%;       /* White background */
  --text-primary: 222 84% 5%;    /* Dark text */
}

/* Dark theme */
[data-theme="dark"] {
  --primary: 217 91% 60%;        /* Lighter blue for dark mode */
  --secondary: 0 84% 60%;        /* Adjusted red */
  --bg-primary: 222 84% 5%;      /* Dark background */
  --text-primary: 210 20% 98%;   /* Light text */
}
```

### **Using Theme Colors**
```scss
// In components, use hsl() function for alpha support
.button {
  background-color: hsl(var(--primary));           // Solid color
  color: hsl(var(--text-inverse));
  border: 1px solid hsl(var(--primary) / 0.5);     // 50% transparency
}

.button:hover {
  background-color: hsl(var(--primary) / 0.9);     // 90% opacity
}
```

---

## 🔧 **Helper Functions**

### **Design Token Access**
```scss
// Use these functions to access design tokens
@function color($key) { @return get($colors, $key); }
@function space($key) { @return get($spacing, $key); }
@function text($key) { @return get($font-sizes, $key); }
@function weight($key) { @return get($font-weights, $key); }
@function radius($key) { @return get($radius, $key); }
@function breakpoint($key) { @return get($breakpoints, $key); }

// Example usage
.component {
  margin: space(md);                    // 1rem
  font-size: text(lg);                  // 1.125rem
  color: color(primary);                // Syrian blue
  border-radius: radius(md);            // 0.5rem
}
```

---

## 🎭 **Essential Mixins**

### **Responsive Design**
```scss
// Mobile-first responsive mixins
@mixin respond-to($breakpoint) {
  @media (min-width: breakpoint($breakpoint)) {
    @content;
  }
}

// Usage
.container {
  padding: space(sm);
  
  @include respond-to(md) {
    padding: space(lg);
  }
}
```

### **RTL/LTR Support (Arabic/Latin)**
```scss
// RTL support for Arabic
@mixin rtl {
  [dir="rtl"] & {
    @content;
  }
}

// Usage
.text-align {
  text-align: left;
  
  @include rtl {
    text-align: right;
  }
}
```

### **Layout Helpers**
```scss
// Container mixin (user's proven approach)
@mixin container($size: xl) {
  width: 100%;
  margin-inline: auto;
  padding-inline: space(md);
  
  @if map-has-key($container-max-widths, $size) {
    max-width: get($container-max-widths, $size);
  }
}

// Flexbox utilities
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

### **Component Patterns**
```scss
// Button reset
@mixin button-reset {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  cursor: pointer;
}

// Focus ring for accessibility
@mixin focus-ring($color: primary) {
  &:focus-visible {
    outline: 2px solid hsl(var(--#{$color}));
    outline-offset: 2px;
    border-radius: radius(sm);
  }
}

// Loading spinner
@mixin spinner($size: 1rem) {
  width: $size;
  height: $size;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

---

## 🧩 **Component CSS Modules Pattern**

### **File Structure**
```
components/slices/Button/
├── Button.tsx              # React component
├── Button.module.scss      # Component styles
└── index.ts               # Export file
```

### **SCSS Module Example**
```scss
// Button.module.scss
@import '../../../styles/abstracts/tokens';
@import '../../../styles/abstracts/mixins';

.button {
  @include button-reset;
  @include focus-ring;
  
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: space(sm);
  font-weight: weight(medium);
  border-radius: radius(md);
  transition: map-get($transitions, default);
}

// Variants using design tokens
.primary {
  background-color: hsl(var(--primary));
  color: hsl(var(--text-inverse));
  
  @include hover {
    background-color: hsl(var(--primary) / 0.9);
  }
}

// Sizes using design tokens
.lg {
  @include text-style(lg, medium);
  padding: space(4) space(8);
  min-height: 48px;
}
```

### **React Component Example**
```tsx
// Button.tsx
import styles from './Button.module.scss';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children
}) => {
  return (
    <button className={`${styles.button} ${styles[variant]} ${styles[size]}`}>
      {children}
    </button>
  );
};
```

---

## 🌍 **Arabic/RTL Support**

### **Font Loading Strategy**
```css
/* Base font families */
:root {
  --font-sans: 'Inter', -apple-system, sans-serif;
  --font-arabic: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
}

/* Default font */
:root {
  font-family: var(--font-sans);
}

/* Arabic override */
[lang="ar"],
[dir="rtl"] {
  font-family: var(--font-arabic);
}
```

### **RTL Layout**
```html
<!-- HTML setup -->
<html lang="ar" dir="rtl" data-theme="light">
```

```scss
// SCSS handling
.component {
  margin-left: space(md);
  
  @include rtl {
    margin-left: 0;
    margin-right: space(md);
  }
}

// Or use logical properties (modern approach)
.component {
  margin-inline-start: space(md);  // Works for both LTR/RTL
}
```

---

## 🚀 **Performance Optimizations**

### **CSS Custom Properties Benefits**
- **Runtime theme switching** without CSS re-compilation
- **Alpha transparency** with HSL values
- **Reduced bundle size** - no duplicate color values
- **Better caching** - static CSS with dynamic values

### **Modern CSS Features**
```css
/* Logical properties for RTL */
margin-inline: 1rem;        /* Instead of margin-left/right */
padding-block: 2rem;        /* Instead of padding-top/bottom */

/* Modern color syntax */
background: hsl(var(--primary) / 0.8);  /* HSL with alpha */

/* Container queries (future) */
@container (min-width: 400px) {
  .card { flex-direction: row; }
}
```

---

## 📝 **Usage Guidelines**

### **DO ✅**
```scss
// Use design token functions
padding: space(md);
color: hsl(var(--primary));
font-size: text(lg);

// Use semantic spacing
.mb-8 { margin-bottom: space(xl); }  // 2rem

// Use mixins for common patterns
@include container(lg);
@include flex-center;
@include respond-to(md);
```

### **DON'T ❌**
```scss
// Don't use hardcoded values
padding: 16px;              // Use space(md) instead
color: #1a5490;             // Use hsl(var(--primary)) instead
font-size: 18px;            // Use text(lg) instead

// Don't use decimal class names in loops
.m-0.5 { }                  // Causes SCSS compilation errors

// Don't mix old and new patterns
margin-left: 1rem;          // Use margin-inline-start or logical properties
```

---

## 🔄 **Migration from Old Patterns**

### **Before (Old Pattern)**
```scss
// Old hardcoded approach
.button {
  background-color: #1a5490;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  
  &:hover {
    background-color: darken(#1a5490, 10%);  // Doesn't work with CSS vars
  }
}
```

### **After (Modern Pattern)**
```scss
// New design system approach
.button {
  background-color: hsl(var(--primary));
  padding: space(sm) space(md);
  border-radius: radius(md);
  
  @include hover {
    background-color: hsl(var(--primary) / 0.9);  // Works with CSS vars
  }
}
```

---

## 🎯 **Syrian Marketplace Specific**

### **Brand Colors**
- **Primary**: Syrian flag blue (`hsl(214, 69%, 32%)`)
- **Secondary**: Syrian flag red (`hsl(350, 84%, 44%)`)
- **Success**: Green for successful bids/sales
- **Warning**: Amber for pending actions
- **Error**: Red for failed actions

### **Typography**
- **Arabic users**: Cairo font family
- **International users**: Inter font family
- **Automatic switching**: Based on `lang="ar"` and `dir="rtl"`

### **Responsive Strategy**
- **Mobile-first**: Syrian users primarily on mobile
- **Touch-friendly**: Minimum 44px touch targets
- **Performance-focused**: Minimal CSS for slow connections

---

## 🔗 **Quick Reference**

### **Common Class Names**
```css
/* Layout */
.container          /* Responsive container */
.flex              /* display: flex */
.flex-center       /* Centered flex container */
.text-center       /* Centered text */

/* Spacing */
.m-4               /* margin: 1rem */
.p-8               /* padding: 2rem */
.gap-4             /* gap: 1rem */
.mb-8              /* margin-bottom: 2rem */

/* Colors */
.text-primary      /* Primary text color */
.text-muted        /* Muted text color */
.bg-primary        /* Primary background */

/* Responsive */
.hidden            /* display: none */
.block             /* display: block */
```

### **SCSS Functions Quick Access**
```scss
space(md)          // 1rem
text(lg)           // 1.125rem
color(primary)     // Syrian blue
radius(md)         // 0.5rem
breakpoint(lg)     // 1024px
weight(semibold)   // 600
```

---

## 🚨 **Troubleshooting**

### **Common Issues**
1. **SCSS compilation errors**: Check import paths and avoid decimal class names
2. **CSS custom properties not working**: Ensure `hsl()` wrapper function
3. **RTL issues**: Use logical properties or RTL mixins
4. **Theme switching**: Check `data-theme` attribute on `<html>`

### **Build Errors**
```bash
# If SCSS compilation fails
npm run build  # Check console for specific errors

# Common fixes
- Remove decimal values from SCSS loops (.m-0.5)
- Fix @extend across media queries
- Check import paths in .module.scss files
```

---

**This design system provides a solid foundation for the Syrian marketplace while maintaining modern best practices and performance optimization.**