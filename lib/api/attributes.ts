import { supabaseServer } from '../supabase';

// GraphQL query to get all filter data using existing backend query
const GET_FILTER_DATA_QUERY = `
  query GetFilterData($categorySlug: String!) {
    getAttributesByCategorySlug(categorySlug: $categorySlug) {
      id
      key
      nameEn
      nameAr
      descriptionEn
      descriptionAr
      type
      validation
      sortOrder
      group
      config
      options {
        id
        key
        valueEn
        valueAr
        sortOrder
        metadata
      }
    }
  }
`;

// GraphQL client function
async function graphqlRequest(query: string, variables: any = {}) {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

// Types matching backend dynamic attribute system
export interface AttributeOption {
  id: string;
  key: string;
  valueEn: string;
  valueAr: string;
  sortOrder: number;
  metadata?: any;
  isActive: boolean;
}

export interface Attribute {
  id: string;
  categoryId: string;
  key: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  type: 'selector' | 'range' | 'currency' | 'text' | 'boolean';
  validation: 'required' | 'optional';
  sortOrder: number;
  group: string;
  config: any;
  isActive: boolean;
  options: AttributeOption[];
}

export interface Brand {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  status: string;
  isActive: boolean;
}

export interface Model {
  id: string;
  brandId: string;
  name: string;
  slug: string;
  status: string;
  isActive: boolean;
}

// Complete filter data for a category (single GraphQL call)
export interface FilterData {
  attributes: Attribute[];
  brands: Brand[];
  provinces: string[];
}

export async function getAllFilterData(categorySlug: string): Promise<FilterData> {
  try {
    // Use GraphQL to get all attributes with options in one call (no need for category ID lookup!)
    const data = await graphqlRequest(GET_FILTER_DATA_QUERY, { categorySlug });
    
    const attributes: Attribute[] = data.getAttributesByCategorySlug || [];

    // For now, still use Supabase for brands and provinces until backend adds them to GraphQL
    // First get category ID from slug for brands
    const { data: category } = await supabaseServer
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .eq('isActive', true)
      .single();

    const [brandsResponse, provincesResponse] = await Promise.all([
      // Fetch brands for this category (need categoryId for this)
      category?.id ? supabaseServer
        .from('brands')
        .select(`
          id,
          categoryId,
          name,
          slug,
          status,
          isActive
        `)
        .eq('categoryId', category.id)
        .eq('isActive', true)
        .eq('status', 'active')
        .order('name', { ascending: true }) : Promise.resolve({ data: [] }),

      // Fetch provinces from listings
      supabaseServer
        .from('listings')
        .select('province')
        .not('province', 'is', null)
        .order('province')
    ]);

    // Process brands
    const brands: Brand[] = brandsResponse.data || [];

    // Process provinces (get unique values)
    const provinces = [...new Set(
      (provincesResponse.data || [])
        .map(item => item.province)
        .filter(Boolean)
    )];

    return {
      attributes,
      brands,
      provinces
    };

  } catch (error) {
    console.error('Failed to fetch filter data:', error);
    return {
      attributes: [],
      brands: [],
      provinces: []
    };
  }
}

// Get brands for a category
export async function getBrandsByCategory(categoryId: string): Promise<Brand[]> {
  try {
    const { data, error } = await supabaseServer
      .from('brands')
      .select(`
        id,
        categoryId,
        name,
        slug,
        status,
        isActive
      `)
      .eq('categoryId', categoryId)
      .eq('isActive', true)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching brands:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch brands:', error);
    return [];
  }
}

// Get models for a brand
export async function getModelsByBrand(brandId: string): Promise<Model[]> {
  try {
    const { data, error } = await supabaseServer
      .from('models')
      .select(`
        id,
        brandId,
        name,
        slug,
        status,
        isActive
      `)
      .eq('brandId', brandId)
      .eq('isActive', true)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching models:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return [];
  }
}

// Get location data (provinces and cities)
export async function getProvinces(): Promise<string[]> {
  try {
    const { data, error } = await supabaseServer
      .from('listings')
      .select('province')
      .not('province', 'is', null)
      .order('province');

    if (error) {
      console.error('Error fetching provinces:', error);
      return [];
    }

    // Get unique provinces
    const provinces = [...new Set(data?.map(item => item.province).filter(Boolean) || [])];
    return provinces;
  } catch (error) {
    console.error('Failed to fetch provinces:', error);
    return [];
  }
}

export async function getCitiesByProvince(province: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseServer
      .from('listings')
      .select('city')
      .eq('province', province)
      .not('city', 'is', null)
      .order('city');

    if (error) {
      console.error('Error fetching cities:', error);
      return [];
    }

    // Get unique cities
    const cities = [...new Set(data?.map(item => item.city).filter(Boolean) || [])];
    return cities;
  } catch (error) {
    console.error('Failed to fetch cities:', error);
    return [];
  }
}