import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface UseGraphQLErrorOptions {
  onError?: (error: any) => void;
  logErrors?: boolean;
}

/**
 * Custom hook to handle GraphQL errors consistently
 * TODO: Replace with proper Apollo Client integration
 */
export const useGraphQLError = (
  error: any,
  options: UseGraphQLErrorOptions = {}
) => {
  const { onError, logErrors = true } = options;
  const { logout, setError: setAuthError } = useAuthStore();

  useEffect(() => {
    if (!error) return;

    if (logErrors) {
      console.error('Error:', error);
    }

    // Simple error handling - will be enhanced when Apollo is properly integrated
    if (error.message) {
      setAuthError(error.message);
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error);
    }
  }, [error, onError, logErrors, setAuthError]);

  return {
    hasError: !!error,
    errorMessage: error?.message || 'An error occurred',
  };
};