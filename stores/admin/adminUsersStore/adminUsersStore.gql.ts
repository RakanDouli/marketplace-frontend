// GraphQL queries and mutations for admin users management

export const GET_USERS_QUERY = `
  query GetUsers {
    getUsers {
      id
      email
      name
      role
      status
      accountType
      sellerBadge
      businessVerified
      createdAt
      updatedAt
    }
  }
`;

export const USERS_SEARCH_QUERY = `
  query UsersSearch($search: String, $role: String, $status: String, $sortBy: String, $sortOrder: String, $limit: Int, $offset: Int) {
    usersSearch(search: $search, role: $role, status: $status, sortBy: $sortBy, sortOrder: $sortOrder, limit: $limit, offset: $offset) {
      id
      email
      name
      role
      status
      accountType
      sellerBadge
      businessVerified
      createdAt
      updatedAt
    }
  }
`;

export const USERS_COUNT_QUERY = `
  query UsersCount($search: String, $role: String, $status: String) {
    usersCount(search: $search, role: $role, status: $status)
  }
`;

export const CREATE_USER_MUTATION = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      name
      role
      status
      accountType
      sellerBadge
      businessVerified
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_USER_MUTATION = `
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      email
      name
      role
      status
      accountType
      sellerBadge
      businessVerified
      updatedAt
    }
  }
`;

export const DELETE_USER_MUTATION = `
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

export const RESET_PASSWORD_MUTATION = `
  mutation ResetUserPassword($userId: ID!) {
    resetUserPassword(userId: $userId)
  }
`;

export const GET_ROLES_QUERY = `
  query GetRoles {
    getAllCustomRoles {
      id
      name
      description
      priority
      isActive
    }
  }
`;

export const GET_USER_STATUSES_QUERY = `
  query GetUserStatuses {
    getUserStatuses
  }
`;

export const GET_USER_ROLES_QUERY = `
  query GetUserRoles {
    getUserRoles
  }
`;

export const GET_ACCOUNT_TYPES_QUERY = `
  query GetAccountTypes {
    getAccountTypes
  }
`;