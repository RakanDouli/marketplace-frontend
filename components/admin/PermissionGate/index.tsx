'use client';

import { ReactNode } from 'react';
import { useAdminAuthStore } from '@/stores/admin/adminAuthStore';

export interface PermissionGateProps {
  children: ReactNode;
  /** Required permission (e.g., 'users.view', 'listings.modify') */
  permission?: string;
  /** Array of permissions - user needs ANY of these */
  anyPermissions?: string[];
  /** Array of permissions - user needs ALL of these */
  allPermissions?: string[];
  /** Required role(s) */
  roles?: string | string[];
  /** Fallback content when permission is denied */
  fallback?: ReactNode;
  /** Show loading state while checking permissions */
  showLoading?: boolean;
}

/**
 * Permission Gate Component
 *
 * Controls access to admin features based on user permissions and roles.
 * Supports both legacy permission strings and feature-based permissions.
 *
 * @example
 * // Single permission check
 * <PermissionGate permission="users.view">
 *   <UsersList />
 * </PermissionGate>
 *
 * @example
 * // Multiple permission check (any)
 * <PermissionGate anyPermissions={['users.view', 'users.modify']}>
 *   <UsersPanel />
 * </PermissionGate>
 *
 * @example
 * // Role-based access
 * <PermissionGate roles={['SUPER_ADMIN', 'ADMIN']}>
 *   <SystemSettings />
 * </PermissionGate>
 *
 * @example
 * // With fallback
 * <PermissionGate
 *   permission="users.create"
 *   fallback={<div>You don't have permission to create users</div>}
 * >
 *   <CreateUserButton />
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  anyPermissions,
  allPermissions,
  roles,
  fallback = null,
  showLoading = false
}) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    checkPermission,
    hasAnyPermission,
    hasAllPermissions
  } = useAdminAuthStore();

  // Show loading state if authentication is in progress
  if (isLoading && showLoading) {
    return (
      <div className="permission-gate-loading">
        <div className="animate-pulse">جاري التحقق من الصلاحيات...</div>
      </div>
    );
  }

  // Not authenticated - deny access
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Check role-based access first (highest priority)
  if (roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    const hasRole = allowedRoles.includes(user.role);

    if (!hasRole) {
      return <>{fallback}</>;
    }
  }

  // Super admin bypass - has access to everything
  if (user.permissions?.includes('*')) {
    return <>{children}</>;
  }

  // Check specific permission
  if (permission) {
    const hasPermission = checkPermission(permission);
    if (!hasPermission) {
      return <>{fallback}</>;
    }
  }

  // Check any permissions (user needs at least one)
  if (anyPermissions && anyPermissions.length > 0) {
    const hasAny = hasAnyPermission(anyPermissions);
    if (!hasAny) {
      return <>{fallback}</>;
    }
  }

  // Check all permissions (user needs all of them)
  if (allPermissions && allPermissions.length > 0) {
    const hasAll = hasAllPermissions(allPermissions);
    if (!hasAll) {
      return <>{fallback}</>;
    }
  }

  // All checks passed - render children
  return <>{children}</>;
};

/**
 * Higher-order component version of PermissionGate
 *
 * @example
 * const ProtectedUsersList = withPermission(UsersList, { permission: 'users.view' });
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permissionProps: Omit<PermissionGateProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <PermissionGate {...permissionProps}>
      <Component {...props} />
    </PermissionGate>
  );

  WrappedComponent.displayName = `withPermission(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook to check permissions programmatically
 *
 * @example
 * const { canView, canEdit, canDelete } = usePermissionCheck({
 *   view: 'users.view',
 *   edit: 'users.modify',
 *   delete: 'users.delete'
 * });
 */
export function usePermissionCheck(permissions: Record<string, string>) {
  const { checkPermission } = useAdminAuthStore();

  const result: Record<string, boolean> = {};

  Object.entries(permissions).forEach(([key, permission]) => {
    result[key] = checkPermission(permission);
  });

  return result;
}

/**
 * Hook to get current user's feature permissions object
 *
 * @example
 * const featurePermissions = useFeaturePermissions();
 * const canCreateUsers = featurePermissions.users?.create || false;
 */
export function useFeaturePermissions() {
  const { user } = useAdminAuthStore();
  return user?.featurePermissions || {};
}

export default PermissionGate;