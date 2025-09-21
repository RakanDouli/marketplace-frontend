import type { UserRole, ModulePermission, AdminUser } from '../types';

// Permission checking utilities for admin system

export class PermissionChecker {

  /**
   * Check if user has permission to access a specific module
   */
  static canAccessModule(
    userRole: UserRole,
    userPermissions: string[],
    requiredFeatures: string[]
  ): boolean {
    // Super admin has access to everything
    if (userRole === 'SUPER_ADMIN') {
      return true;
    }

    // Check if user has all required features
    return requiredFeatures.every(feature =>
      userPermissions.includes(feature) || userPermissions.includes('*')
    );
  }

  /**
   * Check if user can perform a specific action on a resource
   */
  static canPerformAction(
    userRole: UserRole,
    permissions: ModulePermission[],
    module: string,
    resource: string,
    action: string
  ): boolean {
    // Super admin can do everything
    if (userRole === 'SUPER_ADMIN') {
      return true;
    }

    const permission = permissions.find(p =>
      p.module === module && p.resource === resource
    );

    if (!permission) {
      return false;
    }

    // Check CRUD permissions
    switch (action) {
      case 'create':
        return permission.canCreate;
      case 'read':
      case 'list':
      case 'view':
        return permission.canRead;
      case 'update':
      case 'edit':
        return permission.canUpdate;
      case 'delete':
        return permission.canDelete;
      default:
        // Check custom actions
        return permission.allowedActions.includes(action) ||
               permission.allowedActions.includes('*');
    }
  }

  /**
   * Check if user can access a specific field
   */
  static canAccessField(
    userRole: UserRole,
    permissions: ModulePermission[],
    module: string,
    resource: string,
    field: string,
    action: 'read' | 'write'
  ): boolean {
    // Super admin can access all fields
    if (userRole === 'SUPER_ADMIN') {
      return true;
    }

    const permission = permissions.find(p =>
      p.module === module && p.resource === resource
    );

    if (!permission) {
      return false;
    }

    const fieldArray = action === 'read'
      ? permission.readableFields
      : permission.editableFields;

    // Check if all fields are allowed or specific field is in the list
    return fieldArray.includes('*') || fieldArray.includes(field);
  }

  /**
   * Get all visible fields for a resource
   */
  static getVisibleFields(
    userRole: UserRole,
    permissions: ModulePermission[],
    module: string,
    resource: string,
    allFields: string[]
  ): string[] {
    // Super admin sees all fields
    if (userRole === 'SUPER_ADMIN') {
      return allFields;
    }

    const permission = permissions.find(p =>
      p.module === module && p.resource === resource
    );

    if (!permission) {
      return [];
    }

    // If all fields are readable, return all
    if (permission.readableFields.includes('*')) {
      return allFields;
    }

    // Return intersection of all fields and readable fields
    return allFields.filter(field =>
      permission.readableFields.includes(field)
    );
  }

  /**
   * Get all editable fields for a resource
   */
  static getEditableFields(
    userRole: UserRole,
    permissions: ModulePermission[],
    module: string,
    resource: string,
    allFields: string[]
  ): string[] {
    // Super admin can edit all fields
    if (userRole === 'SUPER_ADMIN') {
      return allFields;
    }

    const permission = permissions.find(p =>
      p.module === module && p.resource === resource
    );

    if (!permission) {
      return [];
    }

    // If all fields are editable, return all
    if (permission.editableFields.includes('*')) {
      return allFields;
    }

    // Return intersection of all fields and editable fields
    return allFields.filter(field =>
      permission.editableFields.includes(field)
    );
  }

  /**
   * Get allowed actions for a resource
   */
  static getAllowedActions(
    userRole: UserRole,
    permissions: ModulePermission[],
    module: string,
    resource: string,
    allActions: string[]
  ): string[] {
    // Super admin can perform all actions
    if (userRole === 'SUPER_ADMIN') {
      return allActions;
    }

    const permission = permissions.find(p =>
      p.module === module && p.resource === resource
    );

    if (!permission) {
      return [];
    }

    const allowedActions: string[] = [];

    // Add CRUD actions based on permissions
    if (permission.canCreate) allowedActions.push('create');
    if (permission.canRead) allowedActions.push('read', 'list', 'view');
    if (permission.canUpdate) allowedActions.push('update', 'edit');
    if (permission.canDelete) allowedActions.push('delete');

    // Add custom actions
    if (permission.allowedActions.includes('*')) {
      return [...new Set([...allowedActions, ...allActions])];
    }

    return [...new Set([...allowedActions, ...permission.allowedActions])];
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(
    userPermissions: string[],
    requiredPermissions: string[]
  ): boolean {
    return requiredPermissions.some(permission =>
      userPermissions.includes(permission) || userPermissions.includes('*')
    );
  }

  /**
   * Check if user has all of the specified permissions
   */
  static hasAllPermissions(
    userPermissions: string[],
    requiredPermissions: string[]
  ): boolean {
    return requiredPermissions.every(permission =>
      userPermissions.includes(permission) || userPermissions.includes('*')
    );
  }

  /**
   * Filter data based on user permissions
   */
  static filterDataByPermissions<T extends Record<string, any>>(
    data: T[],
    userRole: UserRole,
    permissions: ModulePermission[],
    module: string,
    resource: string,
    visibleFields: string[]
  ): Partial<T>[] {
    // Super admin sees all data
    if (userRole === 'SUPER_ADMIN') {
      return data;
    }

    // Get visible fields for this user
    const allowedFields = this.getVisibleFields(
      userRole,
      permissions,
      module,
      resource,
      visibleFields
    );

    // Filter each data item to only include allowed fields
    return data.map(item => {
      const filteredItem: Partial<T> = {};
      allowedFields.forEach(field => {
        if (field in item) {
          filteredItem[field as keyof T] = item[field];
        }
      });
      return filteredItem;
    });
  }

  /**
   * Get permission level description for UI display
   */
  static getPermissionLevel(
    userRole: UserRole,
    permissions: ModulePermission[],
    module: string,
    resource: string
  ): 'none' | 'read' | 'write' | 'admin' | 'super' {
    if (userRole === 'SUPER_ADMIN') {
      return 'super';
    }

    const permission = permissions.find(p =>
      p.module === module && p.resource === resource
    );

    if (!permission) {
      return 'none';
    }

    if (permission.canDelete ||
        (permission.canCreate && permission.canUpdate && permission.canRead)) {
      return 'admin';
    }

    if (permission.canCreate || permission.canUpdate) {
      return 'write';
    }

    if (permission.canRead) {
      return 'read';
    }

    return 'none';
  }
}

// Utility functions for common permission checks
export function canAccessField(
  module: string,
  resource: string,
  field: string,
  action: 'read' | 'write',
  user: AdminUser,
  permissions: ModulePermission[]
): boolean {
  return PermissionChecker.canAccessField(
    user.role,
    permissions,
    module,
    resource,
    field,
    action
  );
}

export function canPerformAction(
  module: string,
  resource: string,
  action: string,
  user: AdminUser,
  permissions: ModulePermission[]
): boolean {
  return PermissionChecker.canPerformAction(
    user.role,
    permissions,
    module,
    resource,
    action
  );
}

export function getVisibleFields(
  module: string,
  resource: string,
  allFields: string[],
  user: AdminUser,
  permissions: ModulePermission[]
): string[] {
  return PermissionChecker.getVisibleFields(
    user.role,
    permissions,
    module,
    resource,
    allFields
  );
}

export function getEditableFields(
  module: string,
  resource: string,
  allFields: string[],
  user: AdminUser,
  permissions: ModulePermission[]
): string[] {
  return PermissionChecker.getEditableFields(
    user.role,
    permissions,
    module,
    resource,
    allFields
  );
}

export function getAllowedActions(
  module: string,
  resource: string,
  allActions: string[],
  user: AdminUser,
  permissions: ModulePermission[]
): string[] {
  return PermissionChecker.getAllowedActions(
    user.role,
    permissions,
    module,
    resource,
    allActions
  );
}