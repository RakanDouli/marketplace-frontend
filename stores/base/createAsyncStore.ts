import { StateCreator } from 'zustand';
import { BaseStoreState, AsyncState, ActionResult } from './types';

// Base actions that every store gets
export interface BaseStoreActions {
  // Main state setters
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  
  // Reset functions
  resetState: () => void;
  resetError: () => void;
  
  // Operation-specific state management
  setOperationState: (operation: string, state: Partial<AsyncState>) => void;
  resetOperation: (operation: string) => void;
  
  // Utility functions
  handleAsyncAction: <T>(
    action: () => Promise<T>,
    options?: {
      operation?: string;
      successMessage?: string;
      errorMessage?: string;
      showNotification?: boolean;
    }
  ) => Promise<ActionResult<T>>;
}

export type BaseStore = BaseStoreState & BaseStoreActions;

// Initial state factory
export const createInitialState = (): BaseStoreState => ({
  isLoading: false,
  error: null,
  success: false,
  operations: {},
});

// Base store creator that provides common functionality
export function createAsyncStore<T extends BaseStore>(
  storeCreator: StateCreator<T, [], [], T>
): StateCreator<T, [], [], T> {
  return (set, get, api) => {
    const baseActions: BaseStoreActions = {
      setLoading: (loading: boolean) => {
        set((state) => ({ ...state, isLoading: loading }));
      },

      setError: (error: string | null) => {
        set((state) => ({ 
          ...state, 
          error, 
          success: error ? false : state.success 
        }));
      },

      setSuccess: (success: boolean) => {
        set((state) => ({ 
          ...state, 
          success, 
          error: success ? null : state.error 
        }));
      },

      resetState: () => {
        set((state) => ({ 
          ...state, 
          ...createInitialState() 
        }));
      },

      resetError: () => {
        set((state) => ({ 
          ...state, 
          error: null 
        }));
      },

      setOperationState: (operation: string, operationState: Partial<AsyncState>) => {
        set((state) => ({
          ...state,
          operations: {
            ...state.operations,
            [operation]: {
              isLoading: false,
              error: null,
              success: false,
              ...state.operations?.[operation],
              ...operationState,
            },
          },
        }));
      },

      resetOperation: (operation: string) => {
        set((state) => ({
          ...state,
          operations: {
            ...state.operations,
            [operation]: {
              isLoading: false,
              error: null,
              success: false,
            },
          },
        }));
      },

      handleAsyncAction: async <U>(
        action: () => Promise<U>,
        options: {
          operation?: string;
          successMessage?: string;
          errorMessage?: string;
          showNotification?: boolean;
        } = {}
      ): Promise<ActionResult<U>> => {
        const { operation, successMessage, errorMessage, showNotification = true } = options;
        
        try {
          // Set loading state
          if (operation) {
            get().setOperationState(operation, { isLoading: true, error: null });
          } else {
            get().setLoading(true);
            get().setError(null);
          }

          // Execute the action
          const result = await action();

          // Set success state
          if (operation) {
            get().setOperationState(operation, { isLoading: false, success: true });
          } else {
            get().setLoading(false);
            get().setSuccess(true);
          }

          // Show success notification if enabled
          if (showNotification && successMessage) {
            // Import notification store dynamically to avoid circular deps
            const { useNotificationStore } = await import('../notificationStore');
            useNotificationStore.getState().addNotification({
              type: 'success',
              title: 'Success',
              message: successMessage,
            });
          }

          return {
            data: result,
            success: true,
            timestamp: new Date(),
            message: successMessage,
          };

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : errorMessage || 'An error occurred';

          // Set error state
          if (operation) {
            get().setOperationState(operation, { isLoading: false, error: errorMsg });
          } else {
            get().setLoading(false);
            get().setError(errorMsg);
          }

          // Show error notification if enabled
          if (showNotification) {
            const { useNotificationStore } = await import('../notificationStore');
            useNotificationStore.getState().addNotification({
              type: 'error',
              title: 'Error',
              message: errorMsg,
            });
          }

          return {
            error: errorMsg,
            success: false,
            timestamp: new Date(),
          };
        }
      },
    };

    const state = storeCreator(set, get, api);

    return {
      ...createInitialState(),
      ...baseActions,
      ...state,
    } as T;
  };
}