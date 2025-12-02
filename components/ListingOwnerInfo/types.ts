import { OwnerData } from '@/stores/listingOwnerStore';

export interface ListingOwnerInfoProps {
  userId: string;
  listingId: string;
}

export interface OwnerCardProps {
  owner: OwnerData;
  onViewDetails: () => void;
}

export interface OwnerSectionProps {
  owner: OwnerData;
  listingId: string;
  onViewDetails: () => void;
}

export interface OwnerDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  owner: OwnerData;
  listingId: string;
}
