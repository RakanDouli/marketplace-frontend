import { create } from 'zustand';
import {
  UPDATE_ME_MUTATION,
  DELETE_MY_ACCOUNT_MUTATION,
  DEACTIVATE_MY_ACCOUNT_MUTATION,
  CHANGE_MY_PASSWORD_MUTATION,
  REQUEST_PASSWORD_RESET_MUTATION,
  CHANGE_EMAIL_MUTATION,
  CREATE_AVATAR_UPLOAD_URL_MUTATION,
  DELETE_AVATAR_MUTATION
} from './userProfile.gql';
import { uploadToCloudflare } from '@/utils/cloudflare-upload';

// Helper function for GraphQL API calls
const makeGraphQLCall = async (query: string, variables: any = {}, token?: string) => {
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

interface UserProfileState {
  loading: boolean;
  error: string | null;
}

interface UserProfileActions {
  updateProfile: (token: string, data: any) => Promise<any>;
  deleteAccount: (token: string) => Promise<boolean>;
  deactivateAccount: (token: string) => Promise<boolean>;
  sendPasswordResetEmail: (token: string, email: string) => Promise<boolean>;
  changeEmail: (token: string, newEmail: string) => Promise<boolean>;
  uploadAvatar: (token: string, file: File) => Promise<string>;
  deleteAvatar: (token: string) => Promise<boolean>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type UserProfileStore = UserProfileState & UserProfileActions;

export const useUserProfileStore = create<UserProfileStore>((set) => ({
  // Initial state
  loading: false,
  error: null,

  // Update user profile
  updateProfile: async (token: string, data: any) => {
    set({ loading: true, error: null });

    try {
      const result = await makeGraphQLCall(
        UPDATE_ME_MUTATION,
        { input: data },
        token
      );

      set({ loading: false });
      return result.updateMe;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث البيانات';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Delete account permanently
  deleteAccount: async (token: string) => {
    set({ loading: true, error: null });

    try {
      await makeGraphQLCall(DELETE_MY_ACCOUNT_MUTATION, {}, token);
      set({ loading: false });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء حذف الحساب';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Deactivate account (set status to inactive - user self-deactivation)
  deactivateAccount: async (token: string) => {
    set({ loading: true, error: null });

    try {
      await makeGraphQLCall(
        DEACTIVATE_MY_ACCOUNT_MUTATION,
        { input: { status: 'INACTIVE' } },
        token
      );
      set({ loading: false });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تعطيل الحساب';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Send password reset email (public mutation, no auth required)
  sendPasswordResetEmail: async (token: string, email: string) => {
    set({ loading: true, error: null });

    try {
      await makeGraphQLCall(
        REQUEST_PASSWORD_RESET_MUTATION,
        {
          input: {
            email,
            redirectTo: window.location.origin + '/reset-password'
          }
        }
        // No token needed - this is a public mutation
      );
      set({ loading: false });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إرسال رابط إعادة التعيين';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Change email
  changeEmail: async (token: string, newEmail: string) => {
    set({ loading: true, error: null });

    try {
      // TODO: Add mutation to change email with password verification
      // For now, throw an error to indicate not implemented
      throw new Error('Email change feature not yet implemented');
      // await makeGraphQLCall(CHANGE_EMAIL_MUTATION, { input: { email: newEmail } }, token);
      set({ loading: false });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تغيير البريد الإلكتروني';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Upload avatar image (using unified utility)
  uploadAvatar: async (token: string, file: File) => {
    set({ loading: true, error: null });

    try {
      // Step 1: Upload to Cloudflare using unified utility
      const realImageId = await uploadToCloudflare(file, 'avatar');

      // Step 2: Save REAL Cloudflare ID to database
      await makeGraphQLCall(
        UPDATE_ME_MUTATION,
        { input: { avatar: realImageId } },
        token
      );

      set({ loading: false });
      return realImageId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء رفع الصورة';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Delete avatar
  deleteAvatar: async (token: string) => {
    set({ loading: true, error: null });

    try {
      // Step 1: Delete from Cloudflare
      await makeGraphQLCall(DELETE_AVATAR_MUTATION, {}, token);

      // Step 2: Update user avatar to null
      await makeGraphQLCall(
        UPDATE_ME_MUTATION,
        { input: { avatar: null } },
        token
      );

      set({ loading: false });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء حذف الصورة';
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  // Utility actions
  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error, loading: false });
  },

  clearError: () => {
    set({ error: null });
  },
}));
