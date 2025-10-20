import { create } from "zustand";
import { useAdminAuthStore } from "../adminAuthStore";
import {
  GET_AUDIT_LOGS_QUERY,
  GET_AUDIT_LOGS_COUNT_QUERY,
  GET_AUDIT_LOG_QUERY,
  DELETE_AUDIT_LOG_MUTATION,
} from "./adminAuditStore.gql";

export interface AuditLog {
  id: string;
  userId: string | null;
  user?: { id: string; email: string; name: string; role: string } | null;
  action: string;
  entity: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditFilterInput {
  limit?: number;
  offset?: number;
  entity?: string;
  entityId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AdminAuditStore {
  audits: AuditLog[];
  loading: boolean;
  error: string | null;
  selectedAudit: AuditLog | null;

  filters: AuditFilterInput;
  pagination: Pagination;
  lastFetched: number | null;
  cacheTimeout: number;

  loadAudits: (filter?: AuditFilterInput, page?: number) => Promise<void>;
  loadAuditById: (id: string) => Promise<AuditLog | null>;
  deleteAudit: (id: string) => Promise<boolean>;

  setSelectedAudit: (audit: AuditLog | null) => void;
  setFilters: (filters: AuditFilterInput) => void;

  isCacheValid: () => boolean;
  invalidateCache: () => void;
}

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
  if (result.errors) throw new Error(result.errors[0].message);
  return result.data;
};

export const useAdminAuditStore = create<AdminAuditStore>((set, get) => ({
  audits: [],
  loading: false,
  error: null,
  selectedAudit: null,

  filters: { limit: 30 },
  pagination: { page: 1, limit: 30, total: 0, totalPages: 0 },
  lastFetched: null,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes

  loadAuditById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const data = await makeGraphQLCall(GET_AUDIT_LOG_QUERY, { id });
      const audit = data.auditLog;

      set({
        selectedAudit: audit,
        loading: false,
      });
      return audit;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load audit log",
        loading: false,
      });
      return null;
    }
  },

  loadAudits: async (filter = {}, page = 1) => {
    set({ loading: true, error: null });
    try {
      const { limit } = get().pagination;
      const offset = (page - 1) * limit;
      const merged = { ...get().filters, ...filter, limit, offset };

      // Fetch audits and count in parallel
      const [auditData, countData] = await Promise.all([
        makeGraphQLCall(GET_AUDIT_LOGS_QUERY, merged),
        makeGraphQLCall(GET_AUDIT_LOGS_COUNT_QUERY, {
          entity: merged.entity,
          entityId: merged.entityId,
          userId: merged.userId,
          userEmail: merged.userEmail,
          userRole: merged.userRole,
        }),
      ]);

      const total = countData.auditLogsCount;
      const totalPages = Math.ceil(total / limit);

      set({
        audits: auditData.auditLogs || [],
        filters: merged,
        pagination: { page, limit, total, totalPages },
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load audits",
        loading: false,
      });
    }
  },

  deleteAudit: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await makeGraphQLCall(DELETE_AUDIT_LOG_MUTATION, { id });
      set((state) => ({
        audits: state.audits.filter((a) => a.id !== id),
        loading: false,
      }));
      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete audit",
        loading: false,
      });
      return false;
    }
  },

  setSelectedAudit: (audit) => set({ selectedAudit: audit }),
  setFilters: (filters) => set({ filters }),

  isCacheValid: () => {
    const { lastFetched, cacheTimeout } = get();
    return lastFetched ? Date.now() - lastFetched < cacheTimeout : false;
  },

  invalidateCache: () => set({ lastFetched: null }),
}));
