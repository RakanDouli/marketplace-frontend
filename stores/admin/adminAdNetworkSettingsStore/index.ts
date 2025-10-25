import { create } from 'zustand';
import { useAdminAuthStore } from '../adminAuthStore';
import { AD_NETWORK_SETTINGS_QUERY, UPDATE_AD_NETWORK_SETTING_MUTATION } from './adminAdNetworkSettings.gql';

export interface AdNetworkSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AdNetworkSettingsStore {
  settings: AdNetworkSetting[];
  loading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateSetting: (key: string, value: string | null, isActive: boolean) => Promise<void>;
  clearError: () => void;
}

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

export const useAdminAdNetworkSettingsStore = create<AdNetworkSettingsStore>((set, get) => ({
  settings: [],
  loading: false,
  error: null,

  loadSettings: async () => {
    set({ loading: true, error: null });
    try {
      const data = await makeGraphQLCall(AD_NETWORK_SETTINGS_QUERY);
      set({
        settings: data.adNetworkSettings || [],
        loading: false,
      });
    } catch (error: any) {
      console.error('Error loading ad network settings:', error);
      set({
        error: error.message || 'فشل تحميل إعدادات شبكة الإعلانات',
        loading: false,
      });
    }
  },

  updateSetting: async (key: string, value: string | null, isActive: boolean) => {
    set({ loading: true, error: null });
    try {
      const data = await makeGraphQLCall(UPDATE_AD_NETWORK_SETTING_MUTATION, {
        input: { key, value, isActive },
      });

      // Update the setting in the local state
      const updatedSetting = data.updateAdNetworkSetting;
      set(state => ({
        settings: state.settings.map(s =>
          s.key === key ? updatedSetting : s
        ),
        loading: false,
      }));
    } catch (error: any) {
      console.error('Error updating ad network setting:', error);
      set({
        error: error.message || 'فشل تحديث الإعداد',
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
