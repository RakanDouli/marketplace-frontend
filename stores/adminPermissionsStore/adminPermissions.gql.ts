// GraphQL queries for Admin Permissions - NO heavy caching to keep marketplace fast

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

export const GET_USER_PERMISSIONS = `
  query GetUserPermissions($userId: String!) {
    userPermissions(userId: $userId) {
      permissions
      role
      features {
        key
        canRead
        canCreate
        canUpdate
        canDelete
        allowedActions
      }
    }
  }
`;

export const CHECK_FIELD_PERMISSION = `
  query CheckFieldPermission($module: String!, $resource: String!, $field: String!, $action: String!) {
    canAccessField(module: $module, resource: $resource, field: $field, action: $action)
  }
`;

// Simple GraphQL request function - NO caching to avoid affecting marketplace performance
export const simplePermissionRequest = async (query: string, variables?: any) => {
  try {
    const response = await fetch('/api/graphql', {
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
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL permission error');
    }

    return result.data;
  } catch (error) {
    console.error('Admin permission request failed:', error);
    throw error;
  }
};