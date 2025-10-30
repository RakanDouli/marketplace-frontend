import { ArchivedListingDetailClient } from './ArchivedListingDetailClient';

interface PageProps {
  params: {
    id: string;
  };
}

export default function ArchivedListingPage({ params }: PageProps) {
  return <ArchivedListingDetailClient listingId={params.id} />;
}
