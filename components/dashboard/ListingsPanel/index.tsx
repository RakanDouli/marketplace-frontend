'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Loading, Text, Pagination, ListingCard } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { EditListingModal, DeleteListingModal } from './modals';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUserListingsStore, ListingStatus } from '@/stores/userListingsStore';
import { useArchivedListingStore } from '@/stores/archivedListingStore';
import { useMetadataStore } from '@/stores/metadataStore';
import { LISTING_STATUS_LABELS, REJECTION_REASON_LABELS, mapToOptions, getLabel } from '@/constants/metadata-labels';
import { RefreshCw, Edit, Trash2, Eye, Plus } from 'lucide-react';
import { Listing } from '@/types/listing';
import { optimizeListingImage } from '@/utils/cloudflare-images';
import styles from './ListingsPanel.module.scss';

export const ListingsPanel: React.FC = () => {
  const router = useRouter();
  const { addNotification } = useNotificationStore();

  // Use user listings store
  const {
    listings,
    loading,
    error,
    pagination,
    filters,
    loadMyListings,
    updateMyListing,
    deleteMyListing,
    setFilters,
    clearError,
  } = useUserListingsStore();

  // Use archived listing store for archiving
  const { archiveListing } = useArchivedListingStore();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadMyListings();
  }, [loadMyListings]);

  // Handle error notifications
  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في إدارة العروض',
        message: error,
        duration: 5000
      });
      clearError();
    }
  }, [error, addNotification, clearError]);

  // Handle search and filter changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setFilters({
        search: searchTerm || undefined,
        status: statusFilter as ListingStatus || undefined,
      });
      loadMyListings({
        search: searchTerm || undefined,
        status: statusFilter as ListingStatus || undefined
      }, 1);
    }, 300); // Debounce search

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, statusFilter]);



  // Handle create listing - navigate to create page
  const handleCreateListing = () => {
    router.push('/dashboard/listings/create');
  };

  // Handle edit listing
  const handleEditListing = (listing: Listing, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedListing(listing);
    setShowEditModal(true);
  };

  // Handle delete listing
  const handleDeleteListing = (listing: Listing, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setListingToDelete(listing);
    setShowDeleteModal(true);
  };

  // Handle edit save
  const handleEditSave = async (updatedData: Partial<Listing>) => {
    if (!selectedListing) return;

    try {
      await updateMyListing(selectedListing.id, updatedData);

      addNotification({
        type: 'success',
        title: 'تم تحديث الإعلان بنجاح',
        message: 'تم حفظ التغييرات بنجاح',
        duration: 3000
      });
      setShowEditModal(false);
      setSelectedListing(null);
    } catch (error) {
      console.error('Update listing error:', error);
      addNotification({
        type: 'error',
        title: 'فشل في تحديث الإعلان',
        message: 'حدث خطأ أثناء حفظ التغييرات',
        duration: 5000
      });
    }
  };


  // Handle delete confirmation
  const handleDeleteConfirm = async (action: 'sold_via_platform' | 'sold_externally' | 'no_longer_for_sale' | null) => {
    if (!listingToDelete || !action) return;

    try {
      // Archive with reason
      await archiveListing(listingToDelete.id, action);
      addNotification({
        type: 'success',
        title: 'تم أرشفة الإعلان',
        message: `تم أرشفة الإعلان "${listingToDelete.title}" بنجاح`,
        duration: 3000
      });

      setShowDeleteModal(false);
      setListingToDelete(null);

      // Refresh listings
      await loadMyListings();
    } catch (error) {
      console.error('Archive listing error:', error);
      addNotification({
        type: 'error',
        title: 'فشلت العملية',
        message: 'حدث خطأ أثناء أرشفة الإعلان',
        duration: 5000
      });
    }
  };

  // Fetch listing metadata on mount
  const { listingStatuses } = useMetadataStore();

  useEffect(() => {
    const metadataStore = useMetadataStore.getState();
    if (listingStatuses.length === 0) {
      metadataStore.fetchListingMetadata();
    }
  }, [listingStatuses.length]);

  // Format price
  const formatPrice = (priceMinor: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(priceMinor / 100);
  };

  // Calculate total pages
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Convert listing to ListingCard props
  const getListingCardProps = (listing: Listing) => {
    const images = listing.imageKeys?.map(key => optimizeListingImage(key, 'card')) || [];

    return {
      id: listing.id,
      title: listing.title,
      price: formatPrice(listing.priceMinor),
      currency: 'USD',
      location: listing.location?.province || 'غير محدد',
      accountType: (listing.user?.accountType as "individual" | "dealer" | "business") || 'individual',
      specs: listing.specsDisplay || {},
      images,
      description: listing.description,
    };
  };

  return (
    <>
      <div className={styles.dashboardPanel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Text variant="h2" className={styles.title}>إعلاناتي</Text>
            <Text variant="paragraph" color="secondary" className={styles.description}>
              إدارة ومراجعة جميع إعلاناتك
            </Text>
          </div>
          <div className={styles.headerActions}>
            <Button
              onClick={handleCreateListing}
              variant="primary"
              icon={<Plus size={16} />}
            >
              إضافة إعلان جديد
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className={styles.searchSection}>
          <div className={styles.searchRow}>
            <Text variant="small" className={styles.itemCount}>
              النتيحه: {pagination.total}
            </Text>
            <Input
              type="search"
              placeholder="البحث في الإعلانات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.controlsRow}>
            <Input
              type="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'جميع الحالات' },
                ...mapToOptions(listingStatuses, LISTING_STATUS_LABELS)
              ]}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <Loading />
            <Text variant="paragraph">جاري تحميل الإعلانات...</Text>
          </div>
        ) : listings.length === 0 ? (
          <div className={styles.emptyState}>
            <Eye size={48} className={styles.emptyIcon} />
            <Text variant="h3">لا توجد إعلانات</Text>
            <Text variant="paragraph" color="secondary">لم يتم العثور على أي إعلانات</Text>
            <Button
              onClick={handleCreateListing}
              variant="primary"
              icon={<Plus size={16} />}
            >
              إضافة إعلان جديد
            </Button>
          </div>
        ) : (
          <div className={styles.listingsGrid}>
            {listings.map(listing => (
              <div key={listing.id} className={styles.listingCardWrapper}>
                {/* Status Badge Overlay */}
                <div className={`${styles.statusBadge} ${styles[`status-${listing.status.toLowerCase()}`]}`}>
                  {getLabel(listing.status, LISTING_STATUS_LABELS)}
                </div>

                {/* Listing Card */}
                <ListingCard
                  {...getListingCardProps(listing)}
                  onClick={() => router.push(`/listing/${listing.id}`)}
                />

                {/* Draft Message - Show when status is DRAFT */}
                {listing.status?.toLowerCase() === 'draft' && (
                  <div className={styles.draftMessage}>
                    <Text variant="small" className={styles.draftText}>
                      يرجى تعديل إعلانك لنشره
                    </Text>
                  </div>
                )}

                {/* View Count */}
                {listing.viewCount !== undefined && (
                  <div className={styles.viewCount}>
                    <Eye size={14} />
                    <Text variant="xs">{listing.viewCount} مشاهدة</Text>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={styles.cardActions}>
                  <Button
                    onClick={(e) => handleEditListing(listing, e)}
                    variant="outline"
                    size="sm"
                    icon={<Edit size={16} />}

                  >
                    تعديل
                  </Button>
                  <Button
                    onClick={(e) => handleDeleteListing(listing, e)}
                    variant="danger"
                    size="sm"
                    icon={<Trash2 size={16} />}

                  >
                    حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && listings.length > 0 && (
          <>
            <Pagination
              currentPage={pagination.page}
              totalPages={totalPages}
              onPageChange={(page) => { loadMyListings(filters, page); }}
            />
            <Text variant="small" color="secondary">
              عرض {listings.length} من {pagination.total} إعلان
            </Text>
          </>
        )}
      </div>

      {/* Modals */}
      {showEditModal && selectedListing && (
        <EditListingModal
          listing={selectedListing}
          onClose={() => {
            setShowEditModal(false);
            setSelectedListing(null);
          }}
          onSave={handleEditSave}
        />
      )}

      {showDeleteModal && listingToDelete && (
        <DeleteListingModal
          listing={listingToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setListingToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}

    </>
  );
};
