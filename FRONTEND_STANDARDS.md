# Frontend Standards - Syrian Marketplace

This document outlines the frontend standards and patterns we've implemented for consistent, maintainable code across the Syrian marketplace application.

---

## 🚨 Error Handling Standards

### 1. 404 Page

We have a comprehensive 404 page with:
- **Bilingual support** (Arabic/English)
- **Consistent styling** with the design system
- **Helpful navigation** back to key areas
- **SEO-friendly** structure

**Location:** `/app/not-found.tsx`

**Features:**
- Auto-detects user language
- Suggests alternative pages
- Maintains branding consistency
- Responsive design

### 2. Error Boundaries

All components should be wrapped in error boundaries for graceful error handling.

**Usage:**
```tsx
import { ErrorBoundary } from '@/components/slices';

function MyPage() {
  return (
    <ErrorBoundary 
      onError={(error, errorInfo) => {
        // Optional: send to error reporting service
        console.error('Component error:', error);
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

**Features:**
- **Graceful degradation** - Shows user-friendly error message
- **Development details** - Stack traces in development mode
- **Error reporting** - Built-in email reporting functionality
- **Bilingual support** - Error messages in user's language
- **Recovery options** - Refresh, go home, or report error

---

## 🏪 Store Standards

### Base Store Pattern

All stores should extend `BaseStore` for consistent async state management.

**Core Features:**
- ✅ **Loading states** (`isLoading`)
- ✅ **Error handling** (`error`)
- ✅ **Success tracking** (`success`)
- ✅ **Operation-specific states** (`operations.{operationName}`)
- ✅ **Automatic notifications** (success/error messages)
- ✅ **Built-in utilities** (reset, clear, etc.)

### Creating a New Store

```typescript
import { create } from 'zustand';
import { createAsyncStore, BaseStore } from '@/stores/base';

interface MyStore extends BaseStore {
  data: MyData[];
  
  // Async actions (automatically handle loading/error/success)
  fetchData: () => Promise<void>;
  createItem: (item: CreateItemData) => Promise<void>;
  updateItem: (id: string, updates: UpdateItemData) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useMyStore = create<MyStore>(
  createAsyncStore<MyStore>((set, get) => ({
    // Initial data state
    data: [],

    // Async actions
    fetchData: async () => {
      return await get().handleAsyncAction(
        async () => {
          const data = await api.fetchData();
          set((state) => ({ ...state, data }));
          return data;
        },
        {
          operation: 'fetchData', // Optional: operation-specific state
          errorMessage: 'Failed to fetch data',
          showNotification: false, // Optional: disable notifications
        }
      );
    },

    createItem: async (item) => {
      return await get().handleAsyncAction(
        async () => {
          const newItem = await api.createItem(item);
          set((state) => ({ 
            ...state, 
            data: [...state.data, newItem] 
          }));
          return newItem;
        },
        {
          operation: 'createItem',
          successMessage: 'Item created successfully',
          errorMessage: 'Failed to create item',
        }
      );
    },

    // ... other actions
  }))
);
```

### Using Store States

```typescript
// Basic usage
function MyComponent() {
  const store = useMyStore();
  
  return (
    <div>
      {store.isLoading && <div>Loading...</div>}
      {store.error && <div>Error: {store.error}</div>}
      {store.success && <div>Success!</div>}
    </div>
  );
}

// Operation-specific states
function MyForm() {
  const store = useMyStore();
  const createHandlers = useOperationHandlers(store, 'createItem');
  
  return (
    <form>
      <button 
        disabled={createHandlers.isLoading}
        onClick={() => store.createItem(formData)}
      >
        {createHandlers.isLoading ? 'Creating...' : 'Create Item'}
      </button>
      {createHandlers.error && <div>Error: {createHandlers.error}</div>}
    </form>
  );
}

// Custom hooks pattern
export function useMyData() {
  const store = useMyStore();
  
  return {
    data: store.data,
    isLoading: store.isLoading,
    error: store.error,
    fetchData: store.fetchData,
    createItem: store.createItem,
  };
}
```

### Available Utilities

**Base Store Actions:**
```typescript
store.setLoading(true);           // Set main loading state
store.setError('Error message');  // Set main error state
store.setSuccess(true);           // Set main success state
store.resetState();               // Reset all states
store.resetError();               // Clear error only

// Operation-specific states
store.setOperationState('myOp', { isLoading: true });
store.resetOperation('myOp');

// Automatic async handling
store.handleAsyncAction(asyncFunction, options);
```

**Custom Hooks:**
```typescript
import { 
  useStoreLoading, 
  useStoreError, 
  useStoreSuccess,
  useAsyncState,
  useAsyncAction,
  useOperationHandlers,
  useFormSubmission 
} from '@/stores/base';

// Get specific states
const isLoading = useStoreLoading(store, 'myOperation');
const error = useStoreError(store, 'myOperation');
const success = useStoreSuccess(store, 'myOperation');

// Get complete async state
const { isLoading, error, success } = useAsyncState(store, 'myOperation');

// Execute async actions with automatic state management
const executeAction = useAsyncAction(store);
await executeAction(myAsyncFunction, { 
  operation: 'myOp',
  successMessage: 'Done!'
});

// Form submission helper
const submitForm = useFormSubmission(
  store, 
  submitAction,
  {
    operation: 'submitForm',
    successMessage: 'Form submitted!',
    onSuccess: (result) => router.push('/success'),
  }
);
```

---

## 🎯 Benefits of These Standards

### 1. **Consistency**
- All stores follow the same pattern
- Predictable loading/error/success states
- Uniform error handling across the app

### 2. **Developer Experience**
- Less boilerplate code
- Automatic state management
- Built-in TypeScript support
- Comprehensive utilities

### 3. **User Experience**
- Graceful error handling
- Consistent notification system
- Proper loading states
- Bilingual error messages

### 4. **Maintainability**
- Centralized error handling logic
- Reusable patterns
- Easy to test and debug
- Clear separation of concerns

### 5. **Scalability**
- Easy to add new stores
- Operation-specific state management
- Built for complex async workflows
- Ready for future features

---

## 📋 Implementation Checklist

When creating new features, ensure:

- [ ] **Wrap in ErrorBoundary** - All major components
- [ ] **Extend BaseStore** - All new stores
- [ ] **Use handleAsyncAction** - For all async operations
- [ ] **Operation-specific states** - For complex workflows
- [ ] **Custom hooks** - For component-specific store logic
- [ ] **Proper error messages** - Both success and error notifications
- [ ] **Loading states** - Show loading indicators
- [ ] **Bilingual support** - All user-facing text

---

## 🔧 Migration Guide

To migrate existing stores to the new pattern:

1. **Import base utilities:**
   ```typescript
   import { createAsyncStore, BaseStore } from '@/stores/base';
   ```

2. **Extend BaseStore:**
   ```typescript
   interface MyStore extends BaseStore {
     // ... your existing interface
   }
   ```

3. **Wrap store creator:**
   ```typescript
   export const useMyStore = create<MyStore>(
     createAsyncStore<MyStore>((set, get) => ({
       // ... your existing store logic
     }))
   );
   ```

4. **Replace manual loading/error handling:**
   ```typescript
   // Old way
   const fetchData = async () => {
     set({ isLoading: true, error: null });
     try {
       const data = await api.fetchData();
       set({ data, isLoading: false, success: true });
     } catch (error) {
       set({ error: error.message, isLoading: false });
     }
   };

   // New way
   const fetchData = async () => {
     return await get().handleAsyncAction(
       async () => {
         const data = await api.fetchData();
         set((state) => ({ ...state, data }));
         return data;
       },
       {
         operation: 'fetchData',
         errorMessage: 'Failed to fetch data',
       }
     );
   };
   ```

---

## 🚀 Example Implementation

See `stores/userStore.ts` for a complete example that demonstrates:
- Base store extension
- Async action handling
- Operation-specific states
- Custom hooks
- Error handling
- Notification integration

This example shows how to build a robust, scalable store that follows all our frontend standards!