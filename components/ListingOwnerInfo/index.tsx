'use client';

import React, { useEffect, useState } from 'react';
import { useListingOwnerStore } from '@/stores/listingOwnerStore';
import { OwnerCard } from './OwnerCard';
import { OwnerDetailsModal } from './OwnerDetailsModal';
import { ListingOwnerInfoProps } from './types';
import styles from './ListingOwnerInfo.module.scss';

export const ListingOwnerInfo: React.FC<ListingOwnerInfoProps> = ({ userId, listingId }) => {
  const { fetchOwnerData, getOwner, loading, errors } = useListingOwnerStore();
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchOwnerData(userId);
  }, [userId, fetchOwnerData]);

  const owner = getOwner(userId);
  const isLoading = loading[userId];
  const error = errors[userId];

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.skeleton}>
          <div className={styles.skeletonCard}>
            <div className={styles.skeletonAvatar} />
            <div className={styles.skeletonText} style={{ width: '60%' }} />
            <div className={styles.skeletonText} style={{ width: '80%' }} />
            <div className={styles.skeletonButton} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !owner) {
    return (
      <div className={styles.errorState}>
        <p>{error || 'فشل في تحميل معلومات البائع'}</p>
      </div>
    );
  }

  return (
    <>
      <OwnerCard
        owner={owner}
        onViewDetails={() => setShowDetailsModal(true)}
      />

      <OwnerDetailsModal
        isVisible={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        owner={owner}
        listingId={listingId}
      />
    </>
  );
};
