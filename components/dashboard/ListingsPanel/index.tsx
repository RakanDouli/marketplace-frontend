'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Loading, Text, Table, TableHead, TableBody, TableRow, TableCell, Pagination } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { EditListingModal, DeleteListingModal } from './modals';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUserListingsStore, ListingStatus } from '@/stores/userListingsStore';
import { useMetadataStore } from '@/stores/metadataStore';
import { LISTING_STATUS_LABELS, mapToOptions, getLabel } from '@/constants/metadata-labels';
import { RefreshCw, Edit, Trash2, Eye, Plus } from 'lucide-react';
import { Listing } from '@/types/listing';
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

  // Handle refresh
  const handleRefresh = () => {
    loadMyListings(filters, 1);
  };

  // Handle create listing - navigate to create page
  const handleCreateListing = () => {
    router.push('/dashboard/listings/create');
  };

  // Handle edit listing
  const handleEditListing = (listing: Listing) => {
    setSelectedListing(listing);
    setShowEditModal(true);
  };

  // Handle delete listing
  const handleDeleteListing = (listing: Listing) => {
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
  const handleDeleteConfirm = async () => {
    if (listingToDelete) {
      try {
        await deleteMyListing(listingToDelete.id);

        addNotification({
          type: 'success',
          title: 'تم حذف الإعلان بنجاح',
          message: `تم حذف الإعلان "${listingToDelete.title}" بنجاح`,
          duration: 3000
        });
        setShowDeleteModal(false);
        setListingToDelete(null);
      } catch (error) {
        console.error('Delete listing error:', error);
        addNotification({
          type: 'error',
          title: 'فشل في حذف الإعلان',
          message: 'حدث خطأ أثناء حذف الإعلان',
          duration: 5000
        });
      }
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

  // Format price - using English numbers to match user-facing listings
  const formatPrice = (priceMinor: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(priceMinor / 100);
  };

  // Format date - using English dates for consistency
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  // Calculate total pages
  const totalPages = Math.ceil(pagination.total / pagination.limit);

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
              onClick={handleRefresh}
              variant="secondary"
              icon={<RefreshCw size={16} />}
              disabled={loading}
            >
              تحديث
            </Button>
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
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>العنوان</TableCell>
                <TableCell isHeader>السعر</TableCell>
                <TableCell isHeader>الفئة</TableCell>
                <TableCell isHeader>الحالة</TableCell>
                <TableCell isHeader>تاريخ الإنشاء</TableCell>
                <TableCell isHeader>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listings.map(listing => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <div className={styles.itemTitle}>
                      {listing.title}
                    </div>
                  </TableCell>
                  <TableCell>{formatPrice(listing.priceMinor)}</TableCell>
                  <TableCell>{listing.category?.name || 'سيارات'}</TableCell>
                  <TableCell>
                    <span className={`${styles.statusBadge} ${styles[`status-${listing.status.toLowerCase()}`]}`}>
                      {getLabel(listing.status, LISTING_STATUS_LABELS)}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(listing.createdAt)}</TableCell>
                  <TableCell>
                    <div className={styles.actions}>
                      <Button
                        onClick={() => handleEditListing(listing)}
                        variant="outline"
                        size="sm"
                        icon={<Edit size={16} />}
                        title="تعديل"
                      />
                      <Button
                        onClick={() => handleDeleteListing(listing)}
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        title="حذف"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
