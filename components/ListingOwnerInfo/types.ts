import { OwnerData } from '@/stores/listingOwnerStore';

export interface ListingOwnerInfoProps {
  userId: string;
  listingId: string;
}

export interface OwnerCardProps {
  userId: string;
  listingId: string;
}

export interface OwnerSectionProps {
  owner: OwnerData;
  listingId: string;
  onViewDetails: () => void;
}

export interface ReviewsModalProps {
  isVisible: boolean;
  onClose: () => void;
  owner: OwnerData;
}
