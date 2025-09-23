// GraphQL queries for admin authentication and permissions

// ✅ USED: Main authentication query - optimized single call
export const ME_QUERY = `
  query Me {
    me {
      user {
        id
        email
        name
        role
        roleEntity {
          id
          name
          featurePermissions
        }
      }
      tokenExpiresAt
    }
  }
`;

// 🔮 FUTURE: Role management interface (not used in auth store anymore)
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

// 🔮 FUTURE: Role management interface (not used in auth store anymore)
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