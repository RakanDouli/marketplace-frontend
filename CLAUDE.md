# Claude Development Log

---

## 🚀 SESSION: Archived Listings System (2025-10-30)

### ✅ COMPLETED: Archived Listings Feature

**Purpose:** Preserve listing data when users delete listings, allow viewing archived listings in read-only mode.

#### Backend Implementation ✅
- Created `ArchivedListing` entity with full data snapshot
- Archive reasons: `sold_via_platform`, `sold_externally`, `no_longer_for_sale`
- Analytics preserved: `viewCount`, `chatCount`, `bidCount`, `daysToSell`
- GraphQL queries:
  - `archivedListing(id: ID!)` - Public query for viewing archived listings
  - `myArchivedListings` - User's archived listings
- GraphQL mutation:
  - `archiveMyListing(listingId: ID!, reason: ArchivalReason!)` - Archive a listing
- Database migrations:
  - `CreateArchivedListingsTable` - Main archived_listings table
  - `AddArchivedListingIdToChats` - Link chats to archived listings

#### Frontend Implementation ✅
- Archived listing detail page: `/archived-listing/[id]`
- Features:
  - Archive banner: "هذا الإعلان لم يعد متاحًا"
  - Dimmed content (0.6 opacity)
  - Shows only first image (reduce load)
  - No ads, no action buttons (share/favorite/contact)
  - Full listing details preserved (specs, location, seller info)
- Delete modal with archive reason selector
- `archivedListingStore` with GraphQL integration
- Auto-parses `specsJson` to `specsDisplay` object
- Flattens `location` object for easier component access

#### Files Created
**Backend:**
- `src/listings/archived-listing.entity.ts`
- `src/listings/archived-listing.service.ts`
- `src/listings/archived-listing.resolver.ts`
- `src/migrations/1762300000000-CreateArchivedListingsTable.ts`
- `src/migrations/1762400000000-AddArchivedListingIdToChats.ts`

**Frontend:**
- `app/archived-listing/[id]/page.tsx`
- `app/archived-listing/[id]/ArchivedListingDetailClient.tsx`
- `app/archived-listing/[id]/ArchivedListingDetail.module.scss`
- `stores/archivedListingStore/index.ts`
- `stores/archivedListingStore/archivedListingStore.gql.ts`
- `stores/archivedListingStore/types.ts`

#### Pending Tasks
- [ ] **LocationMap Google Maps Link Support** - Handle when user provides Google Maps link instead of province/city
- [ ] **AI Moderation Rejection Fields** - Decide if moderation fields should stay in `listing.entity.ts`

---

## 📋 MANDATORY: Form Validation & Success Toast Pattern

**⚠️ ALL NEW FORMS MUST FOLLOW THIS STANDARD ⚠️**

### Standard Form Pattern (REQUIRED)

**1. Create Validation File** (`/lib/validation/[entity]Validation.ts` or `/lib/admin/validation/[entity]Validation.ts`)

```typescript
import { z } from 'zod';

// 1. ValidationConfig - Single source of truth
export const [Entity]ValidationConfig = {
  fieldName: { minLength: 3, maxLength: 100 },
  otherField: { min: 1, max: 1000 },
};

// 2. Zod Schemas
const fieldSchema = z.string()
  .min([Entity]ValidationConfig.fieldName.minLength, 'رسالة الخطأ بالعربي')
  .max([Entity]ValidationConfig.fieldName.maxLength, 'رسالة الخطأ بالعربي');

// 3. Individual Field Validators (for real-time validation)
export const validateField = (value: string): string | undefined => {
  const result = fieldSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

// 4. Form Validator (for submit validation)
export interface ValidationErrors {
  [key: string]: string | undefined;
}

export const validateCreate[Entity]Form = (data: FormData): ValidationErrors => {
  const errors: ValidationErrors = {};
  const fieldError = validateField(data.field);
  if (fieldError) errors.field = fieldError;
  return errors;
};

// 5. Helper - Check if form has errors
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some(error => error !== undefined);
};
```

**2. Modal/Form Component Pattern**

```typescript
import { useNotificationStore } from '@/stores/notificationStore';
import { validateCreate[Entity]Form, hasValidationErrors, [Entity]ValidationConfig } from '@/lib/validation/[entity]Validation';

export const CreateEntityModal: React.FC<Props> = ({ onClose, onSubmit }) => {
  const { addNotification } = useNotificationStore();
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate using Zod
    const errors = validateCreate[Entity]Form(formData);
    setValidationErrors(errors);

    if (hasValidationErrors(errors)) {
      console.log('❌ Validation failed:', errors);
      return; // STOP - do not submit
    }

    console.log('✅ Validation passed, submitting...');
    setIsSubmitting(true);

    try {
      await onSubmit(formData);

      // ✅ SUCCESS TOAST (REQUIRED for modals that close)
      addNotification({
        type: 'success',
        title: 'نجح',
        message: 'رسالة النجاح بالعربي',
        duration: 5000,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'رسالة الخطأ بالعربي');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isVisible={true} onClose={onClose}>
      <Form onSubmit={handleSubmit} error={error || undefined}>
        <Input
          label="الحقل"
          value={formData.field}
          onChange={(e) => setFormField('field', e.target.value)}
          error={validationErrors.field}
          required
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </Form>
    </Modal>
  );
};
```

**3. Success Toast Rules**

✅ **ADD SUCCESS TOAST IF:**
- Modal closes after successful submit
- Page redirects after successful submit
- User cannot see Form success message

❌ **DO NOT ADD SUCCESS TOAST IF:**
- Form stays on same page without redirect
- Success message visible in Form component
- User can see inline success feedback (e.g., image upload confirmation)

**4. Error Display Rules**

✅ **Errors ALWAYS show in Form component at bottom** (above submit button)
❌ **NO error toasts** - errors keep modal open for user to fix

### Validation Files Status

**📁 /lib/validation/**
- ✅ `listingValidation.ts` (create/edit listing)
- ✅ `authValidation.ts` (signup + login)

**📁 /lib/admin/validation/**
- ✅ `userValidation.ts`
- ✅ `roleValidation.ts`
- ✅ `attributeValidation.ts`
- ✅ `categoryValidation.ts`
- ✅ `brandValidation.ts`
- ✅ `subscriptionValidation.ts`
- ✅ `adPackageValidation.ts`
- ✅ `adClientValidation.ts`
- ✅ `adCampaignValidation.ts`

### Key Principles

1. **One Form = One Validation File** (shared between Create/Edit)
2. **ValidationConfig = Single Source of Truth** (all limits referenced from config)
3. **Consistent Pattern** (all validation files have same structure)
4. **Zod for Validation** (TypeScript-first, automatic type inference)
5. **Arabic Error Messages** (all user-facing errors in Arabic)
6. **Success Toast for Modals** (5-second notification after modal closes)
7. **No Error Toasts** (errors stay in Form component)

---

## 🚧 CURRENT SESSION: Archive System for Sold/Deleted Listings (2025-01-30)

### 📋 Implementation Plan - Archive System with Analytics

**Goal:** Implement soft-delete archive system that preserves listings for analytics, chat history, and wishlist functionality.

**Why Archive Instead of Hard Delete:**
- ✅ Analytics: Track conversion rates, time to sell, price trends
- ✅ User History: "Your sold items" builds trust
- ✅ Chat Preservation: Users can view old chats with listing details
- ✅ Wishlist Continuity: Favorited items stay visible with status badges
- ✅ Fraud Prevention: Pattern detection across archived listings
- ✅ No Accidental Reactivation: Archived items can't be made active again

**Archive Reasons (3 statuses):**
1. `SOLD_VIA_PLATFORM` - Sold through our platform (✅ Success metric)
2. `SOLD_EXTERNALLY` - Sold outside platform (💰 Lost commission)
3. `NO_LONGER_FOR_SALE` - User removed listing (🗑️ Churn tracking)

---

### Phase 1: Core Archive System (IN PROGRESS)

**Step 1.1: Create archived_listings Table** 🔲
- Migration: `CreateArchivedListingsTable`
- Fields:
  ```typescript
  id: UUID (new UUID for archived entry)
  originalListingId: UUID (original listing.id for relations)

  // Archive metadata
  archivalReason: 'sold_via_platform' | 'sold_externally' | 'no_longer_for_sale'
  archivedAt: TIMESTAMP
  archivedBy: UUID (userId)

  // Analytics snapshot
  viewCount: INT
  wishlistCount: INT
  chatCount: INT
  bidCount: INT
  daysToSell: INT (calculated: archivedAt - createdAt)

  // Full copy of listing data
  title, description, priceMinor, images, specs, categoryId, userId, location, createdAt, updatedAt
  ```

**Step 1.2: Create Archived Listing Entity** 🔲
- File: `marketplace-backend/src/listings/archived-listing.entity.ts`
- GraphQL type definition
- Relations: user, category

**Step 1.3: Update Relations to Support Archive** 🔲
- **chats table**: Add `archivedListingId UUID` field
- **wishlist_items table**: Add `archivedListingId UUID` field
- **bids table**: Add `archivedListingId UUID` field (if needed)

**Step 1.4: Create Archive Service Method** 🔲
- File: `marketplace-backend/src/listings/listings.service.ts`
- Method: `archiveListing(listingId: string, reason: ArchivalReason, userId: string)`
- Logic:
  1. Fetch listing with relations (viewCount, wishlistCount, chatCount)
  2. Calculate daysToSell
  3. Copy to archived_listings
  4. Update related chats/wishlist with archivedListingId
  5. Delete from listings table
  6. Return archived listing

**Step 1.5: Update Delete Mutation** 🔲
- File: `marketplace-backend/src/listings/listings.resolver.ts`
- Change `deleteMyListing` to accept `archivalReason` parameter
- Call `archiveListing()` instead of hard delete

**Step 1.6: Update Frontend Delete Modal** 🔲
- File: `marketplace-frontend/components/dashboard/ListingsPanel/modals/DeleteListingModal.tsx`
- Already has 3-option UI ✅
- Update to pass `archivalReason` to backend
- Update parent handler in ListingsPanel/index.tsx

**Step 1.7: Create Archived Listing Detail Page** 🔲
- File: `marketplace-frontend/app/archived-listing/[id]/page.tsx`
- Read-only view of archived listing
- Status banner: "مباع عبر المنصة ✓" / "مباع" / "لم يعد متاحاً"
- Show full details (images, specs, description)
- Disable contact/bid buttons
- Show "Similar Listings" section

**Step 1.8: Create Backend Query for Archived Listing** 🔲
- Resolver: `getArchivedListing(id: string)`
- Returns: Full archived listing data (excluding seller contact info)

---

### Phase 2: Preserve Chat & Wishlist Relations (TODO)

**Step 2.1: Update Chat Queries** 🔲
- Modify `getMyChats` to join both `listings` and `archived_listings`
- Chat type includes: `listing` OR `archivedListing`
- Clicking archived listing → redirects to archived page

**Step 2.2: Update Wishlist Queries** 🔲
- Modify `getMyWishlist` to join both tables
- Show status badge for archived items
- Add filter: "Hide sold items"

**Step 2.3: Frontend Chat Component** 🔲
- File: `components/chat/ChatThread.tsx` (or equivalent)
- Show listing preview with status badge if archived
- Make clickable → archived listing page

**Step 2.4: Frontend Wishlist Component** 🔲
- File: `components/dashboard/WishlistPanel/index.tsx` (or equivalent)
- Show cards with status overlay for archived
- Filter toggle for hiding sold items

---

### Phase 3: User Dashboard Tabs (TODO)

**Step 3.1: Update User Listings Panel** 🔲
- File: `marketplace-frontend/components/dashboard/ListingsPanel/index.tsx`
- Add tabs:
  - **النشطة (Active)** - From `listings` table
  - **المباعة (Sold)** - From `archived_listings` where reason = sold_via_platform OR sold_externally
  - **المؤرشفة (Archived)** - From `archived_listings` where reason = no_longer_for_sale

**Step 3.2: Create Backend Queries** 🔲
- `getMySoldListings()` - Returns archived with sold reasons
- `getMyArchivedListings()` - Returns archived with no_longer_for_sale reason

---

### Phase 4: Analytics (TODO)

**Step 4.1: User Stats Page** 🔲
- Show seller metrics:
  - Total sold listings (via platform + external)
  - Conversion rate
  - Average days to sell
  - Total views/wishlists

**Step 4.2: Admin Analytics Dashboard** 🔲
- Business metrics:
  - Platform conversion rate (sold_via_platform / total)
  - External leakage rate (sold_externally / total sold)
  - Removal rate (no_longer_for_sale / total)
  - Category performance
  - Average time to sell by category

---

### Display Logic Matrix

| Feature | SOLD_VIA_PLATFORM | SOLD_EXTERNALLY | NO_LONGER_FOR_SALE |
|---------|-------------------|-----------------|---------------------|
| Public Search | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| Seller - Active Tab | ❌ Removed | ❌ Removed | ❌ Removed |
| Seller - Sold Tab | ✅ Shown | ✅ Shown | ❌ Hidden |
| Seller - Archived Tab | ❌ Hidden | ❌ Hidden | ✅ Shown |
| Buyer Wishlist | ✅ "مباع ✓" | ✅ "مباع" | ✅ "لم يعد متاحاً" |
| Chat Messages | ✅ Clickable | ✅ Clickable | ✅ Clickable |
| Archived Page | ✅ Viewable | ✅ Viewable | ✅ Viewable |
| User Analytics | ✅ Counted | ✅ Counted | ❌ Not counted |
| Admin Analytics | ✅ Success | ⚠️ Lost sale | ℹ️ Removal |

---

## 🚧 PREVIOUS SESSION: Unified Form Validation System (2025-01-30)

### ✅ COMPLETED: Form Validation System Unification + Success Toasts

**Goal:** Create consistent validation across all 32 forms in the application using Zod schemas and centralized ValidationConfig objects, with success toast notifications for modals that close/redirect.

**Problem Solved:**
- Create listing had minimum image bug (hardcoded validation values in multiple places)
- Forms had inconsistent validation patterns (some used Zod, others had custom logic)
- No single source of truth for validation rules
- Success messages disappearing when modals closed
- Difficult to maintain and change validation rules

**Solution Implemented:**

#### Phase 1: Critical Fixes for Create Listing ✅
1. ✅ **Form Component** - Moved error/success display from top to bottom (above submit button)
   - File: `components/slices/Form/Form.tsx`

2. ✅ **listingValidation.ts** - Created complete Zod validation system
   - File: `lib/validation/listingValidation.ts`
   - Features:
     - `ListingValidationConfig` - Single source of truth for all validation rules
     - Individual field validators (validateTitle, validatePriceMinor, validateImages, etc.)
     - Full form validator using Zod schemas
     - Dynamic attribute validator
     - All error messages in Arabic

3. ✅ **createListingStore** - Updated to use ValidationConfig
   - File: `stores/createListingStore/index.ts`
   - Changed: `images.length >= 3` → `images.length >= ListingValidationConfig.images.min`

4. ✅ **Create Listing Page** - Replaced custom validation with Zod
   - File: `app/dashboard/listings/create/details/page.tsx`
   - Imports: validateListingForm, validateAttribute, ListingValidationConfig
   - Uses Zod for core fields + dynamic attribute validation

#### Phase 2: Created 4 Missing Admin Validation Files ✅
1. ✅ **subscriptionValidation.ts** - Subscription plans (create/edit)
   - File: `lib/admin/validation/subscriptionValidation.ts`
   - Fields: name, title, description, price, billingCycle, maxListings, maxImagesPerListing, etc.

2. ✅ **adPackageValidation.ts** - Ad packages (create/edit)
   - File: `lib/admin/validation/adPackageValidation.ts`
   - Fields: packageName, description, adType, durationDays, impressionLimit, basePrice

3. ✅ **adClientValidation.ts** - Ad clients (create/edit)
   - File: `lib/admin/validation/adClientValidation.ts`
   - Fields: companyName, contactName, contactEmail, contactPhone, website, industry, notes

4. ✅ **adCampaignValidation.ts** - Ad campaigns (create/edit)
   - File: `lib/admin/validation/adCampaignValidation.ts`
   - Fields: campaignName, description, clientId, packageId, startDate, endDate, totalPrice
   - Special: validateDateRange() helper for date validation

#### Phase 3: Success Toast Implementation ✅
**Goal:** Add success toast notifications to all 12 forms that close modals or redirect after successful submission.

**Completed Forms (12 total):**
1. ✅ CreateSubscriptionModal - `'تم إنشاء خطة الاشتراك بنجاح'`
2. ✅ EditSubscriptionModal - `'تم تحديث خطة الاشتراك بنجاح'`
3. ✅ CreateAdPackageModal - `'تم إنشاء حزمة الإعلان بنجاح'`
4. ✅ EditAdPackageModal - `'تم تحديث حزمة الإعلان بنجاح'`
5. ✅ CreateAdClientModal - `'تم إنشاء العميل الإعلاني بنجاح'`
6. ✅ EditAdClientModal - `'تم تحديث العميل الإعلاني بنجاح'`
7. ✅ CreateAdCampaignModal - `'تم إنشاء الحملة الإعلانية بنجاح'`
8. ✅ EditAdCampaignModal - `'تم تحديث الحملة الإعلانية بنجاح'`
9. ✅ EditProfileModal - `'تم تحديث الملف الشخصي بنجاح'`
10. ✅ ChangeEmailModal - `'تم تغيير البريد الإلكتروني بنجاح'`
11. ✅ EditListingModal - `'تم تحديث الإعلان بنجاح'`
12. ✅ Create Listing Page - `'تم إنشاء الإعلان بنجاح'`

**Pattern Used:**
```typescript
import { useNotificationStore } from '@/stores/notificationStore';

const { addNotification } = useNotificationStore();

// After successful onSubmit:
addNotification({
  type: 'success',
  title: 'نجح',
  message: '[Arabic success message]',
  duration: 5000,
});
```

**Result:**
- ✅ Modal closes immediately after success
- ✅ Toast notification persists for 5 seconds
- ✅ User sees confirmation even after modal disappears
- ✅ Errors stay in Form component at bottom (no toast needed)
- ✅ Consistent UX across all forms

#### Phase 4: Updated Auth Validation (Signup + Login) ✅
1. ✅ **authValidation.ts** - Added ValidationConfig and Login validation
   - File: `lib/validation/authValidation.ts`
   - Added: `AuthValidationConfig` - Single source of truth for name/email/password limits
   - Added: `LoginFormData` interface and `validateLoginForm()` function
   - Added: `createLoginFieldValidator()` factory for Login form
   - Updated: All schemas now reference AuthValidationConfig

2. ✅ **SignupForm** - Already used Zod validation (no changes needed)
   - File: `components/AuthModal/SignupForm.tsx`
   - Status: Already implements full Zod validation with real-time validation

3. ✅ **LoginForm** - Migrated to Zod validation
   - File: `components/AuthModal/LoginForm.tsx`
   - Changed: Replaced simple `if (!email || !password)` check with Zod validation
   - Added: `validateLoginForm()` for submit validation
   - Added: `createLoginFieldValidator()` for real-time Input validation
   - Added: ValidationErrors state for field-level errors
   - Result: Login form now has same validation pattern as Signup

### Standard Validation File Pattern

**All validation files follow this structure:**

```typescript
// 1. ValidationConfig - Single source of truth for limits/rules
export const [Entity]ValidationConfig = {
  fieldName: { minLength: 3, maxLength: 100 },
  // ... other fields
};

// 2. Zod Schemas - For full validation
const fieldSchema = z.string()
  .min([Entity]ValidationConfig.fieldName.minLength, 'error message')
  .max([Entity]ValidationConfig.fieldName.maxLength, 'error message');

// 3. Individual Field Validators - For real-time validation
export const validateField = (value: string): string | undefined => {
  const result = fieldSchema.safeParse(value);
  return result.success ? undefined : result.error.errors[0]?.message;
};

// 4. Form Validators - For submit validation
export const validateCreate[Entity]Form = (data: FormData): ValidationErrors => {
  const errors: ValidationErrors = {};
  const fieldError = validateField(data.field);
  if (fieldError) errors.field = fieldError;
  return errors;
};

// 5. Field Validator Factory - For Input component `validate` prop
export const create[Entity]FieldValidator = (fieldName: string) => {
  return (value: any): string | undefined => {
    switch (fieldName) {
      case 'field': return validateField(value);
      // ...
    }
  };
};

// 6. Helper - Check if form has errors
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some(error => error !== undefined);
};
```

### Validation Files Status

**📁 /lib/validation/**
- ✅ `listingValidation.ts` (create/edit listing)
- ✅ `authValidation.ts` (signup + login) - **UPDATED with ValidationConfig**

**📁 /lib/admin/validation/**
- ✅ `userValidation.ts` (already existed)
- ✅ `roleValidation.ts` (already existed)
- ✅ `attributeValidation.ts` (already existed)
- ✅ `categoryValidation.ts` (already existed)
- ✅ `brandValidation.ts` (already existed)
- ✅ `subscriptionValidation.ts` (NEW - created today)
- ✅ `adPackageValidation.ts` (NEW - created today)
- ✅ `adClientValidation.ts` (NEW - created today)
- ✅ `adCampaignValidation.ts` (NEW - created today)

### Next Steps (For Future Sessions)

**Phase 3: Migrate Forms to Use Validation Files**
- Update admin forms that don't use validation yet (subscriptions, ad packages, ad clients, ad campaigns)
- Update user dashboard forms (edit profile, change email, change password)
- Update edit listing modal to use listingValidation.ts

**Phase 4: Add Real-Time Validation**
- Add `validate` prop to Input components in forms
- Users see errors as they type (using field validator factories)

**Phase 5: Testing**
- Test all 32 forms for consistent behavior
- Verify error messages display correctly (inline + form-level)

### Key Principles

1. **One Form = One Validation File** (shared between Create/Edit)
2. **ValidationConfig = Single Source of Truth** (all limits referenced from config)
3. **Consistent Pattern** (all validation files have same structure)
4. **Zod for Validation** (TypeScript-first, automatic type inference)
5. **Arabic Error Messages** (all user-facing errors in Arabic)

---

## 🚧 PREVIOUS SESSION: AI Content Moderation System - Final Cleanup (2025-01-30)

### ⚠️ PENDING DECISION: listing.entity.ts Moderation Fields
**Before continuing, decide on these fields in `listing.entity.ts`:**
- `moderationFlags` - DELETE? (technical debug data, never displayed)
- `moderationStatus` - KEEP (shows AI vs current status)
- `moderationScore` - KEEP (essential for AI decision logic)
- `reviewedBy` + `reviewedAt` - KEEP (shows human vs AI decision)

### 📋 TODO List - Next Tasks

**Priority 1: Finish AI Moderation System**
- [ ] **Finalize listing.entity.ts fields** (delete moderationFlags?)
- [ ] **Test edit listing with AI re-moderation** (does AI re-run on edit?)
- [ ] **Admin edit listing workflow** (manual approval/rejection)

**Priority 2: Bidding System**
- [ ] **Implement bidding logic on listing detail page**
  - Show bidding UI if `allowBidding` is true
  - Allow users to place bids
  - Display current highest bid
  - Real-time bid updates
  - Bidding history
  - Notifications for bid changes

**Priority 3: View Count / Review Analytics**
- [ ] **Track listing view count**
  - Increment counter when user views listing detail page
  - Display view count on listing cards
  - Analytics for seller dashboard

**Priority 4: User Dashboard Features**
- [ ] **Wishlist/Favorites System**
  - Dashboard page: `/dashboard/wishlist`
  - Show all listings user has liked
  - Quick actions: remove from wishlist, view listing
  - Empty state when no favorites

- [ ] **Chat/Messaging System**
  - Dashboard page: `/dashboard/messages`
  - Show all chat threads
  - Display threads where user contacted someone about a listing
  - Display threads where someone contacted user about their listing
  - Real-time messaging
  - Unread message indicators
  - Thread preview with last message

---

## ✅ COMPLETED: AI Content Moderation System - Create Listing (2025-01-30)

### Implementation Plan - AI Moderation with Toggle

**Goal:** Add AI-powered content moderation for listings with admin override capability

**Key Requirements:**
1. ✅ AI moderation toggle in app settings (on/off switch via Liskov pattern)
2. ✅ If AI disabled → All listings go to PENDING_APPROVAL (human review required)
3. ✅ If AI enabled → Smart 3-tier system:
   - Safe (90%+) → ACTIVE (auto-approve)
   - Suspicious (50-89%) → PENDING_APPROVAL (human review)
   - Unsafe (90%+) → DRAFT (auto-reject with AI reason)
4. ✅ Rejection reasons enum (backend common/enums + frontend metadata)
5. ✅ Admin can send rejection messages to users
6. ✅ User sees rejection reason in dashboard
7. ❌ AI NEVER bans users (admin-only action)

---

### Step-by-Step Implementation Tasks

#### Phase 1: Database & Enums (Backend Foundation)

**Task 1.1: Create Rejection Reasons Enum**
- File: `marketplace-backend/src/common/enums/rejection-reason.enum.ts`
- Values:
  ```typescript
  UNCLEAR_IMAGES = "unclear_images"          // صور غير واضحة
  MISSING_INFO = "missing_info"              // معلومات ناقصة
  PROHIBITED_CONTENT = "prohibited_content"  // محتوى مخالف
  UNREALISTIC_PRICE = "unrealistic_price"    // سعر غير واقعي
  INAPPROPRIATE_IMAGES = "inappropriate_images" // صور مخالفة
  PROFANITY = "profanity"                    // ألفاظ نابية
  CONTACT_INFO = "contact_info"              // معلومات اتصال في الوصف
  SCAM_SUSPECTED = "scam_suspected"          // اشتباه في احتيال
  DUPLICATE = "duplicate"                    // إعلان مكرر
  OTHER = "other"                            // سبب آخر
  ```

**Task 1.2: Add Moderation Fields to Listings Table**
- Migration: `AddModerationFieldsToListings`
- Fields:
  ```typescript
  moderationStatus: 'auto_approved' | 'auto_rejected' | 'pending_review' | 'human_approved' | 'human_rejected' | null
  moderationScore: number | null (0-100, AI confidence)
  moderationFlags: string[] | null (JSON array: ["nsfw", "profanity"])
  rejectionReason: RejectionReason | null
  rejectionMessage: string | null (custom admin message)
  reviewedBy: string | null (admin user ID)
  reviewedAt: timestamp | null
  ```

**Task 1.3: Add Violation Tracking to Users Table**
- Migration: `AddViolationTrackingToUsers`
- Fields:
  ```typescript
  violationCount: number (default 0)
  lastViolationAt: timestamp | null
  warningLevel: 'none' | 'low' | 'medium' | 'high' (default 'none')
  ```

**Task 1.4: Add AI Toggle to App Settings**
- Migration: `AddAiModerationToggle`
- Add to `app_settings` table:
  ```typescript
  aiModerationEnabled: boolean (default false)
  ```

---

#### Phase 2: AI Service (Backend Core Logic)

**Task 2.1: Install OpenAI SDK**
```bash
cd marketplace-backend
npm install openai
```

**Task 2.2: Add OpenAI API Key to .env**
```
OPENAI_API_KEY=sk-...
```

**Task 2.3: Create AI Moderation Service**
- File: `marketplace-backend/src/listings/services/ai-moderation.service.ts`
- Methods:
  - `checkTextContent(title, description)` → Uses OpenAI Moderation API
  - `checkImages(imageKeys[])` → Uses Cloudflare Images AI
  - `calculateModerationScore()` → Combines text + image scores
  - `determineModerationStatus()` → Returns: auto_approved | pending_review | auto_rejected
  - `getViolationFlags()` → Returns array of flags

**Task 2.4: Create App Settings Service**
- File: `marketplace-backend/src/app-settings/app-settings.service.ts`
- Method: `isAiModerationEnabled()` → boolean

---

#### Phase 3: Integration (Backend Mutations)

**Task 3.1: Update createMyListing Mutation**
- File: `marketplace-backend/src/listings/listings.resolver.ts`
- Flow:
  ```typescript
  1. Check if AI moderation enabled (app settings)
  2. If disabled → status = PENDING_APPROVAL, moderationStatus = 'pending_review'
  3. If enabled:
     - Run AI moderation check
     - Set status based on AI score:
       - 90%+ safe → ACTIVE, moderationStatus = 'auto_approved'
       - 50-89% → PENDING_APPROVAL, moderationStatus = 'pending_review'
       - <50% unsafe → DRAFT, moderationStatus = 'auto_rejected'
     - Save moderationScore, moderationFlags
     - If auto_rejected: set rejectionReason from AI
     - If violation detected: increment user.violationCount
  ```

**Task 3.2: Update updateMyListing Mutation**
- Add rejection reason + message fields
- Admin can set: status, rejectionReason, rejectionMessage
- Track reviewedBy + reviewedAt

---

#### Phase 4: GraphQL Schema Updates

**Task 4.1: Add Rejection Reasons to Metadata Resolver**
- File: `marketplace-backend/src/metadata/metadata.resolver.ts`
- Add query: `getRejectionReasons()` → returns enum values array
- Pattern: Same as existing enum queries (listingStatuses, userRoles, etc.)

**Task 4.2: Update Listing Type**
- Add fields to GraphQL Listing type:
  ```graphql
  moderationStatus: String
  moderationScore: Float
  moderationFlags: [String!]
  rejectionReason: RejectionReason
  rejectionMessage: String
  reviewedBy: String
  reviewedAt: DateTime
  ```

---

#### Phase 5: Frontend Metadata Store

**Task 5.1: Add Rejection Reasons to Metadata Store**
- File: `marketplace-frontend/stores/metadataStore/index.ts`
- Add state: `rejectionReasons: string[]`
- Add fetch method: `fetchRejectionReasons()`

**Task 5.2: Add Rejection Reason Labels**
- File: `marketplace-frontend/constants/metadata-labels.ts`
- Add:
  ```typescript
  export const REJECTION_REASON_LABELS: Record<string, string> = {
    unclear_images: 'صور غير واضحة',
    missing_info: 'معلومات ناقصة',
    prohibited_content: 'محتوى مخالف',
    // ... etc
  };
  ```

---

#### Phase 6: Admin Dashboard Updates

**Task 6.1: Update ListingsDashboardPanel (Admin)**
- File: `marketplace-frontend/components/admin/AdminDashboardPanel/ListingsDashboardPanel/index.tsx`
- Add "Reject with Reason" action:
  - Dropdown: Select rejection reason (from metadata)
  - Textarea: Optional custom message
  - Button: "رفض الإعلان"
  - On submit: updateListing(id, { status: DRAFT, rejectionReason, rejectionMessage })

**Task 6.2: Show Moderation Info in Admin Table**
- Add columns:
  - AI Score (if available)
  - Moderation Status
  - Flags (badges)

---

#### Phase 7: User Dashboard Updates

**Task 7.1: Show Rejection Reason in User Listings**
- File: `marketplace-frontend/components/dashboard/ListingsPanel/index.tsx`
- If listing.status === DRAFT && listing.rejectionReason:
  - Show red banner: "إعلانك تم رفضه"
  - Display reason: getLabel(rejectionReason, REJECTION_REASON_LABELS)
  - Display custom message (if exists)
  - Button: "تعديل الإعلان" → Opens edit modal

**Task 7.2: Add Status Messages After Submission**
- File: `marketplace-frontend/app/dashboard/listings/create/details/page.tsx`
- After successful creation, check status:
  - ACTIVE: "تم نشر إعلانك بنجاح ✅"
  - PENDING_APPROVAL: "إعلانك قيد المراجعة (خلال 24 ساعة) ⏳"
  - DRAFT: "تم رفض إعلانك - السبب: [reason] ❌"

---

#### Phase 8: App Settings UI (Admin Toggle)

**Task 8.1: Add AI Toggle in Admin Settings**
- File: `marketplace-frontend/components/admin/AdminDashboardPanel/SettingsPanel/index.tsx`
- Add switch:
  - Label: "تفعيل المراجعة الآلية (AI)"
  - Description: "إذا تم التفعيل، سيتم فحص الإعلانات تلقائياً. إذا تم التعطيل، ستحتاج جميع الإعلانات إلى مراجعة يدوية."
  - Save to app_settings

---

#### Phase 9: Testing

**Task 9.1: Test AI Moderation**
- Create listing with clean content → Should be ACTIVE
- Create listing with profanity → Should be DRAFT or PENDING_APPROVAL
- Create listing with NSFW image → Should be DRAFT or PENDING_APPROVAL

**Task 9.2: Test Admin Rejection**
- Admin rejects listing with reason
- User sees rejection message
- User edits and resubmits

**Task 9.3: Test AI Toggle**
- Disable AI → All listings go to PENDING_APPROVAL
- Enable AI → Listings use AI scoring

---

### Files to Create/Modify

**Backend (New Files):**
1. `src/common/enums/rejection-reason.enum.ts`
2. `src/listings/services/ai-moderation.service.ts`
3. `src/migrations/[timestamp]-AddModerationFieldsToListings.ts`
4. `src/migrations/[timestamp]-AddViolationTrackingToUsers.ts`
5. `src/migrations/[timestamp]-AddAiModerationToggle.ts`

**Backend (Modified Files):**
1. `src/listings/listings.resolver.ts` - Update createMyListing/updateMyListing
2. `src/listings/listing.entity.ts` - Add moderation fields
3. `src/users/user.entity.ts` - Add violation tracking
4. `src/metadata/metadata.resolver.ts` - Add getRejectionReasons query
5. `src/app-settings/app-settings.service.ts` - Add AI toggle

**Frontend (Modified Files):**
1. `stores/metadataStore/index.ts` - Add rejectionReasons
2. `constants/metadata-labels.ts` - Add REJECTION_REASON_LABELS
3. `components/admin/AdminDashboardPanel/ListingsDashboardPanel/index.tsx` - Add reject action
4. `components/dashboard/ListingsPanel/index.tsx` - Show rejection messages
5. `app/dashboard/listings/create/details/page.tsx` - Status messages after submit
6. `components/admin/AdminDashboardPanel/SettingsPanel/index.tsx` - AI toggle

---

## 🚀 TODO List - Next Features

### Priority 1: Create/Edit Listing Improvements
- [x] **Fix validation for create/edit listing forms** ✅ COMPLETED
- [x] **Fix image upload in edit listing** ✅ COMPLETED
- [ ] **AI Content Moderation System** 🚧 IN PROGRESS

### Priority 2: Bidding System
- [ ] **Implement bidding logic on listing detail page**
  - Show bidding UI if `allowBidding` is true
  - Allow users to place bids
  - Display current highest bid
  - Real-time bid updates
  - Bidding history
  - Notifications for bid changes

### Priority 3: User Dashboard Features
- [ ] **Wishlist/Favorites System**
  - Dashboard page: `/dashboard/wishlist`
  - Show all listings user has liked
  - Quick actions: remove from wishlist, view listing
  - Empty state when no favorites

- [ ] **Chat/Messaging System**
  - Dashboard page: `/dashboard/messages`
  - Show all chat threads
  - Display threads where user contacted someone about a listing
  - Display threads where someone contacted user about their listing
  - Real-time messaging
  - Unread message indicators
  - Thread preview with last message

---

## Session: 2025-01-29 (Province System & TypeScript Fixes)

### Completed Today

#### 1. Province Cleanup - Dynamic Enum System ✅

**Problem:** Provinces were hardcoded in frontend components, violating single source of truth principle.

**Solution:** Centralized province management using backend enum + metadata API.

**Backend Changes:**
1. **Created `/common/enums/syria-provinces.enum.ts`**:
   - `SyriaProvince` enum (14 provinces with English keys)
   - `SYRIA_PROVINCE_ARABIC_NAMES` mapping (English → Arabic)
   - `SYRIA_PROVINCE_COORDINATES` for map display

2. **Created `/common/metadata/types/province.type.ts`**:
   - `Province` GraphQL type with `key`, `nameAr`, `coordinates`

3. **Updated `/common/metadata/metadata.resolver.ts`**:
   - Added `getProvinces()` query
   - Returns provinces with Arabic names and coordinates

**Frontend Changes:**
1. **Updated `metadataStore/index.ts`**:
   - Added `Province` interface
   - Added `provinces: Province[]` state
   - Added `fetchLocationMetadata()` method
   - Integrated into `fetchAllMetadata()`

2. **Removed hardcoded PROVINCES arrays**:
   - `app/dashboard/listings/create/details/page.tsx` (lines 52-68 removed)
   - `components/dashboard/ListingsPanel/modals/EditListingModal.tsx` (lines 88-104 removed)

3. **Added useEffect to fetch provinces**:
   - Both create and edit forms now fetch provinces on mount if not loaded

**Map Provider Fix:**
- Updated `OpenStreetMapProvider.tsx` to handle both English keys and Arabic names
- Added `PROVINCE_ARABIC_TO_ENGLISH` reverse mapping
- Fixed map display for user-created listings with Arabic province names

**Result:**
- ✅ Single source of truth in backend
- ✅ No hardcoded province lists in frontend
- ✅ Easy to expand to other countries (Jordan, Lebanon)
- ✅ Map component works with both English and Arabic province values

#### 2. TypeScript Error Fixes ✅

**Fixed 3 TypeScript errors:**

1. **[Input.tsx:310-313](components/slices/Input/Input.tsx:310-313)** - `formatNumberWithCommas` type error
   - **Problem:** `inputProps.value` can be `string | number | readonly string[]`, but function expects `string | number`
   - **Fix:** Added type guard `!Array.isArray(inputProps.value)` and explicit type assertion
   ```typescript
   let displayValue: string | number | readonly string[] | undefined = inputProps.value;
   if (type === 'number' && inputProps.value && !Array.isArray(inputProps.value)) {
     displayValue = formatNumberWithCommas(inputProps.value as string | number);
   }
   ```

2. **[createListingStore/index.ts:268-270](stores/createListingStore/index.ts:268-270)** - FormData.append error
   - **Problem:** `imageItem.file` can be `undefined`, but FormData requires `Blob | File`
   - **Fix:** Added type guard to skip images without files
   ```typescript
   for (const imageItem of formData.images) {
     if (!imageItem.file) continue; // Skip already-uploaded images
     // ... upload logic
   }
   ```

3. **[EditListingModal.tsx:313](components/dashboard/ListingsPanel/modals/EditListingModal.tsx:313)** - Same FormData issue
   - **Fix:** Added explicit type assertion after type guard
   ```typescript
   if (!imageItem.file) continue;
   const file: File = imageItem.file; // Type assertion
   formDataUpload.append('file', file);
   ```

#### 3. Attribute Validation Fix ✅

**Problem:** Validation error messages showed "undefined مطلوب" instead of attribute names.

**Root Cause:** Code used `attribute.label` (doesn't exist) instead of `attribute.name` (Arabic label from backend).

**Fixed in 2 locations:**
- Line 201: Validation error message in `handleSubmit`
- Line 495: Inline error message in `renderAttributeField`

**Change:**
```typescript
// Before (wrong):
validationErrors.push(`${attribute.label} مطلوب`);

// After (correct):
validationErrors.push(`${attribute.name} مطلوب`);
```

#### 4. Category Selection UX Improvement ✅

**Problem:** Required two clicks - select category, then click "Next" button.

**Solution:** Navigate immediately after category selection (one-click flow).

**Changes in `app/dashboard/listings/create/page.tsx`:**
- Removed `selectedCategory` state
- Removed "Next" button
- Created `handleCategorySelect` that navigates immediately
- Renamed `.actions` to `.cancelButton` in SCSS

**Result:** Faster, more intuitive category selection.

#### 5. SCSS & Cache Issues ✅

**Problem:** `CreateListing.module.scss` had persistent SASS compilation errors.

**Root Cause:** Webpack cache issue after rapid file changes.

**Fix:**
- Added missing `.cancelButton` class
- Uncommented `.formFields` class
- Cleared `.next` cache
- Restarted dev servers

**Result:** Both apps running error-free on ports 3000 (frontend) and 4000 (backend).

### Files Modified (Total: 9 files)

**Backend (2 files):**
- `src/common/enums/syria-provinces.enum.ts` (CREATED)
- `src/common/metadata/types/province.type.ts` (CREATED)
- `src/common/metadata/metadata.resolver.ts` (Modified)

**Frontend (7 files):**
- `stores/metadataStore/index.ts` (Modified)
- `stores/metadataStore/metadataStore.gql.ts` (Modified)
- `stores/createListingStore/index.ts` (Modified)
- `stores/createListingStore/types.ts` (Modified)
- `components/slices/Input/Input.tsx` (Modified)
- `components/dashboard/ListingsPanel/modals/EditListingModal.tsx` (Modified)
- `app/dashboard/listings/create/details/page.tsx` (Modified)
- `app/dashboard/listings/create/page.tsx` (Modified)
- `app/dashboard/listings/create/CreateListing.module.scss` (Modified)

### Lessons Learned

**What NOT to do:**
- ❌ Don't change backend validation rules to "fix" frontend issues
- ❌ Don't add complex validation logic when the form was already working
- ❌ Don't add new GraphQL fields without understanding the full schema
- ❌ Don't make multiple changes simultaneously - increases debugging complexity

**What worked:**
- ✅ Revert changes when overcomplicating things
- ✅ Trust the user when they say "it was working before"
- ✅ Keep frontend and backend in sync (types, queries, fields)
- ✅ Use type guards and assertions properly for TypeScript narrowing

---

## Session: 2025-01-25 (Google AdSense Fallback + IAB Ad Dimensions)

### Completed Today

#### Google AdSense Fallback System

**Implementation:** Complete fallback system for showing Google AdSense ads when custom ads are not available.

**Backend Changes:**

1. **[ad-network-settings.resolver.ts](marketplace-backend/src/ad-network-settings/ad-network-settings.resolver.ts:11-59)**
   - Added `@Public()` GraphQL query `getAdSenseSettings`
   - Fixed GraphQL type definitions with explicit type annotations:
     - `AdSenseSlot`: `@Field(() => String)` and `@Field(() => Boolean)`
     - `AdSenseSettings`: `@Field(() => String, { nullable: true })`
   - Returns AdSense configuration (clientId, slot IDs, enabled flags)

2. **GraphQL Schema:**
   ```graphql
   type AdSenseSlot {
     id: String!
     enabled: Boolean!
   }

   type AdSenseSettings {
     clientId: String
     bannerSlot: AdSenseSlot
     betweenListingsSlot: AdSenseSlot
     videoSlot: AdSenseSlot
   }

   query getAdSenseSettings: AdSenseSettings
   ```

**Frontend Changes:**

1. **[adsStore/index.ts](marketplace-frontend/stores/adsStore/index.ts)** - Added AdSense settings state and fetch method
2. **[adsStore.gql.ts](marketplace-frontend/stores/adsStore/adsStore.gql.ts)** - Added `GET_ADSENSE_SETTINGS_QUERY`
3. **[GoogleAdSense.tsx](marketplace-frontend/components/ads/GoogleAdSense/GoogleAdSense.tsx)** (NEW) - Component for rendering Google AdSense ads
4. **[AdContainer.tsx](marketplace-frontend/components/ads/AdContainer/AdContainer.tsx:121-166)** - Implemented fallback logic:
   - Priority 1: Custom ads if available
   - Priority 2: Google AdSense if enabled in admin settings
   - Priority 3: Render nothing
   - Maps ad types to slots: BANNER→bannerSlot, VIDEO→videoSlot, BETWEEN_LISTINGS→betweenListingsSlot

**How It Works:**
- Admin configures AdSense in Ad Network Settings dashboard (clientId, slot IDs, enabled flags)
- Frontend fetches settings via public GraphQL query
- When custom ad not available, checks if AdSense is enabled for that ad type
- Renders GoogleAdSense component with appropriate slot ID
- Admin can disable AdSense per ad type via enabled flags

#### IAB Standard Ad Dimensions Implementation

**Problem:** Ad components were using incorrect dimensions (1200x200) instead of IAB standard sizes.

**Solution:** Updated all ad components and Cloudflare image optimization to use IAB standard dimensions.

**Cloudflare Variants Created:**
- `adBannerDesk`: 970x90 (IAB Super Leaderboard)
- `adBannerMob`: 300x250 (IAB Medium Rectangle)
- `adCard`: 300x250 (IAB Medium Rectangle)
- `adVideoDesk`: 1280x720 (16:9 HD)
- `adVideoMob`: 720x720 (1:1 Square)

**Files Modified:**

1. **[cloudflare-images.ts](marketplace-frontend/utils/cloudflare-images.ts:228-297)** - Added `optimizeAdImage()` function
   - Maps ad types to Cloudflare variants
   - Supports development mode with Unsplash URLs
   - Auto-detects device type (desktop/mobile)

2. **[AdBanner.tsx](marketplace-frontend/components/ads/AdBanner/AdBanner.tsx)**
   - Added mobile detection via resize listener
   - Dynamic dimensions: 970x90 (desktop) or 300x250 (mobile)
   - Uses `optimizeAdImage()` to fetch correct variant

3. **[AdCard.tsx](marketplace-frontend/components/ads/AdCard/AdCard.tsx)**
   - Uses `optimizeAdImage()` with 'card' type (300x250)

4. **[AdCard.module.scss](marketplace-frontend/components/ads/AdCard/AdCard.module.scss:31)**
   - Updated aspect-ratio from 3:2 to 6:5 (300x250)

5. **[AdVideo.tsx](marketplace-frontend/components/ads/AdVideo/AdVideo.tsx)**
   - Added mobile detection
   - Uses `optimizeAdImage()` for responsive video variants

6. **[AdVideo.module.scss](marketplace-frontend/components/ads/AdVideo/AdVideo.module.scss:12-20)**
   - Added `.videoContainer` with responsive aspect-ratio
   - Desktop: 16:9 (1280x720)
   - Mobile: 1:1 (720x720)

**Technical Details:**

```typescript
// Cloudflare variant mapping
const variantMap = {
  banner: {
    desktop: 'adBannerDesk',  // 970x90
    mobile: 'adBannerMob',    // 300x250
  },
  card: {
    desktop: 'adCard',        // 300x250
    mobile: 'adCard',         // 300x250
  },
  video: {
    desktop: 'adVideoDesk',   // 1280x720
    mobile: 'adVideoMob',     // 720x720
  },
};
```

**Result:**
- ✅ All ads now use IAB standard dimensions
- ✅ Responsive: Desktop and mobile variants switch automatically
- ✅ Cloudflare optimization: Images served via correct variants
- ✅ Development mode: Unsplash URLs optimized with correct dimensions

#### Files Modified Summary

**Backend (2 files):**
- `ad-network-settings.resolver.ts` - Added public AdSense settings query
- `ad-network-settings.service.ts` - AdSense settings fetch method (already existed)

**Frontend (9 files):**
- `stores/adsStore/index.ts` - AdSense state management
- `stores/adsStore/adsStore.gql.ts` - AdSense GraphQL query
- `components/ads/GoogleAdSense/GoogleAdSense.tsx` (NEW) - Google ads component
- `components/ads/GoogleAdSense/GoogleAdSense.module.scss` (NEW)
- `components/ads/GoogleAdSense/index.ts` (NEW)
- `components/ads/AdContainer/AdContainer.tsx` - Fallback logic
- `components/ads/AdBanner/AdBanner.tsx` - IAB dimensions + optimization
- `components/ads/AdCard/AdCard.tsx` - IAB dimensions + optimization
- `components/ads/AdCard/AdCard.module.scss` - Aspect ratio fix
- `components/ads/AdVideo/AdVideo.tsx` - IAB dimensions + optimization
- `components/ads/AdVideo/AdVideo.module.scss` - Responsive aspect ratios
- `utils/cloudflare-images.ts` - Ad image optimization function

**Total: 11 files modified, 3 files created**

---

## Session: 2025-01-25 (Enum Case Mismatch Fixes - Continuation)

### Completed Today

#### Backend Compilation Fixes After Enum Centralization

**Problem:** After centralizing all enums to `/common/enums/`, backend had 5 TypeScript compilation errors due to incorrect imports mixing entities with enums.

**Solution:** Fixed import statements to properly separate entity imports from enum imports.

**Files Fixed:**
1. **[bidding.service.ts](marketplace-backend/src/listings/bidding.service.ts)**
   - Fixed: `Listing` entity was being imported from enums
   - Separated: Import entity from `./listing.entity.js`, enums from `../common/enums/`

2. **[listings.service.ts](marketplace-backend/src/listings/listings.service.ts)**
   - Fixed: `Listing`, `Currency`, `ListingStatus` all mixed in one import
   - Separated: Entity from `./listing.entity.js`, enums from common

3. **[listings-filter.input.ts](marketplace-backend/src/listings/dto/listings-filter.input.ts)**
   - Fixed: `Currency`, `ListingStatus` imported from entity file
   - Consolidated: All enum imports to `../../common/enums/index.js`

4. **[user-subscription-payment.service.ts](marketplace-backend/src/user-subscriptions/user-subscription-payment.service.ts)**
   - Fixed: `UserSubscriptionTransactionStatus` imported from entity
   - Changed: Import from `../common/enums/index.js`

**Result:** ✅ Backend compiled successfully with 0 errors

#### Frontend GraphQL Enum Case Mismatch Fixes

**Problem:** GraphQL schema expects uppercase enum KEYS (e.g., `ACTIVE`), but frontend was sending lowercase values from metadata endpoint (e.g., `active`), causing validation errors.

**Root Cause:**
- Database stores lowercase VALUES: `'active'`, `'draft'`, `'pending'`
- Metadata resolver returns lowercase VALUES (correct)
- GraphQL schema exposes uppercase KEYS: `ACTIVE`, `DRAFT`, `PENDING`
- Frontend gets lowercase from metadata but GraphQL validates against uppercase KEYS

**Standard Fix Pattern Established:**
When sending enum values from frontend to GraphQL, convert to uppercase using `.toUpperCase()`:

```typescript
// Example pattern:
status: statusFilter ? statusFilter.toUpperCase() : undefined
```

**Files Fixed:**

1. **[ListingsDashboardPanel/index.tsx](marketplace-frontend/components/admin/AdminDashboardPanel/ListingsDashboardPanel/index.tsx)** (Line 83)
   - **Error:** `Variable "$filter" got invalid value "active" at "filter.status"; Value "active" does not exist in "ListingStatus" enum.`
   - **Fix:** Added `.toUpperCase()` to status filter before sending to GraphQL
   - **Code:** `status: statusFilter ? statusFilter.toUpperCase() : undefined`

2. **[AuditDashboardPanel/index.tsx](marketplace-frontend/components/admin/AdminDashboardPanel/AuditDashboardPanel/index.tsx)** (Lines 54-65, 133-145)
   - **Error:** `invalid input syntax for type uuid: "superadmin"` - Search term sent to both `userEmail` AND `entityId` fields
   - **Root Cause:** Not enum-related, but UUID validation error
   - **Fix:** Added UUID format detection using regex
   - **Logic:**
     - If searchTerm matches UUID pattern → send to `entityId` only
     - If searchTerm is text (email/username) → send to `userEmail` only
   - **Pattern:** `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`

**Standard Enum Case Fix Pattern (For Future Reference):**

When you encounter enum case mismatch errors in the future:

1. **Identify the Error Pattern:**
   - Error message: `Value "lowercase" does not exist in "EnumName" enum. Did you mean the enum value "UPPERCASE"?`

2. **Locate the Filter/Input:**
   - Find where enum value is being sent to GraphQL (usually in `setFilters()` or mutation input)

3. **Apply the Fix:**
   ```typescript
   // BEFORE (causes error):
   status: statusFilter || undefined

   // AFTER (fixed):
   status: statusFilter ? statusFilter.toUpperCase() : undefined
   ```

4. **Test:**
   - Verify dropdown/select still shows Arabic labels correctly
   - Verify GraphQL accepts the uppercase value
   - Check database still stores lowercase values

**Why This Works:**
- Frontend displays: Lowercase values with Arabic labels from metadata
- Frontend sends: Uppercase values to match GraphQL schema
- GraphQL validates: Uppercase KEYS from schema
- Database stores: Lowercase VALUES (unchanged)

**Files Modified (Total: 6)**
- Backend: 4 files (import fixes)
- Frontend: 2 files (enum case + UUID validation)

#### Client-Side Search and Filtering Implementation

**Problem:** User reported that Roles and Brands dashboards had search/filter UI elements but they weren't actually working.

**Root Cause:** The UI elements existed (search inputs, status dropdowns) but no filtering logic was implemented. The state variables were declared but never used.

**Solution:** Implemented client-side filtering using JavaScript's `.filter()` method on the data arrays.

**Implementation Pattern:**

```typescript
// 1. Add filtering logic after data is loaded
const filteredItems = items.filter(item => {
  // Search filter (name or description)
  const matchesSearch = !searchTerm ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase());

  // Status filter
  const matchesStatus = !statusFilter ||
    (statusFilter === 'active' && item.isActive) ||
    (statusFilter === 'inactive' && !item.isActive);

  return matchesSearch && matchesStatus;
});

// 2. Replace array in rendering
{filteredItems.map(item => (...))}

// 3. Update result count display
النتيجة: {filteredItems.length} من {items.length}

// 4. Update empty state message
{searchTerm || statusFilter ? 'لم يتم العثور على نتائج مطابقة للبحث' : 'لم يتم العثور على أي عناصر'}
```

**Files Fixed:**

1. **[RolesDashboardPanel/index.tsx](marketplace-frontend/components/admin/AdminDashboardPanel/RolesDashboardPanel/index.tsx)** (Lines 61-74, 199, 261-266, 280)
   - **Added:** `filteredRoles` computed from `roles` array with search and status filtering
   - **Search:** Matches role name or description (case-insensitive)
   - **Status Filter:** Filters by `isActive` boolean (active/inactive)
   - **Result Count:** Shows "النتيجة: X من Y" (filtered vs total)
   - **Empty State:** Different message when filters are active
   - **Replaced:** All `roles.map()` and `roles.length` with `filteredRoles`

2. **[BrandsDashboardPanel/index.tsx](marketplace-frontend/components/admin/AdminDashboardPanel/BrandsDashboardPanel/index.tsx)** (Lines 237-246, 411-418, 442, 505)
   - **Added:** `filteredBrands` computed from `brands` array with source and status filtering
   - **Source Filter:** Filters by `source` field (manual/sync)
   - **Status Filter:** Filters by `status` field (active/archived)
   - **Note:** Search already worked via backend (connected to `searchTerm` state)
   - **Empty State:** Conditional message based on active filters
   - **Replaced:** Table rendering uses `filteredBrands.map()`

**Key Differences:**

| Dashboard | Search | Filters | Implementation |
|-----------|--------|---------|----------------|
| Roles | Client-side (name, description) | Status (active/inactive) | Pure client-side |
| Brands | Backend (via API) | Source + Status (client-side) | Hybrid approach |
| Listings | Backend (via API) | Status (client-side .toUpperCase()) | Hybrid approach |

**Why Client-Side Filtering:**
- No backend filter support in Roles resolver
- Small data sets (typically < 100 items)
- Instant filtering without API calls
- Simple implementation for boolean/enum filters

**Files Modified (Total: 2)**
- Frontend: 2 files (client-side filtering logic)

#### Public Listings Store Enum Fix

**Problem:** After seed refresh, user reported listings not showing on public pages (`http://localhost:3000/car`). Error in console: `Variable "$filter" got invalid value "active" at "filter.status"; Value "active" does not exist in "ListingStatus" enum.`

**Root Cause:** Public listings store ([listingsStore/index.ts](marketplace-frontend/stores/listingsStore/index.ts)) had hardcoded lowercase `status: "active"` being sent to GraphQL on line 194.

**Solution:** Changed to uppercase `status: "ACTIVE"` to match GraphQL schema.

**File Fixed:**
- **[listingsStore/index.ts](marketplace-frontend/stores/listingsStore/index.ts)** (Line 194)
  - **Changed:** `status: "active"` → `status: "ACTIVE"`
  - **Note:** This is the public-facing store used by the car listings page, different from admin store

**Critical Distinction:**
- **Admin Dashboard Store**: Already fixed (uses `.toUpperCase()` on filter values from metadata)
- **Public Listings Store**: Had hardcoded lowercase value - now fixed

**Files Modified (Total: 1)**
- Frontend: 1 file (public listings store enum fix)

**Total Session Changes: 9 files**
- Backend: 4 files (import fixes)
- Frontend: 5 files (enum case fixes + client-side filtering)

---

## Session: 2025-01-24 (COMPREHENSIVE ENUM STANDARDIZATION - IN PROGRESS)

### 🎯 Professional Enum System - Complete Cleanup & Standardization

**WHY THIS IS NEEDED:**
- User found enum error in dashboard panel randomly while fixing seeder
- Enums scattered across entity files (no single source of truth)
- GraphQL returns uppercase KEYS but database has lowercase VALUES
- Frontend has hardcoded enum values and duplicate labels
- Future developers need a clear standard to follow

**THE COMPLETE PROBLEM:**

1. **Scattered Enums** - Found in multiple entity files, not centralized
2. **GraphQL Uppercase Issue** - GraphQL schema exposes uppercase KEYS, but data queries return values
3. **Frontend Inconsistency** - Hardcoded values, duplicate labels, no clear pattern

**COMPREHENSIVE SOLUTION:**

### Phase 1: Backend Enum Audit & Centralization ✅ (IN PROGRESS)

**Step 1.1: Audit ALL Enums in Backend** ✅ COMPLETED
Found enums in these locations:

**Already Centralized ✅:**
- `src/common/enums/account-type.enum.ts` - AccountType
- `src/common/enums/account-badge.enum.ts` - AccountBadge
- `src/common/enums/gender.enum.ts` - Gender
- `src/common/enums/user-role.enum.ts` - UserRole
- `src/common/enums/user-status.enum.ts` - UserStatus
- `src/common/enums/attribute-type.enum.ts` - AttributeType
- `src/common/enums/subscription-account-type.enum.ts` - SubscriptionAccountType

**Need to Move to /common/enums/ 🔲:**
- `src/catalog/brand.entity.ts` - **CatalogSource**, **CatalogStatus**
- `src/chats/chat-message.entity.ts` - **MessageStatus**
- `src/email-templates/email-template.entity.ts` - **EmailTemplateCategory**, **EmailTemplateStatus**
- `src/listings/listing.entity.ts` - **ListingStatus**, **Currency**, ~~ListingCategory~~ (DELETE - should use Category table)
- `src/user-subscriptions/user-package.entity.ts` - **SubscriptionStatus**
- `src/user-subscriptions/user-subscription-transaction.entity.ts` - **UserSubscriptionTransactionStatus**
- `src/user-subscriptions/user-subscription.entity.ts` - **UserSubscriptionStatus**, **BillingCycle**
- `src/ads-common/ad-enums.ts` - **AdMediaType** ⚠️ (VALUES are UPPERCASE - WRONG!), **AdCampaignStatus**, **AdCampaignMediaType**, **AdClientStatus**, **CampaignStartPreference**

**⚠️ CRITICAL ISSUE - FIXED ✅:**
`AdMediaType` enum had UPPERCASE values - FIXED!
- ✅ Fixed enum in: `src/ads-common/ad-enums.ts`
- ✅ Migration created: `FixAdMediaTypeToLowercase1761346900000`
- ✅ Database updated: All `adType` values converted to lowercase

**Step 1.2: Move ALL Enums to /common/enums/** ✅ COMPLETED

**Created 16 new enum files:**
1. `listing-status.enum.ts` - ListingStatus (6 values)
2. `currency.enum.ts` - Currency (USD, EUR, SYP, etc.)
3. `catalog-source.enum.ts` - CatalogSource (manual, sync)
4. `catalog-status.enum.ts` - CatalogStatus (active, archived)
5. `message-status.enum.ts` - MessageStatus (sent, delivered, read)
6. `email-template-category.enum.ts` - EmailTemplateCategory (ads, subscription, listing, user_account, system)
7. `email-template-status.enum.ts` - EmailTemplateStatus (active, draft, archived)
8. `subscription-status.enum.ts` - SubscriptionStatus (active, expired, cancelled, pending)
9. `user-subscription-transaction-status.enum.ts` - UserSubscriptionTransactionStatus (pending, completed, failed, refunded, cancelled)
10. `user-subscription-status.enum.ts` - UserSubscriptionStatus (active, inactive, deprecated)
11. `billing-cycle.enum.ts` - BillingCycle (monthly, yearly, free)
12. `ad-media-type.enum.ts` - AdMediaType (banner, video, between_listings_card, between_listings_banner) ⚠️ **FIX VALUES TO LOWERCASE**
13. `ad-campaign-status.enum.ts` - AdCampaignStatus (draft, payment_sent, paid, active, completed, cancelled, paused)
14. `ad-campaign-media-type.enum.ts` - AdCampaignMediaType (banner_desktop, banner_mobile, video, between_listings)
15. `ad-client-status.enum.ts` - AdClientStatus (active, inactive, suspended)
16. `campaign-start-preference.enum.ts` - CampaignStartPreference (specific_date, asap)
17. ~~listing-category.enum.ts~~ - **DELETE** (should use Category table, not enum)

**Step 1.3: Update All Entity Imports** 🔲 PENDING
Update imports in:
- All entity files
- All DTO files
- All service files
- All resolver files

**Step 1.4: Delete ListingCategory Enum** 🔲 PENDING
This is wrong - categories should come from Category table, not hardcoded enum

### Phase 2: Fix GraphQL Uppercase Issue 🔲 PENDING

**The Problem:**
- GraphQL schema exposes: `{ ACTIVE, PENDING, BANNED }` (uppercase KEYS)
- GraphQL returns data: `{ "status": "ACTIVE" }` (uppercase)
- Database stores: `'active'`, `'pending'` (lowercase VALUES)
- Metadata resolver returns: `["active", "pending"]` (lowercase VALUES) ✅ Already fixed

**The Solution:**
Need to keep GraphQL consistent - either:
- Option A: Change GraphQL to expose lowercase in schema (professional, keeps everything lowercase)
- Option B: Accept uppercase in GraphQL, handle conversion in frontend

**Decision:** TBD after Phase 1 complete

### Phase 3: Frontend Cleanup 🔲 PENDING

**Step 3.1: Audit Frontend Enum Usage**
- Find all hardcoded enum values
- Find all comparisons using uppercase
- Check all dropdown/filter components

**Step 3.2: Standardize to Metadata Store**
- Ensure all enums come from metadata store (single source)
- Remove all hardcoded values
- Use metadata labels for display

### ✅ ALREADY COMPLETED (Previous Session):

**Backend:**
1. ✅ Moved UserStatus, UserRole, Gender to `/common/enums/`
2. ✅ Fixed database trigger to use lowercase enum values
3. ✅ Fixed GraphQL metadata resolver - changed `Object.keys()` to `Object.values()` for 13 queries
4. ✅ Migration executed: `FixTriggerEnumCase1761341943000`

**Frontend:**
1. ✅ Removed uppercase duplicate labels from `metadata-labels.ts`
2. ✅ Fixed 16 hardcoded uppercase enum values in 5 files:
   - ListingArea.tsx (2 fixes)
   - CreateAdClientModal.tsx (3 fixes)
   - EditAdClientModal.tsx (3 fixes)
   - listingsStore/index.ts (5 fixes)
   - adminListingsStore/index.ts (5 fixes)

### 📋 TODO LIST (Step-by-Step):

**Next Steps:**
1. 🔲 Complete ad-entities enum audit
2. 🔲 Create centralized enum files in `/common/enums/`
3. 🔲 Update all imports across backend
4. 🔲 Test backend - ensure no import errors
5. 🔲 Decide on GraphQL uppercase solution
6. 🔲 Implement GraphQL fix
7. 🔲 Test frontend with new enum values
8. 🔲 Document enum standard in ENUMS.md

---

## Session: 2025-01-24 (PREVIOUS)

### 🚧 Ad Display Integration - Frontend Implementation Plan

#### **Ad Placement Strategy**

**1. Homepage**
- **Top Banner** (above listings grid)
  - Ad Types: BANNER or VIDEO
  - Shows 1 active campaign (rotates if multiple)
  - Desktop: uses `desktopMediaUrl`
  - Mobile: uses `mobileMediaUrl` (for VIDEO) or `desktopMediaUrl` (for BANNER)

**2. Listing Page** (search results page)
- **Between Listings** (every 6-8 listings)
  - Ad Types: BETWEEN_LISTINGS_CARD or BETWEEN_LISTINGS_BANNER
  - Card: appears in grid like a listing (3:2 ratio)
  - Banner: full-width between rows
  - Desktop: uses `desktopMediaUrl`
  - Mobile: uses `desktopMediaUrl` (banners don't need separate mobile version)

**3. Detail Page** (individual listing view)
- **Top Banner** (below image gallery or above description)
  - Ad Types: BANNER or VIDEO
  - Desktop: uses `desktopMediaUrl`
  - Mobile: uses `mobileMediaUrl` (for VIDEO) or `desktopMediaUrl` (for BANNER)
- **Bottom Banner** (below listing description)
  - Ad Types: BETWEEN_LISTINGS_BANNER
  - Full-width banner
  - Desktop: uses `desktopMediaUrl`
  - Mobile: uses `desktopMediaUrl`

#### **Media Requirements by Ad Type**

| Ad Type | Desktop Media | Mobile Media | Notes |
|---------|---------------|--------------|-------|
| BANNER | 1200x200px image | Not required | Uses desktop image on mobile (responsive) |
| VIDEO | 16:9 video (1920x1080) | 1:1 video (1080x1080) | Required: both versions |
| BETWEEN_LISTINGS_CARD | 3:2 image (600x400) | Not required | Appears as card in listings grid |
| BETWEEN_LISTINGS_BANNER | 1200x200px image | Not required | Full-width banner between listings |

#### **Implementation Steps**

**Phase 1: Backend - Ad Serving API**
- ✅ Already have: `desktopMediaUrl`, `mobileMediaUrl`, `clickUrl`, `openInNewTab` in ad_campaigns table
- 🔲 Create GraphQL query: `getActiveAdsByType(adType: AdMediaType!)`
  - Returns active campaigns (status=ACTIVE, within date range)
  - Filters by adType
  - Returns: id, desktopMediaUrl, mobileMediaUrl, clickUrl, openInNewTab, campaignName
- 🔲 Create REST endpoint: POST `/api/ads/track` for impressions/clicks
  - Body: `{ campaignId, eventType: 'impression' | 'click' }`
  - Creates ad_reports entry or increments daily counters
  - No auth required (public endpoint)

**Phase 2: Frontend - Ad Components**
- 🔲 Create `AdBanner` component
  - Props: campaignId, desktopUrl, mobileUrl, clickUrl, altText
  - Responsive image (uses desktop on desktop, mobile on mobile if provided)
  - Tracks impression on mount (once)
  - Tracks click when clicked
  - "إعلان" label overlay
- 🔲 Create `AdVideo` component
  - Props: campaignId, desktopUrl, mobileUrl, clickUrl, altText
  - Auto-play, muted, loop
  - Responsive (shows desktop video on desktop, mobile video on mobile)
  - Tracks impression on mount
  - Tracks click when clicked
- 🔲 Create `AdCard` component (for BETWEEN_LISTINGS_CARD)
  - Props: campaignId, imageUrl, clickUrl, altText
  - Same size as ListingCard
  - Fits in listings grid
  - Tracks impression/click
- 🔲 Create `AdContainer` wrapper component
  - Fetches active ads by type
  - Handles loading state
  - Randomly selects one ad if multiple available
  - Passes data to child ad component

**Phase 3: Frontend - Page Integration**
- 🔲 **Homepage**: Integrate top banner
  - Add `<AdContainer type="BANNER_OR_VIDEO" placement="homepage-top" />` above ListingArea
  - Component auto-detects if ad is BANNER or VIDEO type
- 🔲 **Listing Page**: Integrate between listings ads
  - Modify ListingArea to inject ads every 6-8 listings
  - Use `<AdContainer type="BETWEEN_LISTINGS" placement="listings-between" />`
  - Alternate between CARD and BANNER types if both exist
- 🔲 **Detail Page**: Integrate top + bottom banners
  - Add `<AdContainer type="BANNER_OR_VIDEO" placement="detail-top" />` below gallery
  - Add `<AdContainer type="BETWEEN_LISTINGS_BANNER" placement="detail-bottom" />` after description

**Phase 4: Ad Tracking Service**
- 🔲 Create `adTrackingService.ts` utility
  - `trackImpression(campaignId: string)`: POST to `/api/ads/track`
  - `trackClick(campaignId: string)`: POST to `/api/ads/track`
  - Debounce to prevent duplicate impressions
  - Queue failed requests for retry

**Phase 5: Testing Setup**
- 🔲 Create 2 test campaigns with ACTIVE status
  - Campaign 1: BANNER type, runs for 30 days, 25,000 impressions limit
    - Client: Test Auto Company
    - Package: "بانر علوي - قياسي (30 يوم)"
    - Status: ACTIVE
    - Desktop image: placeholder banner (1200x200)
    - Click URL: https://example.com/cars
  - Campaign 2: BETWEEN_LISTINGS_BANNER type, runs for 30 days
    - Client: Test Motors LLC
    - Package: "بين القوائم - بانر كامل (30 يوم)"
    - Status: ACTIVE
    - Desktop image: placeholder banner (1200x200)
    - Click URL: https://example.com/deals
- 🔲 Test that ads display on all 3 pages
- 🔲 Test that impressions increment in ad_reports table
- 🔲 Test that clicks increment in ad_reports table
- 🔲 Test responsive behavior (desktop vs mobile)

#### **Files to Create**

**Backend:**
- `marketplace-backend/src/ad-campaigns/ad-campaigns.resolver.ts` - Add `getActiveAdsByType` query
- `marketplace-backend/src/ad-campaigns/ad-campaigns.service.ts` - Add logic to fetch active ads
- `marketplace-backend/src/ad-reports/ad-reports.controller.ts` - REST endpoint for tracking (NEW FILE)
- `marketplace-backend/src/ad-reports/ad-reports.service.ts` - Add tracking logic

**Frontend:**
- `marketplace-frontend/components/ads/AdBanner/AdBanner.tsx`
- `marketplace-frontend/components/ads/AdBanner/AdBanner.module.scss`
- `marketplace-frontend/components/ads/AdBanner/index.ts`
- `marketplace-frontend/components/ads/AdVideo/AdVideo.tsx`
- `marketplace-frontend/components/ads/AdVideo/AdVideo.module.scss`
- `marketplace-frontend/components/ads/AdVideo/index.ts`
- `marketplace-frontend/components/ads/AdCard/AdCard.tsx`
- `marketplace-frontend/components/ads/AdCard/AdCard.module.scss`
- `marketplace-frontend/components/ads/AdCard/index.ts`
- `marketplace-frontend/components/ads/AdContainer/AdContainer.tsx`
- `marketplace-frontend/components/ads/AdContainer/index.ts`
- `marketplace-frontend/components/ads/index.ts` - Export all ad components
- `marketplace-frontend/services/adTrackingService.ts`
- `marketplace-frontend/stores/adsStore/index.ts` - Store for fetching ads
- `marketplace-frontend/stores/adsStore/adsStore.gql.ts` - GraphQL queries

**Modified Files:**
- `marketplace-frontend/app/page.tsx` - Add top banner
- `marketplace-frontend/components/ListingArea/ListingArea.tsx` - Inject between-listings ads
- `marketplace-frontend/app/listing/[id]/ListingDetailClient.tsx` - Add top + bottom banners

#### **Testing Checklist**
- [ ] Homepage shows top banner ad
- [ ] Listing page shows ads between listings (every 6-8 items)
- [ ] Detail page shows top banner + bottom banner
- [ ] Clicking ad opens clickUrl in new tab
- [ ] Impressions are tracked in ad_reports table
- [ ] Clicks are tracked in ad_reports table
- [ ] Mobile shows correct media (mobileMediaUrl for VIDEO, desktopMediaUrl for BANNER)
- [ ] Ad label "إعلان" is visible on all ads
- [ ] Ads don't show when no active campaigns exist

---

## Session: 2025-01-21 (CONTINUED - TODO)

### 🚧 Ad Management System - Implementation Plan

**Priority Order:**

### **Phase 1: Ad Campaigns Dashboard + Public Reports** (IN PROGRESS)
1. **Ad Campaigns Dashboard** (`AdCampaignsDashboardPanel`)
   - ✅ Backend already has: entity, resolver, service, seeder
   - 🔲 Create frontend store: `adminAdCampaignsStore`
   - 🔲 Create main dashboard component with table
   - 🔲 Create modals: Create/Edit/Delete
   - 🔲 Add media asset upload functionality
   - 🔲 Campaign status management (DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED)
   - 🔲 Link to clients (dropdown) and packages (dropdown)
   - 🔲 **Add publicReportToken generation on campaign creation**
   - 🔲 **Add "Copy Report Link" button in Edit Campaign Modal**

2. **Public Campaign Report Page** (NEW FEATURE)
   - 🔲 Add `publicReportToken` field to ad_campaigns table (migration + entity)
   - 🔲 Create public resolver (no authentication): `getPublicCampaignReport(token: string)`
   - 🔲 Create frontend public page: `/ad-report/[token]/page.tsx`
   - 🔲 Display campaign metrics: impressions, clicks, CTR, cost
   - 🔲 Show daily breakdown table
   - 🔲 Auto-refresh every 5 minutes for active campaigns
   - **Purpose:** Clients can view their ad performance without login via shareable link
   - **Future:** Weekly email reports, PDF/Excel download, charts

### **Phase 2: Supporting Dashboards**
3. **Ad Clients Dashboard** (`AdClientsDashboardPanel`)
   - ✅ Backend ready (entity, resolver, service, seeder)
   - 🔲 Create frontend store: `adminAdClientsStore`
   - 🔲 Create dashboard with CRUD modals
   - Table columns: اسم الشركة | الصناعة | جهة الاتصال | البريد | الهاتف | عدد الحملات | الإجراءات

4. **Ad Reports Dashboard** (`AdReportsDashboardPanel`)
   - ✅ Backend ready (entity, resolver, service, seeder)
   - 🔲 Create frontend store: `adminAdReportsStore`
   - 🔲 Read-only dashboard (no create/edit)
   - 🔲 Campaign selector + date range filter
   - 🔲 Metrics cards + daily reports table
   - 🔲 Optional: Add charts/graphs

**Technical Requirements:**
- All dashboards follow AdPackagesDashboardPanel pattern
- Use SharedDashboardPanel.module.scss for styling
- Implement caching (5-minute timeout)
- Use useFeaturePermissions hook
- Dynamic enums from metadata store
- Proper error handling and notifications

**Database Structure:**
- `ad_clients` table → External advertisers (companies)
- `ad_campaigns` table → Ad campaigns linking clients + packages
- `ad_reports` table → Daily performance metrics per campaign
- `ad_packages` table → ✅ Already completed (6 packages seeded)

**Status:** Starting with Ad Campaigns Dashboard + Public Report Token

---

## Session: 2025-01-21

### Completed Today

#### Ad Packages System - Type & Tier Removal

**Problem:**
- User identified that `type` (النوع) and `tier` (المستوى) fields in ad packages were redundant
- Packages already differentiated by: adType, price, duration, impressionLimit
- Type (standard/custom) and Tier (basic/premium/enterprise) added no value

**Solution: Complete Removal of type and tier Fields**

##### Backend Changes:

1. **Entity** ([ad-package.entity.ts](marketplace-backend/src/ad-packages/ad-package.entity.ts))
   - Removed `type` field (AdPackageType enum)
   - Removed `tier` field (AdPackageTier enum)
   - Removed import of unused enums

2. **DTOs**
   - [create-ad-package.input.ts](marketplace-backend/src/ad-packages/dto/create-ad-package.input.ts): Removed `type` and `tier` fields, updated imports
   - [filter-ad-packages.input.ts](marketplace-backend/src/ad-packages/dto/filter-ad-packages.input.ts): Removed `type` and `tier` filter options

3. **Service** ([ad-packages.service.ts](marketplace-backend/src/ad-packages/ad-packages.service.ts))
   - Removed `findStandardPackages()` and `findCustomPackages()` methods
   - Updated `findAll()` to order by `basePrice` instead of `tier`
   - Updated `findActivePackages()` to order by `basePrice`
   - Removed AdPackageType import

4. **Resolver** ([ad-packages.resolver.ts](marketplace-backend/src/ad-packages/ad-packages.resolver.ts))
   - Removed `standardAdPackages` query
   - Removed `customAdPackages` query
   - Kept only: `adPackages`, `adPackage`, `activeAdPackages`

5. **Migration**
   - Generated: [RemoveTypeAndTierFromAdPackages1761008648012.ts](marketplace-backend/src/migrations/1761008648012-RemoveTypeAndTierFromAdPackages.ts)
   - Successfully ran migration
   - Dropped `type` column and `ad_packages_type_enum` type
   - Dropped `tier` column and `ad_packages_tier_enum` type

6. **Seeder** ([ads.seeder.ts](marketplace-backend/src/seeds/seeders/ads.seeder.ts))
   - Removed `type` and `tier` from all 6 ad packages
   - Removed AdPackageType and AdPackageTier imports
   - Packages now only contain: packageName, description, adType, durationDays, impressionLimit, basePrice, currency, mediaRequirements, isActive

##### Frontend Changes:

1. **Store** ([adminAdPackagesStore/index.ts](marketplace-frontend/stores/admin/adminAdPackagesStore/index.ts))
   - Removed `type` and `tier` from `AdPackage` interface
   - Removed `type` and `tier` from `CreateAdPackageInput` interface
   - Removed `type` and `tier` from `UpdateAdPackageInput` interface

2. **GraphQL Queries** ([adminAdPackagesStore.gql.ts](marketplace-frontend/stores/admin/adminAdPackagesStore/adminAdPackagesStore.gql.ts))
   - Removed `type` and `tier` from:
     - GET_ALL_AD_PACKAGES_QUERY
     - GET_AD_PACKAGE_BY_ID_QUERY
     - GET_ACTIVE_AD_PACKAGES_QUERY
     - CREATE_AD_PACKAGE_MUTATION
     - UPDATE_AD_PACKAGE_MUTATION

3. **Modals**
   - [CreateAdPackageModal.tsx](marketplace-frontend/components/admin/AdminDashboardPanel/AdPackagesDashboardPanel/modals/CreateAdPackageModal.tsx):
     - Removed "نوع الحزمة والمستوى" section
     - Removed `type` and `tier` from form state (2 places)
   - [EditAdPackageModal.tsx](marketplace-frontend/components/admin/AdminDashboardPanel/AdPackagesDashboardPanel/modals/EditAdPackageModal.tsx):
     - Removed "نوع الحزمة والمستوى" section
     - Removed `type` and `tier` from form state
     - Removed from initial data population

4. **Dashboard Table** ([AdPackagesDashboardPanel/index.tsx](marketplace-frontend/components/admin/AdminDashboardPanel/AdPackagesDashboardPanel/index.tsx))
   - Removed `getTypeLabel()` helper function
   - Removed `getTierLabel()` helper function
   - Removed "النوع" (Type) column from table
   - Removed "المستوى" (Tier) column from table
   - Updated table headers and cells

**Final Table Structure:**
| Column | Description |
|--------|-------------|
| اسم الحزمة | Package Name + Description preview |
| نوع الإعلان | Ad Type (BANNER, VIDEO, BETWEEN_LISTINGS_CARD, BETWEEN_LISTINGS_BANNER) |
| السعر | Price in USD |
| المدة | Duration in days |
| حد الظهور | Impression limit |
| الحالة | Active/Inactive status |
| الإجراءات | Edit/Delete actions |

**6 Ad Packages in Database:**
1. **بانر علوي - أساسي (7 أيام)** - BANNER, 7 days, 5,000 impressions, $50
2. **بانر علوي - قياسي (30 يوم)** - BANNER, 30 days, 25,000 impressions, $150
3. **فيديو علوي - متميز (30 يوم)** - VIDEO, 30 days, 15,000 impressions, $300
4. **بين القوائم - كارت (30 يوم)** - BETWEEN_LISTINGS_CARD, 30 days, 20,000 impressions, $100
5. **بين القوائم - بانر كامل (30 يوم)** - BETWEEN_LISTINGS_BANNER, 30 days, 30,000 impressions, $180
6. **حزمة مؤسسية مخصصة** - BANNER, 30 days, unlimited, custom pricing

**Files Modified (Total: 12)**
- Backend: 6 files
- Frontend: 6 files

**Database Changes:**
- ✅ Migration executed successfully
- ✅ Columns dropped: `type`, `tier`
- ✅ Enums dropped: `ad_packages_type_enum`, `ad_packages_tier_enum`

---

## Session: 2025-01-17 (PLANNED)

### 🚧 Multi-Step Create Listing Form (TODO)

#### Implementation Plan

**Architecture: Dynamic Multi-Step Form with Attribute-Based Steps**

**Step Structure:**
1. **Step 1: Category & Basic Info** (Fixed)
   - Category selector (dropdown) - Required
   - Title (text) - Required
   - Description (textarea) - Optional
   - Price (number) - Required
   - Allow Bidding (switch) - Optional
   - Bidding Start Price (number) - Conditional

2. **Step 2: Images** (Fixed)
   - ImageUploadGrid component (min 3, max 20 photos) - Required
   - Video URL (text) - Optional

3. **Step 3-N: Dynamic Attribute Groups** (Generated from backend)
   - One step per attribute `group` field
   - Sorted by `groupOrder`
   - Example groups for "Car" category:
     - المواصفات الأساسية (Basic Specs) - Brand, Model, Year, Body Type
     - المواصفات الفنية (Technical Specs) - Fuel, Transmission, Mileage, Engine

4. **Step N: Location & Review** (Fixed)
   - Province (selector) - Required
   - City (text) - Optional
   - Area (text) - Optional
   - Map Link (text) - Optional
   - Review Summary with "Edit Step X" links

**Key Features:**
- ✅ Step-by-step validation (can't proceed without required fields)
- ✅ Progress indicator (● Step 1 ○ Step 2 ○ Step 3...)
- ✅ Form state management via Zustand store
- ✅ Dynamic field rendering based on attribute type:
  - SELECTOR → dropdown
  - MULTI_SELECTOR → checkboxes with max limit
  - RANGE → min/max number inputs
  - TEXT → text input
  - NUMBER → number input
- ✅ Image upload to storage service (Cloudflare/Supabase)
- ✅ Final payload construction with specs object
- ✅ Integration with createMyListing mutation

**Technical Components:**
1. `useCreateListingStore` - Zustand store for form state
2. `MultiStepForm` - Wrapper component with navigation
3. `StepIndicator` - Progress bar component
4. `DynamicAttributeStep` - Renders fields by attribute type
5. `ReviewStep` - Summary with edit links

**Data Flow:**
```
User opens modal
  → Step 1: Select category "Car"
  → Fetch attributes via getAttributesByCategorySlug("car")
  → Group attributes by `group` field
  → Generate dynamic steps (one per group)
  → User fills each step (validated before next)
  → Final step: Upload images → Build specs object → Submit
```

**Backend Integration:**
- Query: `getAttributesByCategorySlug(categorySlug: String!)` returns attributes with options
- Mutation: `createMyListing(input: CreateListingInput!)` creates listing
- Image upload: Store → Get URLs → Send as `imageKeys: string[]`

**Validation Rules:**
- Required fields must be filled before proceeding to next step
- Step 2: Minimum 3 images required
- Range fields: min must be ≤ max
- Multi-selector: Respect `maxSelections` limit

**Files to Create:**
- `stores/createListingStore/` - Form state store
- `components/dashboard/ListingsPanel/modals/CreateListingModal/` - Main modal
- `components/dashboard/ListingsPanel/modals/CreateListingModal/components/` - Step components
- `components/slices/MultiStepForm/` - Reusable multi-step wrapper
- `components/slices/StepIndicator/` - Progress indicator

**Status:** Planning completed, ready for implementation

---

## Session: 2025-01-17

### Completed Today

#### Frontend

**1. ImageUploadGrid Component**
- Created reusable `ImageUploadGrid` component for image upload with preview
- **Features:**
  - Responsive grid layout (150px min width, 2 columns on mobile)
  - Drag & drop support for images
  - Delete button (danger variant, icon-only, appears on hover)
  - Add button with + icon
  - Max images limit (configurable, default 20)
  - Blob URL preview with proper memory cleanup
  - Uses slice components (Button, Text)
- **Files Created:**
  - `components/slices/ImageUploadGrid/ImageUploadGrid.tsx`
  - `components/slices/ImageUploadGrid/ImageUploadGrid.module.scss`
  - `components/slices/ImageUploadGrid/index.ts`
- **Files Modified:**
  - `components/slices/index.ts` (exported ImageUploadGrid)

**2. Modal System Improvements**
- Refactored all modals to use consistent styling
- Updated admin panel modals (Attributes, Brands, Roles, Subscriptions, Users, Listings)
- Updated dashboard modals (Personal Info, Listings)
- Improved delete confirmation modals layout
- Better spacing and form organization
- **Files Modified:** 25+ modal components across admin and dashboard

**3. Store Updates**
- Added `createMyListing` mutation to userListingsStore
- Updated GraphQL mutations:
  - `CREATE_MY_LISTING_MUTATION` - New
  - `UPDATE_MY_LISTING_MUTATION` - Changed to use `updateMyListing`
  - `DELETE_MY_LISTING_MUTATION` - Changed to use `deleteMyListing`
- Integrated image handling in EditListingModal with ImageUploadGrid
- **Files Modified:**
  - `stores/userListingsStore/index.ts`
  - `stores/userListingsStore/userListingsStore.gql.ts`
  - `components/dashboard/ListingsPanel/modals/EditListingModal.tsx`

**4. Technical Improvements**
- Used native `<input type="file">` for file upload (correct approach)
- Proper TypeScript types for image items
- Memory cleanup with `URL.revokeObjectURL()`
- Hover-based delete button with opacity transition

---

## Session: 2025-01-14

### Completed Today

#### Backend

**1. Avatar Support for Premium Users**
- Added `avatar` field to User entity (line 150-153 in `user.entity.ts`)
- Avatar field is nullable (for users without customBranding subscription)
- Database migration already exists and was previously run
- GraphQL schema updated to expose avatar field
- **Files Modified**: `marketplace-backend/src/users/user.entity.ts`

**2. Account Type Test Users with Subscription Features**
- Created 3 comprehensive test users for testing subscription limits:
  - **individual@marketplace.com** | Individual123!
    - Account type: INDIVIDUAL
    - Subscription: individual_free (5 listings max, 5 photos)
    - Avatar: NULL (no customBranding)
    - accountBadge: NONE
  - **dealer@marketplace.com** | Dealer123!
    - Account type: DEALER
    - Subscription: dealer_free (unlimited listings, 20 photos)
    - Avatar: Unsplash URL (has customBranding)
    - accountBadge: PREMIUM
    - Company: Mohammad Auto Trading
    - Contact phone: +31612345678
    - businessVerified: true
  - **business@marketplace.com** | Business123!
    - Account type: BUSINESS
    - Subscription: business_free (unlimited listings, 50 photos)
    - Avatar: Unsplash URL (has customBranding)
    - accountBadge: PREMIUM
    - Company: Ali Motors International
    - Website: https://alimotors.com
    - KVK: 12345678
    - Contact phone: +31687654321
    - businessVerified: true
- **Files Modified**: `marketplace-backend/src/seeds/seeders/users.seeder.ts`

**3. Improved Seeder Logic**
- Changed seeder to UPDATE existing users instead of skipping them
- Prevents "already exists" issue when running `db:seed:refresh`
- Updates avatar, companyName, businessVerified, kvkNumber, website, contactPhone fields
- Avatars use Unsplash URLs (same as listings) for consistency
- **Pattern**: Check if user exists → Update if exists, Create if not
- **Files Modified**: `marketplace-backend/src/seeds/seeders/users.seeder.ts`

**4. Listings Distribution by Account Type**
- Modified listings seeder to assign listings based on account type:
  - First 5 listings → individual user (tests 5 listing limit)
  - Next 10 listings → dealer user
  - Next 10 listings → business user
  - Remaining → distributed among other users
- **Files Modified**: `marketplace-backend/src/seeds/seeders/listings.seeder.ts`

**5. Bug Fixes**
- Fixed `getUserTransactions` relation name from "package" to "userSubscription"
- **Files Modified**: `marketplace-backend/src/user-subscriptions/user-subscriptions.service.ts`

#### Frontend

**1. Avatar Field Integration**
- Added `avatar` field to ME_QUERY GraphQL query
- Added `avatar: string | null` to PublicUser TypeScript interface
- Avatar now fetched and stored in user state after login
- **Files Modified**:
  - `stores/userAuthStore/userAuth.gql.ts`
  - `stores/userAuthStore/types.ts`

**2. Authentication Guards**
- Added authentication guard to dashboard layout
- Redirects to home page if user is not authenticated
- Prevents access to `/dashboard/*` routes when logged out
- Shows nothing while checking authentication (no flash of content)
- **Implementation**: useEffect checks `user` and `isLoading`, redirects if not authenticated
- **Files Modified**: `app/dashboard/layout.tsx`

**3. Account Type Test Users in Login Selector**
- Updated login dropdown to include account type test users:
  - 👨 Individual (5 listings, no avatar)
  - 🚗 Dealer (unlimited, avatar)
  - 🏢 Business (unlimited, avatar)
  - User 1 (Legacy)
  - User 2 (Legacy)
  - Custom Login
- Makes it easy to test different account types and subscription features
- **Files Modified**: `components/AuthModal/LoginForm.tsx`

**4. Business User Profile Fields**
- Added display fields for business/dealer users in dashboard:
  - **Website** (الموقع الإلكتروني) - clickable link, opens in new tab
  - **KVK Number** (رقم التسجيل التجاري) - business only
  - **Contact Phone** (هاتف العمل) - dealer and business
- Fields use conditional rendering (only show if user has them)
- **Files Modified**: `app/dashboard/page.tsx`

**5. GraphQL Query Fixes**
- Fixed `MY_LISTINGS_QUERY` to use correct Price type fields:
  - Changed from: `prices { usd, eur, sar, syp, aed }`
  - Changed to: `prices { currency, value }`
- This matches the backend Price GraphQL type structure
- **Root Cause**: Backend returns array of `{currency, value}` objects, not individual currency fields
- **Files Modified**: `stores/userListingsStore/userListingsStore.gql.ts`

**6. Session Storage Extension**
- Extended session storage expiration to 30 days
- Users stay logged in for longer without needing to re-authenticate
- **Files Modified**: `stores/userAuthStore/index.ts`

### Technical Details

**Avatar Field Schema**
```typescript
// Backend (User entity)
@Field(() => String, { nullable: true })
@Column({ type: "varchar", nullable: true })
avatar!: string | null;

// Frontend (PublicUser interface)
avatar: string | null;

// GraphQL Query
avatar
```

**Account Type to Subscription Mapping**
- Individual → individual_free (customBranding: false, no avatar)
- Dealer → dealer_free (customBranding: true, has avatar)
- Business → business_free (customBranding: true, has avatar)

**Avatar URLs (Using Unsplash)**
```javascript
const SAMPLE_AVATARS = [
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=600&fit=crop",
  // ... more Unsplash URLs
];
```

**Seeder Update Pattern**
```typescript
if (existing) {
  // Update existing user with new data
  await sb.from("users").update({
    avatar: testUser.avatar || null,
    companyName: testUser.companyName || null,
    // ... other fields
  }).eq("email", testUser.email);
  console.log(`   ↳ ✅ ${testUser.accountType}: ${testUser.email} (updated)`);
  continue;
}
// ... create new user
```

### Testing Scenarios Available

1. **Individual User Limits**
   - Login as individual@marketplace.com
   - Try creating 6th listing (should fail or warn)
   - Verify no avatar displayed
   - Max 5 photos per listing

2. **Dealer Premium Features**
   - Login as dealer@marketplace.com
   - Avatar should be displayed in dashboard
   - Unlimited listings
   - Company name visible
   - Contact phone displayed
   - 20 photos per listing allowed

3. **Business Premium Features**
   - Login as business@marketplace.com
   - Avatar displayed
   - Website link displayed and clickable
   - KVK number displayed
   - Company name visible
   - Contact phone displayed
   - Unlimited listings
   - 50 photos per listing allowed

4. **Authentication Guard**
   - Login with any user
   - Visit `/dashboard/payments` or any dashboard route
   - Logout
   - You should be redirected to home page
   - Cannot access dashboard routes when logged out

### Known Issues / Notes

- Seeder doesn't clear users by design (avoids Supabase auth conflicts)
- Users are now updated in place instead of deleted/recreated
- All test users have valid Supabase auth accounts
- Avatar field returns NULL for individual users (correct behavior)

---

## Previous Session: 2025-01-13

### Completed

#### Backend

**Fixed GraphQL DateTime Serialization Error from Redis Cache**
- **Issue**: GraphQL error "Expected `DateTime.serialize()` to return non-nullable value, returned: null" when serving listings from Redis cache
- **Root Cause**: Redis stores Date objects as ISO strings, but GraphQL's `GraphQLISODateTime` scalar expects JavaScript Date instances
- **Solution**: Transform cached listings by converting ISO string dates back to Date objects before returning
- **File Modified**: `marketplace-backend/src/listings/listings.service.ts` (lines 407-417)
- **Impact**: Fixed all listing searches served from cache

#### Frontend

**1. Skeleton Loading System**
- Created reusable `Skeleton` component with pulse animation (opacity-based, CSS variable compatible)
- Added `skeleton` prop to `Text` component with variant-specific heights
- Added `skeleton` prop to `ImageGallery` component
- Added `isLoading` prop to `ListingCard` to cascade skeleton state to children
- **Files Created**:
  - `components/slices/Skeleton/Skeleton.tsx`
  - `components/slices/Skeleton/Skeleton.module.scss`
  - `components/slices/Skeleton/index.ts`
- **Files Modified**:
  - `components/slices/Text/Text.tsx`
  - `components/slices/ImageGallery/ImageGallery.tsx`
  - `components/slices/ListingCard/ListingCard.tsx`
  - `components/slices/index.ts`

**2. Listing Card UX Improvements**
- **Compact Specs Display** (AutoScout24 style):
  - Grid view now shows specs as single line with `|` separator
  - Shows only values without labels (e.g., "2020 | 50,000 km | بنزين | أوتوماتيك")
  - Truncates to 2 lines max with ellipsis (1 line on mobile)
- **Seller Type Deduplication**:
  - Removed seller type from specs display (was showing twice)
  - Moved seller section to bottom with border-top separator
  - Ready for future seller name/badge additions
- **Image Optimization**:
  - Changed aspect ratio from `4/3` to `3/2` for better mobile fit
  - Updated `sizes` attribute for proper mobile optimization
- **Files Modified**:
  - `components/slices/ListingCard/ListingCard.tsx`
  - `components/slices/ListingCard/ListingCard.module.scss`

**3. User-Friendly Error Handling**
- Listing detail page now shows Arabic error message instead of technical errors
- Error message: "هذه الصفحة غير موجودة" (This page does not exist)
- Added navigation buttons: "العودة للصفحة السابقة" and "العودة للرئيسية"
- Technical errors logged to console only
- **Files Modified**:
  - `app/listing/[id]/ListingDetailClient.tsx`
  - `app/listing/[id]/ListingDetail.module.scss`

**4. Pagination Refactor**
- Replaced ~100 lines of duplicate pagination code with `Pagination` slice component
- Removed unused pagination styles (`.pageNumbers`, `.pageButton`, `.ellipsis`)
- Pagination component handles all logic and styling
- **Files Modified**:
  - `components/ListingArea/ListingArea.tsx` (reduced from 439 to 345 lines)
  - `components/ListingArea/ListingArea.module.scss`

**5. Mobile Grid Optimization**
- Fixed grid to show exactly 2 equal-width cards: `grid-template-columns: 1fr 1fr !important`
- Reduced gap to `$space-xs` on mobile
- Limited specs to 1 line on mobile (down from 2)
- **Files Modified**:
  - `components/ListingArea/ListingArea.module.scss`
  - `components/slices/ListingCard/ListingCard.module.scss`

### Technical Details

**CSS Variable Compatibility Issue (Solved)**
- SASS functions like `lighten()` don't work with CSS variables
- Solution: Use opacity-based animations instead of color manipulation
- Example: Changed from `lighten($border, 5%)` to opacity pulse animation

**Text Truncation Pattern**
```scss
display: -webkit-box;
-webkit-line-clamp: 2; // or 1 on mobile
-webkit-box-orient: vertical;
overflow: hidden;
text-overflow: ellipsis;
```

**Date Transformation Pattern (Redis Cache)**
```typescript
const transformedListings = cached.map(listing => ({
  ...listing,
  createdAt: new Date(listing.createdAt),
  updatedAt: new Date(listing.updatedAt),
}));
```

---

## Git Commits

### Backend
```
41ddd8c - Add account type test users with avatar support and improve seeding
5b0b894 - Fix GraphQL DateTime serialization error from Redis cache
```

### Frontend
```
ab65c24 - Add avatar support, auth guards, and business user profile fields
eeed430 - Improve listing card UX and mobile responsiveness
```


---

## Session: 2025-01-30 (AI Moderation System Completion + Cleanup)

### Completed Today

#### AI Content Moderation - Create Listing ✅

**1. Backend Implementation**
- ✅ AI moderation service using OpenAI + Cloudflare AI
- ✅ Text moderation (OpenAI Moderation API)
- ✅ Image moderation (Cloudflare Image-to-Text + OpenAI)
- ✅ 3-tier scoring system (90+ auto-approve, 50-89 review, <50 reject)
- ✅ Rejection reasons enum with Arabic labels
- ✅ Admin can reject with custom messages
- ✅ RBAC integration (any role with `listings.modify` permission)

**2. Frontend Implementation**
- ✅ Rejection alert in user edit modal
- ✅ Case-insensitive enum label matching (MISSING_INFO → معلومات ناقصة)
- ✅ Compact, styled rejection alert with border-radius
- ✅ No emojis in rejection messages
- ✅ Admin can set rejection reason + custom message

**3. Database Cleanup**
- ✅ Deleted `app-settings` module (unused, AI always enabled)
- ✅ Deleted violation tracking fields from `user.entity.ts` (never implemented)
- ✅ Created and ran 3 migrations:
  - `AddTimestampsToAppSettings` (pending from before)
  - `RemoveViolationTrackingFromUsers` (dropped columns + enum)
  - `DropAppSettingsTable` (dropped table)

**Files Modified:**

**Backend (5 files):**
- `src/app.module.ts` - Removed AppSettingsModule import
- `src/listings/listings.module.ts` - Removed AppSettingsModule import
- `src/listings/services/ai-moderation.service.ts` - Removed AppSettingsService, AI always enabled
- `src/users/user.entity.ts` - Removed violation tracking fields
- `src/listings/listings.service.ts` - RBAC integration (previous session)

**Frontend (4 files):**
- `constants/metadata-labels.ts` - Case-insensitive getLabel() function
- `components/dashboard/ListingsPanel/modals/EditListingModal.tsx` - Rejection alert styling + emoji removal
- `components/dashboard/ListingsPanel/modals/EditListingModal.module.scss` - Compact rejection alert
- `components/dashboard/ListingsPanel/index.tsx` - Removed emoji from draft warning

**Migrations (3 new):**
- `1761760658184-AddTimestampsToAppSettings.ts` (ran successfully)
- `1761794920856-RemoveViolationTrackingFromUsers.ts` (ran successfully)
- `1761795000000-DropAppSettingsTable.ts` (ran successfully)

**Total: 12 files modified/deleted, 3 migrations created**

---

### Pending Decisions (for tomorrow)

**listing.entity.ts Moderation Fields:**
- `moderationFlags` - Likely DELETE (technical debug data, never displayed)
- `moderationStatus` - KEEP (shows what AI decided vs current status)
- `moderationScore` - KEEP (essential for AI threshold logic)
- `reviewedBy` + `reviewedAt` - KEEP (distinguish human vs AI decisions)

**Next Session Plan:**
1. Finalize moderation fields decision
2. Test edit listing AI re-moderation
3. Implement bidding system
4. Add view count tracking
5. Start wishlist or chat system (time permitting)

---

