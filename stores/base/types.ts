// Base async state types for all stores
export interface AsyncState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

// Generic async operation result
export interface AsyncResult<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

// Base store state that all stores can extend
export interface BaseStoreState {
  // Main loading/error/success state
  isLoading: boolean;
  error: string | null;
  success: boolean;
  
  // Individual operation states (optional)
  operations?: Record<string, AsyncState>;
}

// Action status for notifications
export type ActionStatus = 'idle' | 'loading' | 'success' | 'error';

// Generic action result with metadata
export interface ActionResult<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
  timestamp: Date;
}