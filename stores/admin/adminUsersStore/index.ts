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
  GET_ROLES_QUERY,
  GET_USER_BY_ID_QUERY,
} from "./adminUsersStore.gql";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string; // "pending" | "active" | "banned"
  accountType: string;
  accountBadge: string | null;
  businessVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  priority: number;
  isActive: boolean;
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
  accountBadge?: string;
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
  type?:
    | "text"
    | "email"
    | "date"
    | "boolean"
    | "badge"
    | "currency"
    | "number";
  width?: string;
  sortable?: boolean;
}

export interface TableAction {
  key: string;
  label: string;
  variant?: "primary" | "secondary" | "danger" | "warning" | "success";
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
  roles: Role[];
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

  // Caching
  lastFetched: number | null;
  cacheTimeout: number; // in milliseconds

  // CRUD operations
  loadUsers: (page?: number) => Promise<void>;
  loadUsersPaginated: (
    pagination?: PaginationInput,
    filter?: UserFilterInput
  ) => Promise<void>;
  getUserById: (id: string) => Promise<User | null>;
  loadRoles: () => Promise<void>;
  createUser: (input: CreateUserInput) => Promise<User | null>;
  updateUser: (input: UpdateUserInput) => Promise<User | null>;
  deleteUser: (id: string) => Promise<boolean>;
  resetUserPassword: (id: string) => Promise<boolean>;

  // UI state
  setSelectedUser: (user: User | null) => void;
  setFilters: (filters: UserFilterInput) => void;
  setSorting: (sortBy: string, sortOrder: "ASC" | "DESC") => void;
  clearError: () => void;

  // Cache management
  isCacheValid: () => boolean;
  loadUsersWithCache: (page?: number, forceRefresh?: boolean) => Promise<void>;
  invalidateCache: () => void;
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
  roles: [],
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

  // Cache state
  lastFetched: null,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes

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

      const users = usersData.usersSearch || [];

      set({
        users,
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
        lastFetched: Date.now(), // Cache timestamp
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load users",
        loading: false,
      });
    }
  },

  loadRoles: async () => {
    try {
      const data = await makeGraphQLCall(GET_ROLES_QUERY);
      set({ roles: data.getAllCustomRoles || [] });
    } catch (error) {
      // Silently fail if user doesn't have permissions to load roles
      set({ roles: [] });
    }
  },

  getUserById: async (id: string) => {
    try {
      const data = await makeGraphQLCall(GET_USER_BY_ID_QUERY, { id });
      return data.userById || null;
    } catch (error) {
      console.error("Failed to fetch user by ID:", error);
      return null;
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
        lastFetched: Date.now(), // Update cache timestamp since we added data
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
      const updatedUser = data.updateUser;

      set((state) => ({
        users: state.users.map((user) =>
          user.id === updatedUser.id ? updatedUser : user
        ),
        selectedUser:
          state.selectedUser?.id === updatedUser.id
            ? updatedUser
            : state.selectedUser,
        loading: false,
        lastFetched: Date.now(), // Update cache timestamp since we modified data
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
        lastFetched: Date.now(), // Update cache timestamp since we modified data
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

  resetUserPassword: async (id: string) => {
    set({ loading: true, error: null });

    try {
      await makeGraphQLCall(RESET_PASSWORD_MUTATION, { userId: id });
      set({ loading: false });
      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to send reset email",
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

  // Cache management methods
  isCacheValid: () => {
    const { lastFetched, cacheTimeout } = get();
    if (!lastFetched) return false;
    return Date.now() - lastFetched < cacheTimeout;
  },

  invalidateCache: () => {
    set({ lastFetched: null });
  },

  loadUsersWithCache: async (page = 1, forceRefresh = false) => {
    const state = get();

    // If cache is valid and not forcing refresh, return early
    if (!forceRefresh && state.isCacheValid() && state.users.length > 0) {
      console.log("🚀 Admin users loaded from cache - no API call needed");
      return;
    }

    console.log("🔄 Admin users cache invalid - fetching fresh data");
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
}));
