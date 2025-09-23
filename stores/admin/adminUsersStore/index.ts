import { create } from "zustand";
import { useAdminAuthStore } from "../adminAuthStore";
import {
  GET_USERS_QUERY,
  USERS_SEARCH_QUERY,
  USERS_COUNT_QUERY,
  CREATE_USER_MUTATION,
  UPDATE_USER_MUTATION,
  DELETE_USER_MUTATION,
  RESET_PASSWORD_MUTATION,
} from "./adminUsersStore.gql";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string; // "pending" | "active" | "banned"
  accountType: string;
  sellerBadge: string | null;
  businessVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: string;
  accountType?: string;
  isActive?: boolean;
}

interface UpdateUserInput {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  accountType?: string;
  isActive?: boolean;
  sellerBadge?: string;
}

interface PaginationInput {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

interface UserFilterInput {
  search?: string;
  role?: string;
  status?: string;
  accountType?: string;
}

interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'date' | 'boolean' | 'badge' | 'currency' | 'number';
  width?: string;
  sortable?: boolean;
}

export interface TableAction {
  key: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface TableConfig {
  columns: TableColumn[];
  actions: TableAction[];
}

interface AdminUsersStore {
  // Data
  users: User[];
  loading: boolean;
  error: string | null;
  selectedUser: User | null;

  // Table Configuration from Backend
  tableConfig: TableConfig | null;

  // Pagination
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  // Filters
  filters: UserFilterInput;
  sortBy: string;
  sortOrder: "ASC" | "DESC";

  // CRUD operations
  loadUsers: (page?: number) => Promise<void>;
  loadUsersPaginated: (
    pagination?: PaginationInput,
    filter?: UserFilterInput
  ) => Promise<void>;
  createUser: (input: CreateUserInput) => Promise<User | null>;
  updateUser: (input: UpdateUserInput) => Promise<User | null>;
  deleteUser: (id: string) => Promise<boolean>;
  resetUserPassword: (id: string, newPassword: string) => Promise<boolean>;

  // UI state
  setSelectedUser: (user: User | null) => void;
  setFilters: (filters: UserFilterInput) => void;
  setSorting: (sortBy: string, sortOrder: "ASC" | "DESC") => void;
  clearError: () => void;
}

// GraphQL queries imported from separate file

// Helper function for API calls
const makeGraphQLCall = async (query: string, variables: any = {}) => {
  const { user } = useAdminAuthStore.getState();
  const token = user?.token;

  const response = await fetch("http://localhost:4000/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
};

export const useAdminUsersStore = create<AdminUsersStore>((set, get) => ({
  users: [],
  loading: false,
  error: null,
  selectedUser: null,

  // Table Configuration from Backend
  tableConfig: null,

  // Pagination state
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },

  // Filter state
  filters: {},
  sortBy: "createdAt",
  sortOrder: "DESC",

  loadUsers: async (page = 1) => {
    const state = get();
    await state.loadUsersPaginated(
      {
        page,
        limit: state.pagination.limit,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      },
      state.filters
    );
  },

  loadUsersPaginated: async (pagination = {}, filter = {}) => {
    set({ loading: true, error: null });

    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const offset = (page - 1) * limit;

      // Get users and count in parallel (original working approach)
      const [usersData, countData] = await Promise.all([
        makeGraphQLCall(USERS_SEARCH_QUERY, {
          search: filter.search,
          role: filter.role,
          status: filter.status,
          sortBy: pagination.sortBy || "createdAt",
          sortOrder: pagination.sortOrder || "DESC",
          limit,
          offset,
        }),
        makeGraphQLCall(USERS_COUNT_QUERY, {
          search: filter.search,
          role: filter.role,
          status: filter.status,
        }),
      ]);

      const total = countData.usersCount || 0;
      const totalPages = Math.ceil(total / limit);

      set({
        users: usersData.usersSearch || [],
        tableConfig: null, // Let the component auto-generate columns from data
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load users",
        loading: false,
      });
    }
  },

  createUser: async (input: CreateUserInput) => {
    set({ loading: true, error: null });

    try {
      const data = await makeGraphQLCall(CREATE_USER_MUTATION, { input });
      const newUser = data.createUser;

      set((state) => ({
        users: [...state.users, newUser],
        loading: false,
      }));

      return newUser;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create user",
        loading: false,
      });
      return null;
    }
  },

  updateUser: async (input: UpdateUserInput) => {
    set({ loading: true, error: null });

    try {
      const { id, ...updateData } = input;
      const data = await makeGraphQLCall(UPDATE_USER_MUTATION, {
        id,
        input: updateData,
      });
      const updatedUser = data.adminUpdateUser;

      set((state) => ({
        users: state.users.map((user) =>
          user.id === updatedUser.id ? updatedUser : user
        ),
        selectedUser:
          state.selectedUser?.id === updatedUser.id
            ? updatedUser
            : state.selectedUser,
        loading: false,
      }));

      return updatedUser;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update user",
        loading: false,
      });
      return null;
    }
  },

  deleteUser: async (id: string) => {
    set({ loading: true, error: null });

    try {
      await makeGraphQLCall(DELETE_USER_MUTATION, { id });

      set((state) => ({
        users: state.users.filter((user) => user.id !== id),
        selectedUser: state.selectedUser?.id === id ? null : state.selectedUser,
        loading: false,
      }));

      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to delete user",
        loading: false,
      });
      return false;
    }
  },

  resetUserPassword: async (id: string, newPassword: string) => {
    set({ loading: true, error: null });

    try {
      await makeGraphQLCall(RESET_PASSWORD_MUTATION, { userId: id });
      set({ loading: false });
      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to reset password",
        loading: false,
      });
      return false;
    }
  },

  setSelectedUser: (user: User | null) => set({ selectedUser: user }),
  setFilters: (filters: UserFilterInput) => set({ filters }),
  setSorting: (sortBy: string, sortOrder: "ASC" | "DESC") =>
    set({ sortBy, sortOrder }),
  clearError: () => set({ error: null }),
}));
