/**
 * Admin Authentication GraphQL queries and mutations
 */

// Admin login mutation
export const ADMIN_LOGIN = `
  mutation AdminLogin($email: String!, $password: String!) {
    adminLogin(email: $email, password: $password) {
      user {
        id
        name
        email
        role
        permissions
      }
      accessToken
      refreshToken
    }
  }
`;

// Admin logout mutation
export const ADMIN_LOGOUT = `
  mutation AdminLogout {
    adminLogout {
      success
    }
  }
`;

// Get current admin user
export const GET_CURRENT_ADMIN_USER = `
  query GetCurrentAdminUser {
    currentAdminUser {
      id
      name
      email
      role
      permissions
      lastLoginAt
    }
  }
`;

// Refresh admin token
export const REFRESH_ADMIN_TOKEN = `
  mutation RefreshAdminToken($refreshToken: String!) {
    refreshAdminToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;