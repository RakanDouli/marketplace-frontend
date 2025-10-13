'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ListingDetailClient } from './ListingDetailClient';

export default function ListingDetailPage() {
  const params = useParams();
  const listingId = params.id as string;

  return <ListingDetailClient listingId={listingId} />;
}
