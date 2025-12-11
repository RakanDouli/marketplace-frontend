import { create } from 'zustand';
import { GET_OWNER_DATA_QUERY } from './listingOwner.gql';
import { AccountType } from '@/common/enums';

// Helper function for GraphQL API calls
const makeGraphQLCall = async (query: string, variables: any = {}) => {
  const response = await fetch("http://localhost:4000/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
};

export interface OwnerData {
  id: string;
  name: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  contactPhone: string | null;
  phoneIsWhatsApp: boolean;
  showPhone: boolean;
  showContactPhone: boolean;
  website: string | null;
  avatar: string | null;
  accountType: AccountType;
  businessVerified: boolean;
  accountBadge: 'NONE' | 'VERIFIED' | 'PREMIUM';
  companyRegistrationNumber: string | null;
  isEmailConfirmed: boolean;
  isPhoneConfirmed: boolean;
  createdAt: string;
  averageRating?: number;
  reviewCount?: number;
}

interface OwnerCache {
  [userId: string]: {
    data: OwnerData;
    timestamp: number;
  };
}

interface ListingOwnerState {
  owners: OwnerCache;
  loading: { [userId: string]: boolean };
  errors: { [userId: string]: string | null };
}

interface ListingOwnerActions {
  fetchOwnerData: (userId: string) => Promise<OwnerData | null>;
  getOwner: (userId: string) => OwnerData | null;
  clearOwner: (userId: string) => void;
}

type ListingOwnerStore = ListingOwnerState & ListingOwnerActions;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useListingOwnerStore = create<ListingOwnerStore>((set, get) => ({
  // Initial state
  owners: {},
  loading: {},
  errors: {},

  // Fetch owner data (with caching)
  fetchOwnerData: async (userId: string) => {
    // Check cache first
    const cached = get().owners[userId];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    set(state => ({
      loading: { ...state.loading, [userId]: true },
      errors: { ...state.errors, [userId]: null }
    }));

    try {
      const data = await makeGraphQLCall(GET_OWNER_DATA_QUERY, { userId });

      if (data?.userById) {
        const ownerData: OwnerData = data.userById;

        set(state => ({
          owners: {
            ...state.owners,
            [userId]: {
              data: ownerData,
              timestamp: Date.now()
            }
          },
          loading: { ...state.loading, [userId]: false },
          errors: { ...state.errors, [userId]: null }
        }));

        return ownerData;
      } else {
        set(state => ({
          loading: { ...state.loading, [userId]: false },
          errors: { ...state.errors, [userId]: 'البائع غير موجود' }
        }));
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ في تحميل بيانات البائع';
      set(state => ({
        loading: { ...state.loading, [userId]: false },
        errors: { ...state.errors, [userId]: errorMessage }
      }));
      return null;
    }
  },

  // Get cached owner data
  getOwner: (userId: string) => {
    const cached = get().owners[userId];
    return cached?.data || null;
  },

  // Clear owner data
  clearOwner: (userId: string) => {
    set(state => {
      const newOwners = { ...state.owners };
      const newErrors = { ...state.errors };
      delete newOwners[userId];
      delete newErrors[userId];
      return { owners: newOwners, errors: newErrors };
    });
  },
}));
