# Syrian Automotive Marketplace - Frontend Architecture

## Overview
Next.js 14 with App Router, TypeScript, SCSS, and Zustand for a Syrian automotive marketplace optimized for poor internet conditions with full Arabic/English support.

## Core Infrastructure

### 1. Notification System (Zustand Store)
**Store Structure:**
```typescript
interface NotificationStore {
  notifications: Notification[]
  addNotification: (notification: NotificationPayload) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: { label: string; onClick: () => void }
}
```

**Usage:**
- Form submissions (success/error messages)
- API call feedback
- Important user alerts
- Bid status updates

### 2. Internationalization (i18n)
**Languages:** English (default), Arabic (RTL)

**Structure:**
```
locales/
├── en.json
├── ar.json
└── index.ts (hooks & providers)
```

**Translation Categories:**
- Navigation & UI elements
- Form labels & validation messages
- Vehicle specifications & categories
- Bid-related terminology
- Error messages
- Meta descriptions

**RTL Support:**
- SCSS mixins for direction switching
- Arabic font family (Cairo)
- Proper text alignment
- Icon direction handling

### 3. SEO Meta Data System
**Critical for Listing Pages:**

```typescript
interface SEOMeta {
  title: string
  description: string
  keywords: string[]
  openGraph: {
    title: string
    description: string
    images: string[]
    type: 'website' | 'product'
  }
  twitter: {
    card: 'summary_large_image'
    title: string
    description: string
    images: string[]
  }
  jsonLd?: object // Structured data for vehicles
}
```

**Dynamic SEO for Listings:**
- Vehicle make/model in title
- Price, year, location in description
- Vehicle images for OG/Twitter cards
- JSON-LD structured data for search engines
- Arabic/English meta tags based on language
- Canonical URLs for both languages

**SEO Template Examples:**
```
Title: "2020 Toyota Camry للبيع في دمشق - 25,000$ | السوق السوري للسيارات"
Description: "سيارة تويوتا كامري 2020 للبيع في دمشق، السعر 25,000 دولار، قطعت 50,000 كم..."
Keywords: ["تويوتا كامري", "سيارات دمشق", "سيارات للبيع", "Toyota Camry Damascus"]
```

### 4. CMS-Ready Architecture
**Preparation for Future CMS Integration:**

**Content Externalization:**
- All text content in translation files (not hardcoded)
- Image paths configurable
- API endpoints externalized
- Component structure ready for dynamic content

**Future CMS Integration Points:**
- Homepage hero content
- Category descriptions
- Legal pages (terms, privacy)
- Help/FAQ content
- Announcement banners

**Data Structure:**
```typescript
interface CMSContent {
  slug: string
  title: Record<string, string> // Multi-language
  content: Record<string, string>
  meta: SEOMeta
  publishedAt: Date
  status: 'draft' | 'published'
}
```

## Component Architecture

### 1. Layout Components
**Container:**
- `outer` prop for full-width sections
- `inner` prop for content-width sections
- CSS custom properties for theming
- RTL support built-in

**Header:**
- Language switcher (EN/AR)
- Theme toggle (light/dark)
- User authentication status
- Navigation with translation support
- Mobile-responsive menu

### 2. Core Components
**Button:**
- Size based on font-size and spacing (not arbitrary names)
- Variant system using design tokens
- Loading states with spinner
- i18n support for labels

**NotificationToast:**
- Queue management
- Auto-dismiss functionality
- Action buttons support
- Accessibility compliant
- Animation with reduced motion support

### 3. Marketplace Components
**ListingCard:**
- Vehicle image gallery
- Price formatting (Arabic/English numerals)
- Bid status indicator
- Favorite/save functionality
- SEO-friendly structured data

**SearchBar & Filters:**
- Translated filter labels
- Arabic/English search support
- Location-based filtering
- Price range with proper formatting

**BidSystem:**
- Real-time bid updates
- Notification integration
- Bid history with timestamps
- Arabic/English number formatting

### 4. Form Components
**Input/Select/TextArea:**
- Validation with translated error messages
- RTL text alignment
- Accessibility labels
- Loading states

**FileUpload:**
- Drag & drop support
- Image optimization for poor connections
- Progress indicators
- Translated feedback messages

## SEO Strategy

### 1. Page Types & Meta Templates

**Homepage:**
```typescript
{
  title: "السوق السوري للسيارات | Syrian Car Marketplace",
  description: "أفضل منصة لبيع وشراء السيارات في سوريا - Best platform for buying and selling cars in Syria",
  keywords: ["سيارات سوريا", "بيع سيارات", "شراء سيارات", "Syrian cars", "Damascus cars"]
}
```

**Listing Detail Page:**
```typescript
{
  title: "{year} {make} {model} للبيع في {city} - {price} | السوق السوري",
  description: "{make} {model} {year} للبيع في {city}، السعر {price}، قطعت {mileage} كم، حالة {condition}...",
  keywords: ["{make} {model}", "سيارات {city}", "{make} للبيع", "سيارات {year}"]
}
```

**Search Results:**
```typescript
{
  title: "سيارات {make} للبيع في سوريا | نتائج البحث",
  description: "تصفح {count} سيارة {make} متاحة للبيع في سوريا بأسعار متنوعة...",
  keywords: ["سيارات {make}", "بيع {make}", "{make} سوريا"]
}
```

### 2. Structured Data (JSON-LD)
**Vehicle Listing Schema:**
```json
{
  "@context": "https://schema.org/",
  "@type": "Vehicle",
  "name": "2020 Toyota Camry",
  "brand": "Toyota",
  "model": "Camry",
  "vehicleModelDate": "2020",
  "offers": {
    "@type": "Offer",
    "price": "25000",
    "priceCurrency": "USD",
    "availability": "InStock",
    "seller": {
      "@type": "Person",
      "name": "Seller Name"
    }
  },
  "mileageFromOdometer": "50000 km",
  "location": "Damascus, Syria"
}
```

### 3. URL Structure
**SEO-Friendly URLs:**
- `/listings/{make}-{model}-{year}-{city}-{id}`
- `/search/{category}`
- `/ar/listings/` for Arabic version
- Canonical URLs for duplicate content

### 4. Performance SEO
- Image optimization with next/image
- Lazy loading for listings
- Critical CSS inlined
- Proper caching headers
- Minimal JavaScript for poor connections

## Implementation Priority

1. **Phase 1: Core Infrastructure**
   - Zustand store with notifications
   - i18n system setup
   - SEO meta data system
   - Container & Button components

2. **Phase 2: Essential Features**
   - Header with language switching
   - NotificationToast component
   - Basic listing components
   - Authentication forms

3. **Phase 3: Advanced Features**
   - Search & filtering
   - Bid system
   - User dashboard
   - Advanced SEO implementation

4. **Phase 4: Optimization**
   - Performance tuning
   - SEO audit & improvements
   - CMS preparation
   - Analytics integration

## Technical Decisions

**State Management:** Zustand (lightweight, TypeScript-friendly)
**Styling:** SCSS with design tokens + CSS custom properties
**i18n:** Custom lightweight solution (avoiding heavy libraries)
**SEO:** Built-in Next.js features + custom meta management
**Forms:** React Hook Form with Zod validation
**Images:** Next.js Image component with optimization

## File Structure
```
src/
├── app/                    # Next.js 14 app router
├── components/
│   ├── slices/            # Reusable components
│   ├── forms/             # Form components
│   └── layout/            # Layout components
├── store/                 # Zustand stores
├── locales/               # Translation files
├── utils/
│   ├── seo.ts            # SEO utilities
│   └── i18n.ts           # i18n utilities
├── styles/
│   ├── abstracts/        # Tokens & mixins
│   ├── base/             # Reset & typography
│   └── themes/           # Theme definitions
└── types/                # TypeScript definitions
```

This architecture ensures the marketplace is SEO-optimized, multilingual, user-friendly with notifications, and ready for future CMS integration while maintaining performance for poor internet conditions.