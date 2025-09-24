import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAdminAuthStore } from '@/stores/admin';
import { useAdminPermissionsStore } from '@/stores/adminPermissionsStore';
import { useAdminModulesStore } from '@/stores/admin';
import { PermissionChecker } from './permissions';
import type { AdminModule, ModulePermission, UserRole, FormState } from '../types';

// Shared hooks for admin system

/**
 * Hook for permission checking
 */
export function usePermissions(module?: string, resource?: string) {
  const { user } = useAdminAuthStore();
  const { permissions, isLoading } = useAdminPermissionsStore();

  const userRole = user?.role;
  const userPermissions = user?.permissions || [];

  const canCreate = useCallback((moduleKey?: string, resourceKey?: string) => {
    if (!user || !userRole) return false;
    const m = moduleKey || module;
    const r = resourceKey || resource;
    if (!m || !r) return false;

    return PermissionChecker.canPerformAction(
      userRole,
      permissions,
      m,
      r,
      'create'
    );
  }, [user, userRole, permissions, module, resource]);

  const canRead = useCallback((moduleKey?: string, resourceKey?: string) => {
    if (!user || !userRole) return false;
    const m = moduleKey || module;
    const r = resourceKey || resource;
    if (!m || !r) return false;

    return PermissionChecker.canPerformAction(
      userRole,
      permissions,
      m,
      r,
      'read'
    );
  }, [user, userRole, permissions, module, resource]);

  const canUpdate = useCallback((moduleKey?: string, resourceKey?: string) => {
    if (!user || !userRole) return false;
    const m = moduleKey || module;
    const r = resourceKey || resource;
    if (!m || !r) return false;

    return PermissionChecker.canPerformAction(
      userRole,
      permissions,
      m,
      r,
      'update'
    );
  }, [user, userRole, permissions, module, resource]);

  const canDelete = useCallback((moduleKey?: string, resourceKey?: string) => {
    if (!user || !userRole) return false;
    const m = moduleKey || module;
    const r = resourceKey || resource;
    if (!m || !r) return false;

    return PermissionChecker.canPerformAction(
      userRole,
      permissions,
      m,
      r,
      'delete'
    );
  }, [user, userRole, permissions, module, resource]);

  const canPerformAction = useCallback((
    action: string,
    moduleKey?: string,
    resourceKey?: string
  ) => {
    if (!user || !userRole) return false;
    const m = moduleKey || module;
    const r = resourceKey || resource;
    if (!m || !r) return false;

    return PermissionChecker.canPerformAction(
      userRole,
      permissions,
      m,
      r,
      action
    );
  }, [user, userRole, permissions, module, resource]);

  const canAccessField = useCallback((
    field: string,
    action: 'read' | 'write',
    moduleKey?: string,
    resourceKey?: string
  ) => {
    if (!user || !userRole) return false;
    const m = moduleKey || module;
    const r = resourceKey || resource;
    if (!m || !r) return false;

    return PermissionChecker.canAccessField(
      userRole,
      permissions,
      m,
      r,
      field,
      action
    );
  }, [user, userRole, permissions, module, resource]);

  const getVisibleFields = useCallback((
    allFields: string[],
    moduleKey?: string,
    resourceKey?: string
  ) => {
    if (!user || !userRole) return [];
    const m = moduleKey || module;
    const r = resourceKey || resource;
    if (!m || !r) return [];

    return PermissionChecker.getVisibleFields(
      userRole,
      permissions,
      m,
      r,
      allFields
    );
  }, [user, userRole, permissions, module, resource]);

  const getEditableFields = useCallback((
    allFields: string[],
    moduleKey?: string,
    resourceKey?: string
  ) => {
    if (!user || !userRole) return [];
    const m = moduleKey || module;
    const r = resourceKey || resource;
    if (!m || !r) return [];

    return PermissionChecker.getEditableFields(
      userRole,
      permissions,
      m,
      r,
      allFields
    );
  }, [user, userRole, permissions, module, resource]);

  const getAllowedActions = useCallback((
    allActions: string[],
    moduleKey?: string,
    resourceKey?: string
  ) => {
    if (!user || !userRole) return [];
    const m = moduleKey || module;
    const r = resourceKey || resource;
    if (!m || !r) return [];

    return PermissionChecker.getAllowedActions(
      userRole,
      permissions,
      m,
      r,
      allActions
    );
  }, [user, userRole, permissions, module, resource]);

  const hasPermission = useCallback((permission: string) => {
    return userPermissions.includes(permission) || userPermissions.includes('*');
  }, [userPermissions]);

  const hasAnyPermission = useCallback((requiredPermissions: string[]) => {
    return PermissionChecker.hasAnyPermission(userPermissions, requiredPermissions);
  }, [userPermissions]);

  const hasAllPermissions = useCallback((requiredPermissions: string[]) => {
    return PermissionChecker.hasAllPermissions(userPermissions, requiredPermissions);
  }, [userPermissions]);

  return {
    // Permission checking functions
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canPerformAction,
    canAccessField,
    getVisibleFields,
    getEditableFields,
    getAllowedActions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // User info
    user,
    userRole,
    userPermissions,
    isLoading
  };
}

/**
 * Hook for admin module management
 */
export function useAdminModules() {
  const { user } = useAdminAuthStore();
  const {
    modules,
    loadModules,
    canAccessModule,
    resolveRoute,
    isLoading,
    error
  } = useAdminModulesStore();

  // Filter modules based on user permissions
  const userModules = useMemo(() => {
    if (!user) return [];

    return modules.filter(module =>
      canAccessModule(module.key, user.permissions)
    );
  }, [modules, user]);

  // Load modules on mount if not already loaded
  useEffect(() => {
    if (!isLoading && modules.length === 0) {
      loadModules();
    }
  }, [loadModules, isLoading, modules.length]);

  return {
    modules: userModules,
    allModules: modules,
    loadModules,
    canAccessModule,
    resolveRoute,
    isLoading,
    error
  };
}

// Removed useAdminForm hook - no longer needed with Input component approach

/**
 * Hook for data fetching with loading states
 */
export function useAdminData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch
  };
}

/**
 * Hook for pagination management
 */
export function usePagination(
  initialPage: number = 1,
  initialLimit: number = 10
) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  }, []);

  const updateTotal = useCallback((newTotal: number) => {
    setTotal(newTotal);
  }, []);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    changeLimit,
    updateTotal
  };
}

/**
 * Hook for sorting management
 */
export function useSorting(
  initialSortBy?: string,
  initialSortOrder: 'ASC' | 'DESC' = 'ASC'
) {
  const [sortBy, setSortBy] = useState<string | undefined>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(initialSortOrder);

  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      // Toggle sort order for same column
      setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // Set new column with default ASC order
      setSortBy(column);
      setSortOrder('ASC');
    }
  }, [sortBy]);

  const clearSort = useCallback(() => {
    setSortBy(undefined);
    setSortOrder('ASC');
  }, []);

  return {
    sortBy,
    sortOrder,
    handleSort,
    clearSort
  };
}

/**
 * Hook for managing selected items in data tables
 */
export function useSelection<T extends { id: string }>(
  items: T[] = []
) {
  const [selectedItems, setSelectedItems] = useState<T[]>([]);

  const isSelected = useCallback((item: T) => {
    return selectedItems.some(selected => selected.id === item.id);
  }, [selectedItems]);

  const selectItem = useCallback((item: T) => {
    setSelectedItems(prev => {
      if (prev.some(selected => selected.id === item.id)) {
        return prev; // Already selected
      }
      return [...prev, item];
    });
  }, []);

  const deselectItem = useCallback((item: T) => {
    setSelectedItems(prev =>
      prev.filter(selected => selected.id !== item.id)
    );
  }, []);

  const toggleItem = useCallback((item: T) => {
    if (isSelected(item)) {
      deselectItem(item);
    } else {
      selectItem(item);
    }
  }, [isSelected, selectItem, deselectItem]);

  const selectAll = useCallback(() => {
    setSelectedItems([...items]);
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedItems.length === items.length) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [selectedItems.length, items.length, selectAll, deselectAll]);

  return {
    selectedItems,
    isSelected,
    selectItem,
    deselectItem,
    toggleItem,
    selectAll,
    deselectAll,
    toggleAll,
    selectedCount: selectedItems.length,
    isAllSelected: selectedItems.length === items.length && items.length > 0,
    isNoneSelected: selectedItems.length === 0
  };
}