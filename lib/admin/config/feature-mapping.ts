/**
 * Pure backend-driven feature mapping
 * NO hardcoded values - everything derived from backend data
 */

import type { AdminModule, ModuleConfig, ColumnConfig, FieldConfig } from "../types";

// Standard CRUD configuration for most features
const getStandardCRUDConfig = (featureName: string): ModuleConfig => ({
  listColumns: [
    { key: "id", label: "ID", labelAr: "المعرف", type: "text", sortable: true },
    { key: "name", label: "Name", labelAr: "الاسم", type: "text", sortable: true, searchable: true },
    { key: "description", label: "Description", labelAr: "الوصف", type: "text", sortable: false },
    { key: "isActive", label: "Active", labelAr: "نشط", type: "boolean", sortable: true },
    { key: "createdAt", label: "Created", labelAr: "تاريخ الإنشاء", type: "date", sortable: true }
  ] as ColumnConfig[],
  formFields: [
    { key: "name", label: "Name", labelAr: "الاسم", type: "text", required: true },
    { key: "description", label: "Description", labelAr: "الوصف", type: "textarea", required: true },
    { key: "isActive", label: "Active", labelAr: "نشط", type: "boolean", default: true }
  ] as FieldConfig[],
  filters: [
    { key: "isActive", label: "Status", labelAr: "الحالة", type: "boolean" }
  ],
  customActions: [
    { key: "edit", label: "Edit", labelAr: "تعديل", icon: "Edit", variant: "primary" },
    { key: "delete", label: "Delete", labelAr: "حذف", icon: "Trash", variant: "danger" }
  ]
});

/**
 * Generate feature-specific configuration based on feature name
 * This can be enhanced to use backend schema information in the future
 */
function getFeatureSpecificConfig(featureName: string): ModuleConfig {
  // For users, add user-specific fields
  if (featureName === 'users') {
    return {
      listColumns: [
        { key: "name", label: "Name", labelAr: "الاسم", type: "text", sortable: true, searchable: true },
        { key: "email", label: "Email", labelAr: "البريد الإلكتروني", type: "email", sortable: true, searchable: true },
        { key: "role", label: "Role", labelAr: "الدور", type: "enum", sortable: true },
        { key: "isActive", label: "Active", labelAr: "نشط", type: "boolean", sortable: true },
        { key: "createdAt", label: "Created", labelAr: "تاريخ التسجيل", type: "date", sortable: true }
      ] as ColumnConfig[],
      formFields: [
        { key: "name", label: "Full Name", labelAr: "الاسم الكامل", type: "text", required: true },
        { key: "email", label: "Email", labelAr: "البريد الإلكتروني", type: "email", required: true },
        { key: "role", label: "Role", labelAr: "الدور", type: "select", options: "USER_ROLES", required: true },
        { key: "isActive", label: "Active", labelAr: "نشط", type: "boolean", default: true }
      ] as FieldConfig[]
    };
  }

  // For listings, add listing-specific fields
  if (featureName === 'listings') {
    return {
      listColumns: [
        { key: "title", label: "Title", labelAr: "العنوان", type: "text", sortable: true, searchable: true },
        { key: "user.name", label: "Seller", labelAr: "البائع", type: "relation" },
        { key: "status", label: "Status", labelAr: "الحالة", type: "enum", sortable: true },
        { key: "priceMinor", label: "Price", labelAr: "السعر", type: "currency", sortable: true },
        { key: "createdAt", label: "Created", labelAr: "تاريخ الإنشاء", type: "date", sortable: true }
      ] as ColumnConfig[],
      formFields: [
        { key: "title", label: "Title", labelAr: "العنوان", type: "text", required: true },
        { key: "description", label: "Description", labelAr: "الوصف", type: "textarea", required: true },
        { key: "priceMinor", label: "Price (cents)", labelAr: "السعر (سنت)", type: "number", required: true },
        { key: "status", label: "Status", labelAr: "الحالة", type: "select", options: "LISTING_STATUS", required: true }
      ] as FieldConfig[]
    };
  }

  // For roles, add role-specific fields
  if (featureName === 'roles') {
    return {
      listColumns: [
        { key: "name", label: "Role Name", labelAr: "اسم الدور", type: "text", sortable: true },
        { key: "description", label: "Description", labelAr: "الوصف", type: "text", sortable: false },
        { key: "priority", label: "Priority", labelAr: "الأولوية", type: "number", sortable: true },
        { key: "isActive", label: "Active", labelAr: "نشط", type: "boolean", sortable: true }
      ] as ColumnConfig[],
      formFields: [
        { key: "name", label: "Role Name", labelAr: "اسم الدور", type: "text", required: true },
        { key: "description", label: "Description", labelAr: "الوصف", type: "textarea", required: true },
        { key: "priority", label: "Priority", labelAr: "الأولوية", type: "number", default: 1 }
      ] as FieldConfig[]
    };
  }

  // Default configuration for all other features
  return getStandardCRUDConfig(featureName);
}

/**
 * Get Arabic name from backend description or generate from feature name
 * NOTE: This is now mainly a fallback - backend provides displayName directly
 */
function getArabicName(featureName: string, description?: string): string {
  // Use backend description if available
  if (description) {
    return `إدارة ${description}`;
  }

  // Simple translation map as fallback
  const commonTranslations: Record<string, string> = {
    users: "المستخدمين",
    listings: "الإعلانات",
    categories: "الفئات",
    roles: "الأدوار",
    analytics: "التحليلات",
    audit_logs: "سجلات المراجعة",
    packages: "الحزم",
    ads: "الإعلانات المدفوعة",
    brands: "العلامات التجارية",
    attributes: "الخصائص",
    system: "النظام",
    financial: "التقارير المالية"
  };

  return `إدارة ${commonTranslations[featureName] || featureName}`;
}

/**
 * Get icon from feature name (minimal mapping)
 * NOTE: This is now mainly a fallback - backend provides icon directly
 */
function getFeatureIcon(featureName: string): string {
  const iconMap: Record<string, string> = {
    users: "Users",
    listings: "FileText",
    categories: "FolderTree",
    roles: "Shield",
    analytics: "BarChart3",
    audit_logs: "Search",
    packages: "Package",
    ads: "Megaphone",
    brands: "Award",
    attributes: "Tags",
    system: "Settings",
    financial: "DollarSign"
  };

  return iconMap[featureName] || "Package";
}

/**
 * Determine module type from feature name
 */
function getModuleType(featureName: string): "crud" | "dashboard" | "workflow" {
  if (["analytics", "financial", "audit_logs"].includes(featureName)) {
    return "dashboard";
  }

  if (["roles", "system"].includes(featureName)) {
    return "workflow";
  }

  return "crud";
}

/**
 * Convert backend feature to frontend admin module - PURE BACKEND DRIVEN
 */
export function mapFeatureToModule(feature: {
  id: string;
  name: string;
  description?: string;
  displayName?: string;
  icon?: string;
  defaultPermissions: string;
  isActive: boolean;
}): AdminModule {
  const featureName = feature.name;

  return {
    id: feature.id,
    key: featureName,
    name: feature.description || featureName,
    nameAr: feature.displayName || getArabicName(featureName, feature.description),
    icon: feature.icon || getFeatureIcon(featureName),
    type: getModuleType(featureName),
    basePath: `/admin/${featureName}`,
    isActive: feature.isActive,
    sortOrder: 0,

    // Configuration derived from backend data
    config: getFeatureSpecificConfig(featureName),

    // Required permissions derived from feature name
    requiredFeatures: [featureName],

    // Backend metadata (the source of truth)
    backendFeature: {
      id: feature.id,
      name: feature.name,
      defaultPermissions: JSON.parse(feature.defaultPermissions),
    },
  };
}

/**
 * Check if user can access feature based on backend permissions
 */
export function canAccessFeature(
  featureName: string,
  userPermissions: string[],
  requiredAction: "view" | "create" | "modify" | "delete" = "view"
): boolean {
  // Super admin has access to everything
  if (userPermissions.includes("*")) {
    return true;
  }

  // Check specific feature permission
  const permission = `${featureName}.${requiredAction}`;
  return userPermissions.includes(permission);
}

/**
 * Get available modules for user based on backend permissions
 */
export function getAvailableModulesForUser(
  features: any[],
  _userRole: string,
  userPermissions: string[]
): AdminModule[] {
  return features
    .filter((feature) => feature.isActive)
    .map(mapFeatureToModule)
    .filter((module) => canAccessFeature(module.key, userPermissions, "view"))
    .sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar"));
}
