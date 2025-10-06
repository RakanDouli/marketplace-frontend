import { useMemo } from "react";
import { useAdminAuthStore } from "@/stores/admin";

// Types for backend permission structure
interface FeaturePermissions {
  view?: boolean;
  create?: boolean;
  modify?: boolean;
  delete?: boolean;
}

interface UserPermissions {
  [feature: string]: FeaturePermissions;
}

export interface PermissionCheck {
  // Feature-based permissions (matches backend exactly)
  hasFeature: (feature: string) => boolean;
  canView: (feature: string) => boolean;
  canCreate: (feature: string) => boolean;
  canModify: (feature: string) => boolean;
  canDelete: (feature: string) => boolean;
  canAccess: (feature: string, action?: keyof FeaturePermissions) => boolean;

  // Multi-permission checks
  hasAnyFeature: (features: string[]) => boolean;
  hasAllFeatures: (features: string[]) => boolean;

  // Role-based fallback (for backward compatibility)
  hasRole: (roles: string | string[]) => boolean;
  isSuperAdmin: () => boolean;

  // UI helpers
  getAccessibleFeatures: (features: string[]) => string[];
  getFeaturePermissions: (feature: string) => FeaturePermissions;
}

/**
 * Dynamic permissions hook that works with the backend's feature-based RBAC system
 *
 * Backend structure (three-table system):
 * 1. roles table: id, name, description, priority, isActive
 * 2. features table: id, name, description, displayName, icon, defaultPermissions
 * 3. role_feature_permissions table: id, roleId, featureId, permissions (JSON)
 *
 * Available features from backend seeder:
 * - users, user_subscriptions, listings, categories, attributes, system, brands
 * - analytics, financial, roles, ad_packages, ad_clients, ad_campaigns, ad_reports
 * - email_templates, audit_logs
 *
 * Permission actions: view, create, modify, delete
 */
export function usePermissions(): PermissionCheck {
  const { user, isAuthenticated } = useAdminAuthStore();

  return useMemo(() => {
    // Simple permission checking - use permissions array from auth store
    const userPermissions = user?.permissions || [];
    const featurePermissions = user?.featurePermissions || {};

    // Debug logging (only in development)
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('[usePermissions] User:', user?.role, 'Permissions:', userPermissions);
    // }

    // Helper functions for permission checking
    const hasFeatureInternal = (feature: string): boolean => {
      if (!user || !isAuthenticated) return false;
      // Super admin has everything
      if (userPermissions.includes("*")) return true;
      // Check feature permissions object
      return feature in featurePermissions;
    };

    const canViewInternal = (feature: string): boolean => {
      if (!user || !isAuthenticated) return false;
      if (userPermissions.includes("*")) return true;
      return featurePermissions[feature]?.view === true;
    };

    const canCreateInternal = (feature: string): boolean => {
      if (!user || !isAuthenticated) return false;
      if (userPermissions.includes("*")) return true;
      return featurePermissions[feature]?.create === true;
    };

    const canModifyInternal = (feature: string): boolean => {
      if (!user || !isAuthenticated) return false;
      if (userPermissions.includes("*")) return true;
      return featurePermissions[feature]?.modify === true;
    };

    const canDeleteInternal = (feature: string): boolean => {
      if (!user || !isAuthenticated) return false;
      if (userPermissions.includes("*")) return true;
      return featurePermissions[feature]?.delete === true;
    };

    const canAccessInternal = (
      feature: string,
      action?: keyof FeaturePermissions
    ): boolean => {
      if (!user || !isAuthenticated) return false;
      if (userPermissions.includes("*")) return true;

      const featurePerms = featurePermissions[feature];
      if (!featurePerms) return false;

      // If no specific action, check if feature has any permission
      if (!action) {
        return Boolean(
          featurePerms.view ||
            featurePerms.create ||
            featurePerms.modify ||
            featurePerms.delete
        );
      }

      return featurePerms[action] === true;
    };

    const permissionCheck: PermissionCheck = {
      hasFeature: hasFeatureInternal,
      canView: canViewInternal,
      canCreate: canCreateInternal,
      canModify: canModifyInternal,
      canDelete: canDeleteInternal,
      canAccess: canAccessInternal,

      hasAnyFeature: (features: string[]) => {
        if (!user) return false;
        if (user.permissions?.includes("*")) return features.length > 0;
        return features.some((feature) => hasFeatureInternal(feature));
      },

      hasAllFeatures: (features: string[]) => {
        if (!user) return false;
        if (user.permissions?.includes("*")) return true;
        return features.every((feature) => hasFeatureInternal(feature));
      },

      // Role-based fallback (deprecated - use feature-based permissions instead)
      hasRole: (roles: string | string[]) => {
        if (!user) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
      },

      isSuperAdmin: () => {
        return user?.permissions?.includes("*") || false;
      },

      // UI helpers
      getAccessibleFeatures: (features: string[]) => {
        if (!user) return [];
        if (user.permissions?.includes("*")) return features;
        return features.filter((feature) => hasFeatureInternal(feature));
      },

      getFeaturePermissions: (feature: string): FeaturePermissions => {
        if (!user || !featurePermissions) return {};
        if (user.permissions?.includes("*")) {
          return { view: true, create: true, modify: true, delete: true };
        }
        return (featurePermissions as UserPermissions)[feature] || {};
      },
    };

    return permissionCheck;
  }, [user, isAuthenticated]);
}

// getUserPermissionsFromRole function removed - now handled in adminAuthStore

/**
 * Helper function to check if user has access to specific features
 * Use this in components to conditionally render or redirect
 */
export function checkFeatureAccess(
  permissions: PermissionCheck,
  requiredFeatures: string[],
  requiredAction?: keyof FeaturePermissions
): boolean {
  return requiredFeatures.some((feature) =>
    permissions.canAccess(feature, requiredAction)
  );
}

/**
 * Hook for UI components to check permissions easily
 */
export function useFeaturePermissions(feature: string) {
  const permissions = usePermissions();

  return {
    canView: permissions.canView(feature),
    canCreate: permissions.canCreate(feature),
    canModify: permissions.canModify(feature),
    canDelete: permissions.canDelete(feature),
    canAccess: permissions.canAccess(feature),
    permissions: permissions.getFeaturePermissions(feature),
  };
}
