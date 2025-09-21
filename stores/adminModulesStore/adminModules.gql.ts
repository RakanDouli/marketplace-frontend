// GraphQL queries for Admin Modules - NO heavy caching to keep marketplace fast

// Test query to check if backend has admin_modules table
export const GET_ADMIN_MODULES = `
  query GetAdminModules {
    adminModules {
      id
      key
      name
      nameAr
      icon
      type
      basePath
      isActive
      sortOrder
      customComponent
      requiredFeatures
      config
      createdAt
      updatedAt
    }
  }
`;

// Fallback query to test basic connection
export const TEST_CONNECTION = `
  query TestConnection {
    __schema {
      queryType {
        name
      }
    }
  }
`;

export const GET_MODULE_PERMISSIONS = `
  query GetModulePermissions($moduleKey: String!) {
    modulePermissions(moduleKey: $moduleKey) {
      moduleKey
      role
      resource
      canRead
      canCreate
      canUpdate
      canDelete
      readableFields
      editableFields
      allowedActions
    }
  }
`;

export const CHECK_MODULE_PERMISSION = `
  query CheckModulePermission($module: String!, $resource: String!, $action: String!, $field: String) {
    canPerformAction(module: $module, resource: $resource, action: $action, field: $field)
  }
`;

// Simple GraphQL request function - NO caching to avoid affecting marketplace performance
export const simpleGraphQLRequest = async (query: string, variables?: any) => {
  try {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add auth header when backend is ready
        // 'Authorization': \`Bearer \${token}\`
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error');
    }

    return result.data;
  } catch (error) {
    console.error('Admin GraphQL request failed:', error);
    throw error;
  }
};