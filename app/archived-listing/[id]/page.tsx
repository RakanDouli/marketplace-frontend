import { ArchivedListingDetailClient } from './ArchivedListingDetailClient';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ArchivedListingPage({ params }: PageProps) {
  const { id } = await params;
  return <ArchivedListingDetailClient listingId={id} />;
}
