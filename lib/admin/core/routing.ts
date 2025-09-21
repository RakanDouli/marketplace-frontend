import type { AdminModule, ResolvedAdminRoute, ComponentType, AdminAction } from '../types';

// Dynamic route resolution for admin system

export class AdminRouteResolver {
  private modules: AdminModule[] = [];

  constructor(modules: AdminModule[]) {
    this.modules = modules;
  }

  /**
   * Resolve admin route from URL slug
   */
  resolveRoute(slug: string[]): ResolvedAdminRoute | null {
    // Handle root admin route (dashboard)
    if (!slug || slug.length === 0) {
      return this.createDashboardRoute();
    }

    const [moduleKey, action, id] = slug;

    // Find module by key
    const module = this.modules.find(m => m.key === moduleKey);
    if (!module || !module.isActive) {
      return null;
    }

    // Resolve component and action based on module type
    return this.resolveModuleRoute(module, action, id);
  }

  /**
   * Create dashboard route
   */
  private createDashboardRoute(): ResolvedAdminRoute {
    return {
      module: {
        key: 'dashboard',
        name: 'Dashboard',
        nameAr: 'لوحة التحكم',
        icon: 'LayoutDashboard',
        type: 'dashboard',
        basePath: '/admin',
        isActive: true,
        sortOrder: 0,
        config: {},
        requiredFeatures: ['dashboard.view'],
        permissions: {}
      },
      component: 'Dashboard',
      action: 'view',
      props: {}
    };
  }

  /**
   * Resolve route for a specific module
   */
  private resolveModuleRoute(
    module: AdminModule,
    action?: string,
    id?: string
  ): ResolvedAdminRoute | null {
    let resolvedAction: AdminAction;
    let component: ComponentType;
    let props: Record<string, any> = {};

    // Determine action
    if (!action) {
      resolvedAction = 'list';
    } else if (['list', 'create', 'edit', 'view'].includes(action)) {
      resolvedAction = action as AdminAction;
    } else {
      // Invalid action
      return null;
    }

    // Set ID if provided
    if (id) {
      props.id = id;
    }

    // Determine component based on module type
    switch (module.type) {
      case 'crud':
        component = 'SmartCRUD';
        break;
      case 'workflow':
        component = 'CustomComponent';
        props.componentName = module.customComponent;
        break;
      case 'dashboard':
        component = 'Dashboard';
        break;
      default:
        return null;
    }

    return {
      module,
      component,
      action: resolvedAction,
      props: {
        ...props,
        action: resolvedAction
      }
    };
  }

  /**
   * Generate URL for a module and action
   */
  generateUrl(moduleKey: string, action?: AdminAction, id?: string): string {
    if (moduleKey === 'dashboard') {
      return '/admin';
    }

    let url = `/admin/${moduleKey}`;

    if (action && action !== 'list') {
      url += `/${action}`;
    }

    if (id) {
      url += `/${id}`;
    }

    return url;
  }

  /**
   * Get breadcrumb navigation for current route
   */
  getBreadcrumbs(route: ResolvedAdminRoute): Array<{ label: string; url: string }> {
    const breadcrumbs = [
      { label: 'Admin', url: '/admin' }
    ];

    if (route.module.key !== 'dashboard') {
      breadcrumbs.push({
        label: route.module.name,
        url: this.generateUrl(route.module.key)
      });

      // Add action breadcrumb if not list
      if (route.action !== 'list') {
        const actionLabels = {
          create: 'Create New',
          edit: 'Edit',
          view: 'View'
        };

        breadcrumbs.push({
          label: actionLabels[route.action as keyof typeof actionLabels] || route.action,
          url: this.generateUrl(route.module.key, route.action, route.props.id)
        });
      }
    }

    return breadcrumbs;
  }

  /**
   * Get navigation items for sidebar
   */
  getNavigationItems(userModules: AdminModule[]): Array<{
    key: string;
    label: string;
    labelAr: string;
    icon: string;
    url: string;
    isActive: boolean;
    children?: Array<{
      key: string;
      label: string;
      url: string;
    }>;
  }> {
    const items = [
      {
        key: 'dashboard',
        label: 'Dashboard',
        labelAr: 'لوحة التحكم',
        icon: 'LayoutDashboard',
        url: '/admin',
        isActive: true
      }
    ];

    // Sort modules by sortOrder
    const sortedModules = [...userModules]
      .filter(m => m.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    for (const module of sortedModules) {
      const item: {
        key: string;
        label: string;
        labelAr: string;
        icon: string;
        url: string;
        isActive: boolean;
        children?: Array<{
          key: string;
          label: string;
          url: string;
        }>;
      } = {
        key: module.key,
        label: module.name,
        labelAr: module.nameAr,
        icon: module.icon,
        url: this.generateUrl(module.key),
        isActive: module.isActive
      };

      // Add children for complex modules
      if (module.type === 'workflow' && module.key === 'campaign-management') {
        item.children = [
          { key: 'packages', label: 'Ad Packages', url: `/admin/${module.key}/packages` },
          { key: 'clients', label: 'Clients', url: `/admin/${module.key}/clients` },
          { key: 'campaigns', label: 'Campaigns', url: `/admin/${module.key}/campaigns` },
          { key: 'analytics', label: 'Analytics', url: `/admin/${module.key}/analytics` }
        ];
      }

      items.push(item);
    }

    return items;
  }

  /**
   * Check if route is accessible by user
   */
  canAccessRoute(
    route: ResolvedAdminRoute,
    userPermissions: string[]
  ): boolean {
    // Check if user has required features for module
    return route.module.requiredFeatures.every(feature =>
      userPermissions.includes(feature) || userPermissions.includes('*')
    );
  }

  /**
   * Get all available routes for a module
   */
  getModuleRoutes(module: AdminModule): Array<{
    action: AdminAction;
    url: string;
    requiresId: boolean;
  }> {
    const routes = [];

    if (module.type === 'crud') {
      routes.push(
        { action: 'list' as AdminAction, url: this.generateUrl(module.key), requiresId: false },
        { action: 'create' as AdminAction, url: this.generateUrl(module.key, 'create'), requiresId: false },
        { action: 'edit' as AdminAction, url: this.generateUrl(module.key, 'edit', ':id'), requiresId: true },
        { action: 'view' as AdminAction, url: this.generateUrl(module.key, 'view', ':id'), requiresId: true }
      );
    } else if (module.type === 'dashboard') {
      routes.push(
        { action: 'view' as AdminAction, url: this.generateUrl(module.key), requiresId: false }
      );
    } else if (module.type === 'workflow') {
      routes.push(
        { action: 'view' as AdminAction, url: this.generateUrl(module.key), requiresId: false }
      );
    }

    return routes;
  }

  /**
   * Validate route parameters
   */
  validateRoute(slug: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!slug || slug.length === 0) {
      return { isValid: true, errors: [] }; // Dashboard route
    }

    const [moduleKey, action, id] = slug;

    // Validate module key
    if (!moduleKey || !/^[a-z0-9-]+$/.test(moduleKey)) {
      errors.push('Invalid module key format');
    }

    // Validate action if provided
    if (action && !['list', 'create', 'edit', 'view'].includes(action)) {
      errors.push('Invalid action');
    }

    // Validate ID if provided
    if (id && (action === 'edit' || action === 'view')) {
      if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
        errors.push('Invalid ID format');
      }
    }

    // ID should only be provided for edit/view actions
    if (id && action && !['edit', 'view'].includes(action)) {
      errors.push('ID provided for action that does not require it');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get module by key
   */
  getModule(key: string): AdminModule | undefined {
    return this.modules.find(m => m.key === key && m.isActive);
  }

  /**
   * Get all active modules
   */
  getActiveModules(): AdminModule[] {
    return this.modules.filter(m => m.isActive);
  }

  /**
   * Update modules list
   */
  updateModules(modules: AdminModule[]): void {
    this.modules = modules;
  }
}

// Utility function to create a router instance
export function createAdminRouter(modules: AdminModule[]): AdminRouteResolver {
  return new AdminRouteResolver(modules);
}

// Export common route patterns
export const ADMIN_ROUTE_PATTERNS = {
  DASHBOARD: '/admin',
  MODULE_LIST: '/admin/:module',
  MODULE_CREATE: '/admin/:module/create',
  MODULE_EDIT: '/admin/:module/edit/:id',
  MODULE_VIEW: '/admin/:module/view/:id',
  CUSTOM_WORKFLOW: '/admin/:module/:submodule?'
} as const;