import { supabaseServer } from '../supabase';
import { Category } from '../../stores/types';

// Server-side category fetching for SSR (faster for Syrian internet)
export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabaseServer
      .from('categories')
      .select('id, name, nameAr, slug, isActive, biddingEnabled')
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data?.map(cat => ({
      id: cat.id,
      name: cat.name,
      nameAr: cat.nameAr || cat.name,
      slug: cat.slug,
      isActive: cat.isActive,
    })) || [];
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

// Get single category by slug for dynamic routing
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const { data, error } = await supabaseServer
      .from('categories')
      .select('id, name, nameAr, slug, isActive, biddingEnabled')
      .eq('slug', slug)
      .eq('isActive', true)
      .single();

    if (error || !data) {
      console.error('Category not found:', slug, error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      nameAr: data.nameAr || data.name,
      slug: data.slug,
      isActive: data.isActive,
    };
  } catch (error) {
    console.error('Failed to fetch category by slug:', error);
    return null;
  }
}

// Get root categories for navigation (cached with ISR)
export async function getRootCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabaseServer
      .from('categories')
      .select('id, name, nameAr, slug, isActive, biddingEnabled')
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching root categories:', error);
      return [];
    }

    return data?.map(cat => ({
      id: cat.id,
      name: cat.name,
      nameAr: cat.nameAr || cat.name,
      slug: cat.slug,
      isActive: cat.isActive,
    })) || [];
  } catch (error) {
    console.error('Failed to fetch root categories:', error);
    return [];
  }
}