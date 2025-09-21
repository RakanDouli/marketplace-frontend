import type { AdminModule } from '../types';

// Central configuration for all admin modules
// This data would normally come from the backend API

export const ADMIN_MODULES_CONFIG: AdminModule[] = [
  // Dashboard Module
  {
    key: 'dashboard',
    name: 'Dashboard',
    nameAr: 'لوحة التحكم',
    icon: 'LayoutDashboard',
    type: 'dashboard',
    basePath: '/admin',
    isActive: true,
    sortOrder: 0,
    requiredFeatures: ['dashboard.view'],
    permissions: {
      SUPER_ADMIN: {
        dashboard: { read: true, actions: ['*'] }
      },
      ADMIN: {
        dashboard: { read: true, actions: ['view'] }
      },
      EDITOR: {
        dashboard: { read: true, actions: ['view'] }
      },
      ADS_MANAGER: {
        dashboard: { read: true, actions: ['view'] }
      }
    },
    config: {}
  },

  // User Management Module
  {
    key: 'user-management',
    name: 'User Management',
    nameAr: 'إدارة المستخدمين',
    icon: 'Users',
    type: 'crud',
    basePath: '/admin/users',
    isActive: true,
    sortOrder: 1,
    listQuery: 'getUsers',
    createMutation: 'createUser',
    updateMutation: 'updateUser',
    deleteMutation: 'deleteUser',
    requiredFeatures: ['users.manage'],
    permissions: {
      SUPER_ADMIN: {
        users: {
          read: true,
          create: true,
          update: true,
          delete: true,
          actions: ['*']
        }
      },
      ADMIN: {
        users: {
          read: true,
          create: true,
          update: true,
          delete: false,
          actions: ['deactivate', 'activate']
        }
      },
      EDITOR: {
        users: {
          read: true,
          create: false,
          update: ['isActive'],
          delete: false,
          actions: ['deactivate', 'ban']
        }
      }
    },
    config: {
      listColumns: [
        { key: 'name', label: 'Name', labelAr: 'الاسم', type: 'text', sortable: true },
        { key: 'email', label: 'Email', labelAr: 'البريد الإلكتروني', type: 'email', sortable: true },
        { key: 'role', label: 'Role', labelAr: 'الدور', type: 'enum', sortable: true },
        { key: 'isActive', label: 'Status', labelAr: 'الحالة', type: 'boolean', sortable: true },
        { key: 'createdAt', label: 'Created', labelAr: 'تاريخ الإنشاء', type: 'date', sortable: true }
      ],
      formFields: [
        { key: 'name', label: 'Full Name', labelAr: 'الاسم الكامل', type: 'text', required: true },
        { key: 'email', label: 'Email', labelAr: 'البريد الإلكتروني', type: 'email', required: true },
        { key: 'role', label: 'Role', labelAr: 'الدور', type: 'select', options: 'USER_ROLES', required: true },
        { key: 'isActive', label: 'Active', labelAr: 'نشط', type: 'boolean', default: true }
      ],
      filters: [
        { key: 'role', label: 'Role', labelAr: 'الدور', type: 'select', options: 'USER_ROLES' },
        { key: 'isActive', label: 'Status', labelAr: 'الحالة', type: 'boolean' }
      ],
      customActions: [
        { key: 'ban', label: 'Ban User', labelAr: 'حظر المستخدم', icon: 'Ban', variant: 'danger' },
        { key: 'deactivate', label: 'Deactivate', labelAr: 'إلغاء التنشيط', icon: 'UserX', variant: 'warning' }
      ]
    }
  },

  // Listing Management Module
  {
    key: 'listing-management',
    name: 'Listing Management',
    nameAr: 'إدارة الإعلانات',
    icon: 'FileText',
    type: 'crud',
    basePath: '/admin/listings',
    isActive: true,
    sortOrder: 2,
    listQuery: 'getListings',
    updateMutation: 'updateListing',
    deleteMutation: 'deleteListing',
    requiredFeatures: ['listings.manage'],
    permissions: {
      SUPER_ADMIN: {
        listings: {
          read: true,
          create: false,
          update: true,
          delete: true,
          actions: ['*']
        }
      },
      ADMIN: {
        listings: {
          read: true,
          create: false,
          update: true,
          delete: true,
          actions: ['approve', 'reject', 'feature', 'unfeature']
        }
      },
      EDITOR: {
        listings: {
          read: true,
          create: false,
          update: ['status', 'isFeatured'],
          delete: false,
          actions: ['approve', 'reject', 'feature', 'unfeature']
        }
      }
    },
    config: {
      listColumns: [
        { key: 'title', label: 'Title', labelAr: 'العنوان', type: 'text', searchable: true },
        { key: 'user.name', label: 'Seller', labelAr: 'البائع', type: 'relation' },
        { key: 'status', label: 'Status', labelAr: 'الحالة', type: 'enum' },
        { key: 'priceMinor', label: 'Price', labelAr: 'السعر', type: 'currency' },
        { key: 'createdAt', label: 'Created', labelAr: 'تاريخ الإنشاء', type: 'date' }
      ],
      bulkActions: [
        { key: 'approve', label: 'Approve Selected', labelAr: 'موافقة المحدد', icon: 'Check', variant: 'success' },
        { key: 'reject', label: 'Reject Selected', labelAr: 'رفض المحدد', icon: 'X', variant: 'danger' }
      ]
    }
  },

  // Role Management Module
  {
    key: 'role-management',
    name: 'Role & Permission Management',
    nameAr: 'إدارة الأدوار والصلاحيات',
    icon: 'Shield',
    type: 'workflow',
    basePath: '/admin/roles',
    customComponent: 'RoleManagement',
    isActive: true,
    sortOrder: 3,
    requiredFeatures: ['roles.manage'],
    permissions: {
      SUPER_ADMIN: {
        roles: {
          read: true,
          create: true,
          update: true,
          delete: true,
          actions: ['*']
        }
      },
      ADMIN: {
        roles: {
          read: true,
          create: false,
          update: false,
          delete: false,
          actions: ['view']
        }
      }
    },
    config: {}
  },

  // Campaign Management Module
  {
    key: 'campaign-management',
    name: 'Campaign Management',
    nameAr: 'إدارة الحملات الإعلانية',
    icon: 'Package',
    type: 'workflow',
    basePath: '/admin/campaigns',
    customComponent: 'CampaignManagement',
    isActive: true,
    sortOrder: 4,
    requiredFeatures: ['campaigns.manage'],
    permissions: {
      SUPER_ADMIN: {
        campaigns: {
          read: true,
          create: true,
          update: true,
          delete: true,
          actions: ['*']
        },
        clients: {
          read: true,
          create: true,
          update: true,
          delete: false
        },
        packages: {
          read: true,
          create: true,
          update: true,
          delete: false
        }
      },
      ADS_MANAGER: {
        campaigns: {
          read: true,
          create: true,
          update: true,
          delete: false,
          actions: ['activate', 'pause', 'clone']
        },
        clients: {
          read: true,
          create: true,
          update: true,
          delete: false
        },
        packages: {
          read: true,
          create: false,
          update: false,
          delete: false
        }
      }
    },
    config: {}
  },

  // Category Management Module
  {
    key: 'category-management',
    name: 'Category Management',
    nameAr: 'إدارة الفئات',
    icon: 'FolderTree',
    type: 'crud',
    basePath: '/admin/categories',
    isActive: true,
    sortOrder: 5,
    listQuery: 'getCategories',
    createMutation: 'createCategory',
    updateMutation: 'updateCategory',
    deleteMutation: 'deleteCategory',
    requiredFeatures: ['categories.manage'],
    permissions: {
      SUPER_ADMIN: {
        categories: {
          read: true,
          create: true,
          update: true,
          delete: true,
          actions: ['*']
        }
      },
      ADMIN: {
        categories: {
          read: true,
          create: true,
          update: true,
          delete: false,
          actions: ['activate', 'deactivate']
        }
      }
    },
    config: {
      listColumns: [
        { key: 'name', label: 'Name', labelAr: 'الاسم', type: 'text', sortable: true },
        { key: 'slug', label: 'Slug', labelAr: 'المعرف', type: 'text', sortable: true },
        { key: 'isActive', label: 'Status', labelAr: 'الحالة', type: 'boolean', sortable: true },
        { key: 'listingCount', label: 'Listings', labelAr: 'الإعلانات', type: 'number', sortable: true }
      ],
      formFields: [
        { key: 'name', label: 'Name', labelAr: 'الاسم', type: 'text', required: true },
        { key: 'nameAr', label: 'Arabic Name', labelAr: 'الاسم بالعربية', type: 'text', required: true },
        { key: 'slug', label: 'Slug', labelAr: 'المعرف', type: 'text', required: true },
        { key: 'isActive', label: 'Active', labelAr: 'نشط', type: 'boolean', default: true }
      ]
    }
  },

  // Analytics Module
  {
    key: 'analytics',
    name: 'Analytics & Reports',
    nameAr: 'التحليلات والتقارير',
    icon: 'BarChart3',
    type: 'dashboard',
    basePath: '/admin/analytics',
    isActive: true,
    sortOrder: 6,
    requiredFeatures: ['analytics.view'],
    permissions: {
      SUPER_ADMIN: {
        analytics: {
          read: true,
          actions: ['export', 'custom_reports']
        }
      },
      ADMIN: {
        analytics: {
          read: true,
          actions: ['export']
        }
      },
      EDITOR: {
        analytics: {
          read: true,
          actions: ['basic']
        }
      },
      ADS_MANAGER: {
        analytics: {
          read: true,
          actions: ['ads_analytics']
        }
      }
    },
    config: {}
  },

  // Audit Logs Module
  {
    key: 'audit-logs',
    name: 'Audit Logs',
    nameAr: 'سجلات المراجعة',
    icon: 'Search',
    type: 'crud',
    basePath: '/admin/audit',
    isActive: true,
    sortOrder: 7,
    listQuery: 'getAuditLogs',
    requiredFeatures: ['audit.read'],
    permissions: {
      SUPER_ADMIN: {
        audit: {
          read: true,
          actions: ['*']
        }
      },
      ADMIN: {
        audit: {
          read: true,
          actions: ['view']
        }
      }
    },
    config: {
      listColumns: [
        { key: 'action', label: 'Action', labelAr: 'الإجراء', type: 'text', sortable: true },
        { key: 'entity', label: 'Entity', labelAr: 'الكيان', type: 'text', sortable: true },
        { key: 'user.name', label: 'User', labelAr: 'المستخدم', type: 'relation', sortable: true },
        { key: 'timestamp', label: 'Timestamp', labelAr: 'الوقت', type: 'date', sortable: true }
      ],
      filters: [
        { key: 'action', label: 'Action', labelAr: 'الإجراء', type: 'text' },
        { key: 'entity', label: 'Entity', labelAr: 'الكيان', type: 'text' },
        { key: 'userId', label: 'User', labelAr: 'المستخدم', type: 'select', options: 'USERS' }
      ]
    }
  }
];

// Helper function to get modules for a specific user role
export function getModulesForRole(userRole: string, userPermissions: string[]): AdminModule[] {
  return ADMIN_MODULES_CONFIG.filter(module => {
    // Check if module is active
    if (!module.isActive) return false;

    // Check if user has all required features
    return module.requiredFeatures.every(feature =>
      userPermissions.includes(feature) || userPermissions.includes('*')
    );
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}

// Helper function to get a specific module by key
export function getModuleByKey(key: string): AdminModule | undefined {
  return ADMIN_MODULES_CONFIG.find(module => module.key === key && module.isActive);
}

// Helper function to check if user can access a module
export function canUserAccessModule(moduleKey: string, userPermissions: string[]): boolean {
  const module = getModuleByKey(moduleKey);
  if (!module) return false;

  return module.requiredFeatures.every(feature =>
    userPermissions.includes(feature) || userPermissions.includes('*')
  );
}