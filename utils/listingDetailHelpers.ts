// Server-side utilities for listing detail page
import type { Attribute, Listing } from '@/types/listing';
import { CAR_FEATURES_LABELS } from '@/constants/metadata-labels';
import { GET_CATEGORY_ATTRIBUTES_QUERY } from '@/stores/filtersStore/filtersStore.gql';

export interface ProcessedSpec {
  key: string;
  label: string;
  value: string;
  sortOrder: number;
}

export interface ProcessedSpecGroup {
  groupOrder: number;
  specs: ProcessedSpec[];
}

export interface ProcessedSpecs {
  groupedSpecs: Record<string, ProcessedSpecGroup>;
  ungroupedSpecs: ProcessedSpec[];
  sortedGroups: Array<[string, ProcessedSpecGroup]>;
}

/**
 * Fetch attributes for a category (server-side)
 */
export async function fetchAttributesSSR(categorySlug: string): Promise<Attribute[]> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_CATEGORY_ATTRIBUTES_QUERY,
        variables: { categorySlug },
      }),
      next: { revalidate: 300, tags: [`attributes-${categorySlug}`] }, // Cache for 5 minutes
    });

    if (!response.ok) return [];

    const result = await response.json();
    return result.data?.getAttributesByCategorySlug || [];
  } catch (error) {
    console.error('Failed to fetch attributes SSR:', error);
    return [];
  }
}

/**
 * Process listing specs into grouped and ungrouped specs (server-side)
 * This removes the need for client-side useMemo processing
 */
export function processSpecs(
  listing: Listing,
  attributes: Attribute[]
): ProcessedSpecs {
  if (!listing?.specsDisplay || attributes.length === 0) {
    return { groupedSpecs: {}, ungroupedSpecs: [], sortedGroups: [] };
  }

  const groups: Record<string, ProcessedSpecGroup> = {};
  const ungrouped: ProcessedSpec[] = [];

  // Create a map of attribute keys to attributes
  const attributeMap = new Map<string, Attribute>();
  attributes.forEach(attr => {
    if (attr.showInDetail) {
      attributeMap.set(attr.key, attr);
    }
  });

  // Keys to exclude from specs (shown separately or handled by special components)
  const excludedKeys = ['listingType', 'condition', 'accountType', 'car_damage'];

  // Separate specs into grouped and ungrouped
  Object.entries(listing.specsDisplay).forEach(([key, value]: [string, any]) => {
    if (excludedKeys.includes(key)) return;

    const attribute = attributeMap.get(key);

    if (attribute) {
      const label = attribute.name;
      let displayValue = typeof value === 'object' ? value.value : value;

      // Translate feature keys to Arabic
      if (key === 'features' && typeof displayValue === 'string') {
        displayValue = displayValue
          .split(/[,،]/)
          .map((v: string) => v.trim())
          .filter((v: string) => v)
          .map((v: string) => CAR_FEATURES_LABELS[v] || v)
          .join('، ');
      }

      const spec: ProcessedSpec = {
        key,
        label,
        value: displayValue,
        sortOrder: attribute.sortOrder,
      };

      if (attribute.group) {
        const groupName = attribute.group;
        if (!groups[groupName]) {
          groups[groupName] = {
            groupOrder: attribute.groupOrder,
            specs: [],
          };
        }
        groups[groupName].specs.push(spec);
      } else {
        ungrouped.push(spec);
      }
    }
  });

  // Sort specs within each group
  Object.values(groups).forEach(group => {
    group.specs.sort((a, b) => a.sortOrder - b.sortOrder);
  });

  // Sort ungrouped specs
  ungrouped.sort((a, b) => a.sortOrder - b.sortOrder);

  // Sort groups by groupOrder
  const sortedGroups = Object.entries(groups).sort((a, b) => {
    return a[1].groupOrder - b[1].groupOrder;
  });

  return { groupedSpecs: groups, ungroupedSpecs: ungrouped, sortedGroups };
}
