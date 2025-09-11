import { supabaseServer } from '../supabase';

// Types for listings (matching backend structure)
export interface ListingSSR {
  id: string;
  title: string;
  description: string;
  priceMinor: number; // Price in cents
  currency: string;
  province: string;
  city: string;
  area: string | null;
  status: string;
  imageKeys: string[];
  specs: any; // JSON specs object
  createdAt: string;
  categoryId: string;
  userId: string;
  brandId: string | null;
  modelId: string | null;
}

export interface ListingFilters {
  categoryId?: string;
  brandId?: string;
  modelId?: string;
  minPrice?: number;
  maxPrice?: number;
  province?: string;
  city?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Fast SSR listings fetch for Syrian internet
export async function getListings(filters: ListingFilters = {}): Promise<{
  listings: ListingSSR[];
  total: number;
}> {
  try {
    const {
      categoryId,
      brandId,
      modelId,
      minPrice,
      maxPrice,
      province,
      city,
      search,
      limit = 20,
      offset = 0,
    } = filters;

    let query = supabaseServer
      .from('listings')
      .select(`
        id,
        title,
        description,
        priceMinor,
        currency,
        province,
        city,
        area,
        status,
        imageKeys,
        specs,
        createdAt,
        categoryId,
        userId,
        brandId,
        modelId
      `, { count: 'exact' })
      .eq('status', 'active')
      .order('createdAt', { ascending: false });

    // Apply filters
    if (categoryId) {
      query = query.eq('categoryId', categoryId);
    }
    if (brandId) {
      query = query.eq('brandId', brandId);
    }
    if (modelId) {
      query = query.eq('modelId', modelId);
    }
    if (province) {
      query = query.eq('province', province);
    }
    if (city) {
      query = query.eq('city', city);
    }
    if (minPrice) {
      query = query.gte('priceMinor', minPrice * 100); // Convert to cents
    }
    if (maxPrice) {
      query = query.lte('priceMinor', maxPrice * 100); // Convert to cents
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
      return { listings: [], total: 0 };
    }

    return {
      listings: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error('Failed to fetch listings:', error);
    return { listings: [], total: 0 };
  }
}

// Get listings for a specific category (for SSR pages)
export async function getListingsByCategory(
  categorySlug: string,
  filters: Omit<ListingFilters, 'categoryId'> = {}
): Promise<{ listings: ListingSSR[]; total: number; categoryId: string | null }> {
  try {
    // First get the category ID from slug
    const { data: category } = await supabaseServer
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .eq('isActive', true)
      .single();

    if (!category) {
      return { listings: [], total: 0, categoryId: null };
    }

    const result = await getListings({
      ...filters,
      categoryId: category.id,
    });

    return {
      ...result,
      categoryId: category.id,
    };
  } catch (error) {
    console.error('Failed to fetch listings by category:', error);
    return { listings: [], total: 0, categoryId: null };
  }
}

// Get single listing by ID for SSR
export async function getListingById(id: string): Promise<ListingSSR | null> {
  try {
    const { data, error } = await supabaseServer
      .from('listings')
      .select(`
        id,
        title,
        description,
        priceMinor,
        currency,
        province,
        city,
        area,
        status,
        imageKeys,
        specs,
        createdAt,
        categoryId,
        userId,
        brandId,
        modelId
      `)
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      console.error('Listing not found:', id, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch listing by ID:', error);
    return null;
  }
}