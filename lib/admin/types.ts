// Core TypeScript interfaces for admin system

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'ADS_MANAGER' | 'USER';

export type ModuleType = 'crud' | 'dashboard' | 'workflow';

export type ComponentType = 'SmartCRUD' | 'CustomComponent' | 'Dashboard';

export type AdminAction = 'create' | 'read' | 'update' | 'delete' | 'list' | 'view' | 'edit';

// Permission Configuration Interfaces
export interface PermissionConfig {
  [role: string]: {
    [resource: string]: {
      read?: boolean | string[];
      create?: boolean | string[];
      update?: boolean | string[];
      delete?: boolean;
      actions?: string[] | "*";
    };
  };
}

export interface ModulePermission {
  module: string;
  resource: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  readableFields: string[];
  editableFields: string[];
  allowedActions: string[];
}

// Admin Module Configuration
export interface AdminModule {
  key: string;
  name: string;
  nameAr: string;
  icon: string;
  type: ModuleType;
  basePath: string;
  isActive: boolean;
  sortOrder: number;

  // CRUD configuration (for type: "crud")
  listQuery?: string;
  createMutation?: string;
  updateMutation?: string;
  deleteMutation?: string;

  // Custom component (for type: "workflow")
  customComponent?: string;

  // UI configuration
  config: ModuleConfig;

  // Permissions
  requiredFeatures: string[];
  permissions: PermissionConfig;
}

// Module UI Configuration
export interface ModuleConfig {
  listColumns?: ColumnConfig[];
  formFields?: FieldConfig[];
  filters?: FilterConfig[];
  customActions?: ActionConfig[];
  bulkActions?: ActionConfig[];
}

export interface ColumnConfig {
  key: string;
  label: string;
  labelAr?: string;
  type: 'text' | 'email' | 'number' | 'date' | 'boolean' | 'enum' | 'currency' | 'relation';
  sortable?: boolean;
  searchable?: boolean;
  width?: string;
  format?: string;
}

export interface FieldConfig {
  key: string;
  label: string;
  labelAr?: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'boolean' | 'select' | 'textarea' | 'file';
  required?: boolean;
  placeholder?: string;
  placeholderAr?: string;
  validation?: ValidationRule[];
  options?: string | OptionConfig[];
  default?: any;
}

export interface FilterConfig {
  key: string;
  label: string;
  labelAr?: string;
  type: 'text' | 'select' | 'date' | 'boolean' | 'number' | 'range';
  options?: string | OptionConfig[];
  multiple?: boolean;
}

export interface ActionConfig {
  key: string;
  label: string;
  labelAr?: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  confirmationMessageAr?: string;
}

export interface OptionConfig {
  value: string | number;
  label: string;
  labelAr?: string;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message?: string;
  messageAr?: string;
}

// Route Resolution
export interface RouteConfig {
  path: string;
  component: ComponentType;
  action: AdminAction;
  props?: Record<string, any>;
}

export interface ResolvedAdminRoute {
  module: AdminModule;
  component: ComponentType;
  action: AdminAction;
  props: Record<string, any>;
}

// Admin User & Authentication
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminAuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Admin Permissions State
export interface AdminPermissionsState {
  permissions: string[];
  userRole: UserRole | null;
  isLoading: boolean;
  error: string | null;
}

// Admin Modules State
export interface AdminModulesState {
  modules: AdminModule[];
  availableModules: AdminModule[];
  isLoading: boolean;
  error: string | null;
}

// Dashboard Analytics
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalListings: number;
  activeListings: number;
  totalRevenue: number;
  revenueThisMonth: number;
  newUsersThisMonth: number;
  newListingsThisMonth: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// GraphQL Input Types
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UpdateUserInput {
  id: string;
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserFilterInput {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export interface PaginationInput {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Form State Management
export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

export interface AdminFormProps<T = any> {
  initialData?: T;
  fields: FieldConfig[];
  onSubmit: (data: T) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

// Data Table Types
export interface DataTableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'action';
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface DataTableAction {
  key: string;
  label: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'danger';
  onClick: (row: any) => void;
  isVisible?: (row: any) => boolean;
  isDisabled?: (row: any) => boolean;
}

export interface DataTableProps {
  data: any[];
  columns: DataTableColumn[];
  actions?: DataTableAction[];
  bulkActions?: DataTableAction[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    onSort: (sortBy: string, sortOrder: 'ASC' | 'DESC') => void;
  };
  selection?: {
    selectedRows: any[];
    onSelectionChange: (selectedRows: any[]) => void;
  };
  isLoading?: boolean;
  emptyMessage?: string;
}