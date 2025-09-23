// GraphQL queries and mutations for admin users management

export const GET_USERS_QUERY = `
  query GetUsers {
    getAllUsersPublic {
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
  mutation AdminUpdateUser($id: ID!, $input: UpdateUserInput!) {
    adminUpdateUser(id: $id, input: $input) {
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
  mutation AdminResetUserPassword($userId: ID!) {
    adminResetUserPassword(userId: $userId)
  }
`;