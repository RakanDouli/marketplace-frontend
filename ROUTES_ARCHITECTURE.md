# Syrian Marketplace - Routes & Layout Architecture

## Overview
Marketplace application with role-based layouts and dynamic navigation system inspired by Marktplaats.nl and Sahibinden.com.

## Route Structure

### Public Routes
```
/                           # Homepage with hero, search, featured listings
/listings                   # All listings with filters
/listings/[id]             # Vehicle detail page with bidding
/categories                # Category browsing
/categories/[slug]         # Category-specific listings
/search                    # Advanced search page
/auth/login               # Login page
/auth/register            # Registration page
```

### User Dashboard Routes
```
/dashboard                 # User dashboard overview
/dashboard/listings        # My listings management
/dashboard/bids           # My bids & offers
/dashboard/favorites      # Saved/favorite listings  
/dashboard/messages       # Chat with buyers/sellers
/dashboard/profile        # Profile management
/dashboard/settings       # Account settings
```

### Admin Dashboard Routes
```
/admin                     # Admin dashboard overview
/admin/listings           # Manage all listings
/admin/users              # User management
/admin/categories         # Category management
/admin/reports            # Analytics & reports
/admin/settings           # System settings
/admin/roles              # Role & permission management
/admin/featured           # Featured listings management
```

## Layout Architecture

### 1. Main Application Layout (`app/layout.tsx`)
- Handles theme, i18n providers
- Route detection for layout switching
- Easy removal of admin sections in future

### 2. Public Layout (`app/(public)/layout.tsx`)
- Header with navigation, search, auth buttons
- Footer with links and info
- Main marketplace experience

### 3. User Dashboard Layout (`app/(dashboard)/layout.tsx`)
- Header with user info and logout
- Left sidebar with user-specific navigation
- Main content area for dashboard pages

### 4. Admin Dashboard Layout (`app/(admin)/layout.tsx`)
- Admin header with system info
- Left sidebar with role-based navigation tabs
- Dynamic permissions based on user role
- Easy to extract to separate app later

## Role-Based Navigation System

### Database Integration
- Uses existing dynamic RBAC system
- Features and permissions from DB
- Role-based tab visibility

### Permission Levels
```typescript
// Super Admin - sees everything
/admin/listings, /admin/users, /admin/categories, /admin/reports, 
/admin/settings, /admin/roles, /admin/featured

// Admin - limited access
/admin/listings, /admin/categories, /admin/reports

// Moderator - content only  
/admin/listings, /admin/reports

// User - dashboard only
/dashboard/* (no admin access)
```

### Implementation Strategy
1. **Role Context**: Store user role and permissions
2. **Navigation Component**: Dynamically render available tabs
3. **Route Guards**: Protect admin routes based on permissions
4. **Easy Separation**: Admin layout can be moved to separate app

## Security Approach

### User vs Admin Separation
- Different layout components
- Separate route groups  
- Different authentication contexts
- Easy to split into microservices later

### Permission Checking
```typescript
const hasPermission = (feature: string, action: string) => {
  return userPermissions.some(p => 
    p.feature === feature && p.actions.includes(action)
  );
};

// Usage in navigation
{hasPermission('listings', 'manage') && (
  <NavItem href="/admin/listings">Manage Listings</NavItem>
)}
```

## Pages to Build

### 1. Marketplace Pages (Priority 1)
- [x] Homepage with hero section
- [ ] Listings page with SearchBar component  
- [ ] Listing detail page with ListingCard
- [ ] Category pages
- [ ] Search results

### 2. User Dashboard (Priority 2)
- [ ] Dashboard overview with stats
- [ ] My listings management
- [ ] My bids tracking
- [ ] Messages/chat interface
- [ ] Profile management

### 3. Admin Dashboard (Priority 3)
- [ ] Admin overview with system stats
- [ ] User management interface
- [ ] Listings moderation
- [ ] Category management
- [ ] Reports and analytics

## Chat System Architecture
- Real-time messaging between buyers/sellers
- Message threads per listing
- Online/offline status
- File/image sharing for vehicle details
- Similar to Marktplaats messaging system

## Future Considerations
- **Microservices**: Admin dashboard can become separate Next.js app
- **Mobile App**: Shared API, different UI
- **Real-time**: WebSocket integration for chat/notifications
- **Performance**: Server-side caching, CDN for images
- **Security**: Rate limiting, input validation, XSS protection

## Implementation Order
1. ✅ Core components (Header, SearchBar, ListingCard)
2. 🔄 Route structure and layouts
3. ⏳ Marketplace pages with real functionality
4. ⏳ User dashboard with CRUD operations
5. ⏳ Admin dashboard with role-based access
6. ⏳ Real-time chat system
7. ⏳ Advanced features (analytics, notifications)