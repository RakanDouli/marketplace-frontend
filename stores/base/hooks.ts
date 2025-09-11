import { useCallback } from 'react';
import { BaseStore } from './createAsyncStore';
import { AsyncState } from './types';

// Custom hooks for common store patterns

// Hook to get loading state (either main or operation-specific)
export function useStoreLoading<T extends BaseStore>(
  store: T,
  operation?: string
): boolean {
  if (operation && store.operations?.[operation]) {
    return store.operations[operation].isLoading;
  }
  return store.isLoading;
}

// Hook to get error state (either main or operation-specific)
export function useStoreError<T extends BaseStore>(
  store: T,
  operation?: string
): string | null {
  if (operation && store.operations?.[operation]) {
    return store.operations[operation].error;
  }
  return store.error;
}

// Hook to get success state (either main or operation-specific)
export function useStoreSuccess<T extends BaseStore>(
  store: T,
  operation?: string
): boolean {
  if (operation && store.operations?.[operation]) {
    return store.operations[operation].success;
  }
  return store.success;
}

// Hook to get complete async state
export function useAsyncState<T extends BaseStore>(
  store: T,
  operation?: string
): AsyncState {
  const isLoading = useStoreLoading(store, operation);
  const error = useStoreError(store, operation);
  const success = useStoreSuccess(store, operation);

  return { isLoading, error, success };
}

// Hook for common async actions with automatic state management
export function useAsyncAction<T extends BaseStore>(
  store: T
) {
  return useCallback(
    async <U>(
      action: () => Promise<U>,
      options?: {
        operation?: string;
        successMessage?: string;
        errorMessage?: string;
        showNotification?: boolean;
      }
    ) => {
      return await store.handleAsyncAction(action, options);
    },
    [store]
  );
}

// Hook to create operation-specific handlers
export function useOperationHandlers<T extends BaseStore>(
  store: T,
  operation: string
) {
  return {
    isLoading: useStoreLoading(store, operation),
    error: useStoreError(store, operation),
    success: useStoreSuccess(store, operation),
    reset: useCallback(() => store.resetOperation(operation), [store, operation]),
    setState: useCallback(
      (state: Partial<AsyncState>) => store.setOperationState(operation, state),
      [store, operation]
    ),
  };
}

// Hook for form submission patterns
export function useFormSubmission<T extends BaseStore, U>(
  store: T,
  submitAction: (data: U) => Promise<any>,
  options?: {
    operation?: string;
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (result: any) => void;
    onError?: (error: string) => void;
  }
) {
  const executeAction = useAsyncAction(store);

  return useCallback(
    async (data: U) => {
      const result = await executeAction(
        () => submitAction(data),
        {
          operation: options?.operation || 'submit',
          successMessage: options?.successMessage,
          errorMessage: options?.errorMessage,
        }
      );

      if (result.success && options?.onSuccess) {
        options.onSuccess(result.data);
      } else if (!result.success && options?.onError) {
        options.onError(result.error || 'Submission failed');
      }

      return result;
    },
    [executeAction, submitAction, options]
  );
}