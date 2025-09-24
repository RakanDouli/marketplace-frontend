// GraphQL queries for admin role management

// Get all custom roles
export const GET_ALL_ROLES_QUERY = `
  query GetAllRoles {
    getAllCustomRoles {
      id
      name
      description
      priority
      isActive
    }
  }
`;

// Get all features for permission assignment
export const GET_ALL_FEATURES_QUERY = `
  query GetAllFeatures {
    getAllFeatures {
      id
      name
      description
      displayName
      icon
      defaultPermissions
      isActive
    }
  }
`;

// Get role with detailed permissions
export const GET_ROLE_WITH_PERMISSIONS_QUERY = `
  query GetRoleWithPermissions($roleId: String!) {
    getRoleWithPermissions(roleId: $roleId) {
      id
      name
      description
      priority
      isActive
      featurePermissions
    }
  }
`;

// Create new custom role
export const CREATE_ROLE_MUTATION = `
  mutation CreateCustomRole($input: DynamicCreateRoleInput!) {
    createCustomRole(input: $input) {
      id
      name
      description
      priority
      isActive
    }
  }
`;

// Update role permissions
export const UPDATE_ROLE_PERMISSIONS_MUTATION = `
  mutation UpdateRolePermissions($roleId: String!, $featurePermissions: String!) {
    updateRolePermissions(roleId: $roleId, featurePermissions: $featurePermissions)
  }
`;

// Delete custom role
export const DELETE_ROLE_MUTATION = `
  mutation DeleteCustomRole($roleId: String!) {
    deleteCustomRole(roleId: $roleId)
  }
`;

// Assign role to user
export const ASSIGN_ROLE_TO_USER_MUTATION = `
  mutation AssignRoleToUser($userId: String!, $roleId: String!) {
    assignRoleToUser(userId: $userId, roleId: $roleId)
  }
`;

// Test queries for role permissions (these are the demo queries from the backend)
export const TEST_USER_PERMISSIONS_QUERY = `
  query TestUserPermissions {
    testUserPermissions
  }
`;

export const TEST_LISTINGS_MANAGEMENT_QUERY = `
  query TestListingsManagement {
    testListingsManagement
  }
`;

export const TEST_PACKAGE_CREATION_QUERY = `
  query TestPackageCreation {
    testPackageCreation
  }
`;

export const WHO_AM_I_QUERY = `
  query WhoAmI {
    whoAmI
  }
`;