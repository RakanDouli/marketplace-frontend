'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ListingDetailClient } from './ListingDetailClient';

export default function ListingDetailPage() {
  const params = useParams();
  const listingId = params.listingId as string;
  const category = params.category as string;

  return <ListingDetailClient listingId={listingId} categorySlug={category} />;
}
