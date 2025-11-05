import { cachedGraphQLRequest } from '@/utils/graphql-cache';

const TRACK_LISTING_VIEW_MUTATION = `
  mutation TrackListingView($listingId: ID!) {
    trackListingView(listingId: $listingId)
  }
`;

/**
 * Track a listing view (with session-based deduplication on backend)
 * @param listingId - ID of the listing being viewed
 * @returns Promise<boolean> - true if tracked, false if duplicate/error
 */
export async function trackListingView(listingId: string): Promise<boolean> {
  try {
    const response = await cachedGraphQLRequest(
      TRACK_LISTING_VIEW_MUTATION,
      { listingId },
      { ttl: 0 } // Never cache tracking mutations
    );

    return response.trackListingView || false;
  } catch (error) {
    console.error('[trackListingView] Error tracking view:', error);
    return false;
  }
}
