import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import {
  CREATE_REVIEW_MUTATION,
  USER_REVIEWS_QUERY,
  CAN_REVIEW_USER_QUERY,
} from './reviews.gql';

const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';

// Helper function for GraphQL API calls
const makeGraphQLCall = async (query: string, variables: any = {}, token?: string) => {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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

export interface Review {
  id: string;
  reviewerId: string | null;
  reviewerName: string | null;
  reviewerAvatar: string | null;
  reviewedUserId: string;
  listingId: string | null;
  threadId: string | null;
  rating: number;
  positiveTags: string[];
  negativeTags: string[];
  createdAt: string;
}

export interface CreateReviewInput {
  reviewedUserId: string;
  listingId?: string;
  threadId?: string;
  rating: number;
  positiveTags: string[];
  negativeTags: string[];
}

interface ReviewsState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;

  // Actions
  createReview: (input: CreateReviewInput) => Promise<Review>;
  fetchUserReviews: (userId: string) => Promise<Review[]>;
  canReviewUser: (reviewedUserId: string) => Promise<boolean>;
  reset: () => void;
}

export const useReviewsStore = create<ReviewsState>((set, get) => ({
  reviews: [],
  isLoading: false,
  error: null,

  /**
   * Create a new review
   */
  createReview: async (input: CreateReviewInput): Promise<Review> => {
    set({ isLoading: true, error: null });

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('يجب تسجيل الدخول لكتابة تقييم');
      }

      const data = await makeGraphQLCall(
        CREATE_REVIEW_MUTATION,
        { input },
        session.access_token
      );

      const newReview = data.createReview;

      set({ isLoading: false });
      return newReview;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في إنشاء التقييم';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Fetch all reviews for a specific user
   */
  fetchUserReviews: async (userId: string): Promise<Review[]> => {
    set({ isLoading: true, error: null });

    try {
      const data = await makeGraphQLCall(
        USER_REVIEWS_QUERY,
        { userId }
        // No token needed - public query
      );

      const reviews = data.userReviews || [];

      set({ reviews, isLoading: false });
      return reviews;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في جلب التقييمات';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  /**
   * Check if current user can review another user
   */
  canReviewUser: async (reviewedUserId: string): Promise<boolean> => {
    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return false; // Must be logged in
      }

      const data = await makeGraphQLCall(
        CAN_REVIEW_USER_QUERY,
        { reviewedUserId },
        session.access_token
      );

      return data.canReviewUser || false;
    } catch (error) {
      console.error('Error checking review permission:', error);
      return false;
    }
  },

  /**
   * Reset store state
   */
  reset: () => {
    set({
      reviews: [],
      isLoading: false,
      error: null,
    });
  },
}));
