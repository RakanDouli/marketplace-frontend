// Admin System Core Types

export interface AdminModule {
  key: string;              // "user-management", "listing-management"
  name: string;             // "User Management"
  nameAr: string;           // "إدارة المستخدمين"
  icon: string;             // "Users", "Package", "Shield" (Lucide icon names)
  type: ModuleType;         // "crud", "dashboard", "workflow"
  basePath: string;         // "/admin/users"

  // Module configuration
  isActive: boolean;
  sortOrder: number;

  // Custom component for complex workflows
  customComponent?: string; // "CampaignManagement", "AnalyticsDashboard"

  // Required permissions to access module
  requiredPermissions: string[]; // ["users.manage", "roles.modify"]

  // UI configuration for CRUD modules
  config?: ModuleConfig;
}

export type ModuleType = 'crud' | 'dashboard' | 'workflow';

export interface ModuleConfig {
  // Table configuration
  listColumns?: ColumnConfig[];

  // Form configuration
  formFields?: FieldConfig[];

  // Filter configuration
  filters?: FilterConfig[];

  // Custom actions (beyond CRUD)
  customActions?: ActionConfig[];

  // Bulk operations
  bulkActions?: BulkActionConfig[];
}

export interface ColumnConfig {
  key: string;              // "name", "email", "user.name"
  label: string;            // "Name", "Email Address"
  labelAr?: string;         // Arabic label
  type: ColumnType;         // "text", "email", "date", "boolean", "enum"
  sortable?: boolean;
  searchable?: boolean;
  width?: string;           // "150px", "20%"
  render?: string;          // Custom render function name
}

export type ColumnType = 'text' | 'email' | 'date' | 'boolean' | 'enum' | 'currency' | 'relation';

export interface FieldConfig {
  key: string;              // "name", "email", "role"
  label: string;            // "Full Name", "Email Address"
  labelAr?: string;         // Arabic label
  type: FieldType;          // "text", "email", "select", "boolean"
  required?: boolean;
  default?: any;
  validation?: ValidationRule[];
  options?: OptionConfig[] | string; // For select fields - array or reference to options
  placeholder?: string;
  placeholderAr?: string;
}

export type FieldType = 'text' | 'email' | 'password' | 'select' | 'boolean' | 'textarea' | 'number' | 'date';

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern';
  value?: any;
  message: string;
  messageAr?: string;
}

export interface FilterConfig {
  key: string;              // "role", "isActive", "createdAt"
  label: string;            // "Role", "Status", "Created Date"
  labelAr?: string;         // Arabic label
  type: FilterType;         // "select", "boolean", "dateRange"
  options?: OptionConfig[] | string; // For select filters
}

export type FilterType = 'select' | 'boolean' | 'dateRange' | 'text' | 'number';

export interface OptionConfig {
  value: string | number | boolean;
  label: string;
  labelAr?: string;
}

export interface ActionConfig {
  key: string;              // "ban", "deactivate", "feature"
  label: string;            // "Ban User", "Deactivate"
  labelAr?: string;         // Arabic label
  icon: string;             // Lucide icon name
  variant: ActionVariant;   // "primary", "danger", "warning"
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  confirmationMessageAr?: string;
}

export type ActionVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'success';

export interface BulkActionConfig {
  key: string;              // "approve", "reject", "delete"
  label: string;            // "Approve Selected", "Reject Selected"
  labelAr?: string;         // Arabic label
  icon: string;             // Lucide icon name
  variant: ActionVariant;
  requiresConfirmation?: boolean;
}

// Permission System Types
export interface ModulePermission {
  moduleKey: string;        // "user-management"
  role: string;             // "EDITOR", "ADMIN", etc.
  resource: string;         // "users", "listings"

  // CRUD permissions
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;

  // Field-level permissions
  readableFields: string[] | '*';  // ["name", "email", "status"] or "*"
  editableFields: string[] | '*';  // ["status", "isActive"] or "*"

  // Custom actions
  allowedActions: string[] | '*';  // ["ban", "deactivate"] or "*"
}

// Admin Store States
export interface AdminModulesState {
  modules: AdminModule[];
  availableModules: AdminModule[]; // Filtered by user permissions
  isLoading: boolean;
  error: string | null;
}

export interface AdminPermissionsState {
  permissions: ModulePermission[];
  userRole: string | null;
  isLoading: boolean;
  error: string | null;
}

// Common admin data types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminListingMeta {
  id: string;
  title: string;
  status: string;
  sellerName: string;
  createdAt: string;
}

// GraphQL Response Types
export interface AdminModulesResponse {
  adminModules: AdminModule[];
}

export interface ModulePermissionsResponse {
  modulePermissions: ModulePermission[];
}

// Action Results
export interface AdminActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Route Resolution Types
export interface ResolvedAdminRoute {
  module: AdminModule;
  component: 'SmartCRUD' | 'CustomComponent';
  props: Record<string, any>;
}