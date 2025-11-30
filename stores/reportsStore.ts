import { create } from 'zustand';
import { cachedGraphQLRequest } from '@/utils/graphql-cache';

// GraphQL Mutations
const CREATE_REPORT_MUTATION = `
  mutation CreateReport(
    $reportedUserId: ID!
    $entityType: String!
    $entityId: ID
    $reason: String!
    $details: String
  ) {
    createReport(
      reportedUserId: $reportedUserId
      entityType: $entityType
      entityId: $entityId
      reason: $reason
      details: $details
    ) {
      id
      status
    }
  }
`;

interface ReportFormData {
  reportedUserId: string;
  entityType: 'thread' | 'user' | 'listing';
  entityId?: string;
  reason: string;
  details?: string;
}

interface ReportsStore {
  isLoading: boolean;
  error: string | null;
  createReport: (data: ReportFormData) => Promise<void>;
}

export const useReportsStore = create<ReportsStore>((set) => ({
  isLoading: false,
  error: null,

  createReport: async (data: ReportFormData) => {
    set({ isLoading: true, error: null });

    try {
      await cachedGraphQLRequest(
        CREATE_REPORT_MUTATION,
        {
          reportedUserId: data.reportedUserId,
          entityType: data.entityType,
          entityId: data.entityId || null,
          reason: data.reason,
          details: data.details || null,
        },
        { ttl: 0 } // Don't cache reports
      );

      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إرسال البلاغ';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },
}));
