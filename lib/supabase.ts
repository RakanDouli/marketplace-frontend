import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null;

const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
};

// Export the singleton instance
export const supabase = getSupabaseClient();

// Server client for SSR (no auth persistence needed)
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Database types for better TypeScript support
export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          nameAr: string | null;
          slug: string;
          description: string | null;
          descriptionAr: string | null;
          imageUrl: string | null;
          parentId: string | null;
          level: number;
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        };
      };
      listings: {
        Row: {
          id: string;
          userId: string;
          categoryId: string;
          brandId: string | null;
          modelId: string | null;
          title: string;
          description: string;
          priceMinor: number;
          currency: string;
          province: string;
          city: string;
          area: string | null;
          locationLink: string | null;
          lat: number | null;
          lng: number | null;
          status: string;
          imageKeys: string[];
          specs: any;
          createdAt: string;
          updatedAt: string;
        };
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          categoryId: string;
          imageUrl: string | null;
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        };
      };
      models: {
        Row: {
          id: string;
          name: string;
          slug: string;
          brandId: string;
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        };
      };
    };
  };
};

// Type-safe client
export type SupabaseClient = typeof supabase;