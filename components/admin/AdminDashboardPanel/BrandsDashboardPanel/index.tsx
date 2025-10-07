'use client';

import React, { useEffect, useState } from 'react';
import { Button, Loading, Text } from '@/components/slices';
import { Table, TableHead, TableBody, TableRow, TableCell, Pagination } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { useFeaturePermissions } from '@/hooks/usePermissions';
import { useNotificationStore } from '@/stores/notificationStore';
import { useBrandsStore } from '@/stores/admin/adminBrandsStore';
import { RefreshCw, Edit, Trash2, Plus, Zap, Car, Package } from 'lucide-react';
import { CreateBrandModal, EditBrandModal, DeleteBrandModal, SyncCatalogModal } from './modals';
import styles from '../SharedDashboardPanel.module.scss';
import TextSection from '@/components/slices/TextSection/TextSection';

interface Category {
  id: string;
  slug: string;
  name: string;
  nameAr?: string;
  isActive: boolean;
}

interface Brand {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  externalId?: string | null;
  source: 'manual' | 'sync';
  status: 'active' | 'archived';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  modelsCount?: number; // Will be added via resolver
}

export const BrandsDashboardPanel: React.FC = () => {
  const { canView, canCreate, canModify, canDelete } = useFeaturePermissions('brands');
  const { addNotification } = useNotificationStore();

  // Use brands store
  const {
    categories,
    brands,
    selectedBrand,
    loading,
    error,
    pagination,
    selectedCategoryId,
    loadCategories,
    loadBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    syncCatalogNow,
    setSelectedCategory,
    setSelectedBrand,
    nextPage,
    prevPage,
    goToPage,
    clearError,
  } = useBrandsStore();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Log categories for debugging
  useEffect(() => {
    console.log('Categories loaded:', categories);
    console.log('Current selectedCategoryId:', selectedCategoryId);
  }, [categories, selectedCategoryId]);

  // Load brands when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      loadBrands(selectedCategoryId, searchTerm);
    }
  }, [selectedCategoryId, searchTerm, loadBrands]);

  // Handle error notifications
  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في إدارة العلامات التجارية',
        message: error,
        duration: 5000
      });
      clearError();
    }
  }, [error, addNotification, clearError]);

  // if (!canView) {
  //   return (
  //     <div className={styles.dashboardPanel}>
  //       <div className={styles.noAccess}>
  //         <Text variant="h2" color="error">وصول مرفوض</Text>
  //         <Text variant="paragraph" color="secondary">
  //           ليس لديك صلاحية لعرض إدارة العلامات التجارية
  //         </Text>
  //       </div>
  //     </div>
  //   );
  // }

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchTerm(''); // Clear search when changing category
  };

  // Handle refresh
  const handleRefresh = () => {
    if (selectedCategoryId) {
      loadBrands(selectedCategoryId, searchTerm, true); // Force refresh
    }
  };

  // Handle sync
  const handleSync = () => {
    setShowSyncModal(true);
  };

  // Handle brand actions
  const handleCreateBrand = () => {
    if (!selectedCategoryId) {
      addNotification({
        type: 'warning',
        title: 'اختر فئة أولاً',
        message: 'يرجى اختيار فئة لإنشاء علامة تجارية جديدة',
        duration: 3000
      });
      return;
    }
    setSelectedBrand(null);
    setShowCreateModal(true);
  };

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    setShowEditModal(true);
  };

  const handleDeleteBrand = (brand: Brand) => {
    setBrandToDelete(brand);
    setShowDeleteModal(true);
  };

  // Handle form submissions
  const handleCreateSubmit = async (brandData: any) => {
    try {
      const newBrand = await createBrand({
        ...brandData,
        categoryId: selectedCategoryId!
      });
      addNotification({
        type: 'success',
        title: 'تم إنشاء العلامة التجارية بنجاح',
        message: `تم إنشاء العلامة التجارية "${brandData.name}" بنجاح`,
        duration: 3000
      });
      setShowCreateModal(false);

      // Set the newly created brand as selected so models can be added immediately
      setSelectedBrand(newBrand);
    } catch (error) {
      console.error('Create brand error:', error);
    }
  };

  const handleEditSubmit = async (brandData: any) => {
    try {
      await updateBrand(brandData);
      addNotification({
        type: 'success',
        title: 'تم تحديث العلامة التجارية بنجاح',
        message: 'تم حفظ التغييرات بنجاح',
        duration: 3000
      });
      setShowEditModal(false);
      setSelectedBrand(null);
    } catch (error) {
      console.error('Update brand error:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (brandToDelete) {
      try {
        await deleteBrand(brandToDelete.id);
        addNotification({
          type: 'success',
          title: 'تم حذف العلامة التجارية بنجاح',
          message: `تم حذف العلامة التجارية "${brandToDelete.name}" بنجاح`,
          duration: 3000
        });
        setShowDeleteModal(false);
        setBrandToDelete(null);
      } catch (error) {
        console.error('Delete brand error:', error);
      }
    }
  };

  const handleSyncConfirm = async () => {
    try {
      const result = await syncCatalogNow();
      addNotification({
        type: 'success',
        title: 'تم تحديث الكتالوج بنجاح',
        message: `تم تحديث ${result.brands} علامة تجارية و ${result.models} موديل`,
        duration: 5000
      });
      setShowSyncModal(false);
      // Reload brands after sync
      if (selectedCategoryId) {
        loadBrands(selectedCategoryId, searchTerm, true);
      }
    } catch (error) {
      console.error('Sync catalog error:', error);
    }
  };

  // Helper functions
  const getSourceLabel = (source: string) => {
    return source?.toLowerCase() === 'manual' ? 'يدوي' : 'مزامنة';
  };

  const getStatusLabel = (status: string) => {
    return status?.toLowerCase() === 'active' ? 'نشط' : 'مؤرشف';
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <>
      <div className={styles.dashboardPanel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <TextSection title='إدارة العلامات التجارية والموديلات' body="  إدارة العلامات التجارية والموديلات لكل فئة مع إمكانية المزامنة مع APIs خارجية"
            />

            <div className={styles.categorySelector}>
              <Text variant="small" className={styles.selectorLabel}>اختر الفئة:</Text>
              <Input
                type="select"
                value={selectedCategoryId || ''}
                onChange={(e) => handleCategoryChange(e.target.value)}
                options={[
                  { value: '', label: 'اختر فئة...' },
                  ...categories.map(category => ({
                    value: category.id,
                    label: category.nameAr || category.name
                  }))
                ]}
                placeholder="اختر فئة..."
              />
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button
              onClick={handleRefresh}
              variant="secondary"
              icon={<RefreshCw size={16} />}
              disabled={loading || !selectedCategoryId}
            >
              تحديث
            </Button>
            {canModify && (
              <Button
                onClick={handleSync}
                variant="outline"
                icon={<Zap size={16} />}
                disabled={loading || !selectedCategoryId}
              >
                مزامنة الكتالوج
              </Button>
            )}
            {canCreate && (
              <Button
                onClick={handleCreateBrand}
                variant="primary"
                icon={<Plus size={16} />}
                disabled={!selectedCategoryId}
              >
                إضافة علامة تجارية
              </Button>
            )}

          </div>
        </div>

        {/* Category Selection */}
        <div className={styles.searchSection}>
          <div className={styles.searchRow}>
            {selectedCategoryId && (
              <>
                <Text variant="small" className={styles.itemCount}>
                  النتيجة: {pagination.total}
                </Text>
                <Input
                  type="search"
                  placeholder="البحث في العلامات التجارية..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </>
            )}
          </div>

          {selectedCategoryId && (
            <div className={styles.controlsRow}>
              <Input
                type="select"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                options={[
                  { value: '', label: 'جميع المصادر' },
                  { value: 'manual', label: 'يدوي' },
                  { value: 'sync', label: 'مزامنة' },
                ]}
              />
              <Input
                type="select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'جميع الحالات' },
                  { value: 'active', label: 'نشط' },
                  { value: 'archived', label: 'مؤرشف' },
                ]}
              />
            </div>
          )}
        </div>

        {/* Info Cards for Selected Category */}
        {selectedCategoryId && selectedCategory && (
          <div className={styles.infoCards}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <Car size={24} />
              </div>
              <div className={styles.infoContent}>
                <Text variant="h3">{selectedCategory.nameAr || selectedCategory.name}</Text>
                <Text variant="paragraph" color="secondary">الفئة المحددة</Text>
              </div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <Package size={24} />
              </div>
              <div className={styles.infoContent}>
                <Text variant="h3">العلامات التجارية</Text>
                <Text variant="paragraph" color="secondary">{pagination.total} علامة</Text>
              </div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <Zap size={24} />
              </div>
              <div className={styles.infoContent}>
                <Text variant="h3">المزامنة</Text>
                <Text variant="paragraph" color="secondary">
                  {brands.filter(b => b.source === 'sync').length} مزامنة
                </Text>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {!selectedCategoryId ? (
          <div className={styles.emptyState}>
            <Car size={48} className={styles.emptyIcon} />
            <Text variant="h3">اختر فئة للبدء</Text>
            <Text variant="paragraph" color="secondary">
              اختر فئة من القائمة أعلاه لعرض العلامات التجارية والموديلات
            </Text>
          </div>
        ) : loading ? (
          <div className={styles.loadingContainer}>
            <Loading />
            <Text variant="paragraph">جاري تحميل العلامات التجارية...</Text>
          </div>
        ) : brands.length === 0 ? (
          <div className={styles.emptyState}>
            <Package size={48} className={styles.emptyIcon} />
            <Text variant="h3">لا توجد علامات تجارية</Text>
            <Text variant="paragraph" color="secondary">
              لم يتم العثور على أي علامات تجارية في هذه الفئة
            </Text>
            {canCreate && (
              <Button
                onClick={handleCreateBrand}
                variant="primary"
                icon={<Plus size={16} />}
              >
                إضافة أول علامة تجارية
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>اسم العلامة</TableCell>
                <TableCell isHeader>المعرف الخارجي</TableCell>
                <TableCell isHeader>المصدر</TableCell>
                <TableCell isHeader>الحالة</TableCell>
                <TableCell isHeader>عدد الموديلات</TableCell>
                <TableCell isHeader>تاريخ الإنشاء</TableCell>
                {(canModify || canDelete) && <TableCell isHeader>الإجراءات</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {brands.map(brand => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <div className={styles.brandName}>
                      <Text variant="paragraph">{brand.name}</Text>
                    </div>
                  </TableCell>
                  <TableCell>{brand.externalId || '-'}</TableCell>
                  <TableCell>
                    <span className={`${styles.sourceBadge} ${styles[`source-${brand.source?.toLowerCase()}`]}`}>
                      {getSourceLabel(brand.source)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`${styles.statusBadge} ${brand.status?.toLowerCase() === 'active' ? styles.active : styles.inactive}`}>
                      {getStatusLabel(brand.status)}
                    </span>
                  </TableCell>
                  <TableCell>{brand.modelsCount || 0}</TableCell>
                  <TableCell>{new Date(brand.createdAt).toLocaleDateString('en-US')}</TableCell>
                  {(canModify || canDelete) && (
                    <TableCell>
                      <div className={styles.actions}>
                        {canModify && (
                          <Button
                            onClick={() => handleEditBrand(brand)}
                            variant="outline"
                            size="sm"
                            icon={<Edit size={16} />}
                            title="تعديل العلامة والموديلات"
                          />
                        )}
                        {canDelete && (
                          <Button
                            onClick={() => handleDeleteBrand(brand)}
                            variant="danger"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            title="حذف"
                          />
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => {
                if (selectedCategoryId) {
                  loadBrands(selectedCategoryId, searchTerm, false, page);
                }
              }}
            />
            <Text variant="small" color="secondary">
              صفحة {pagination.page} من {pagination.totalPages} - عرض {brands.length} من {pagination.total} علامة تجارية
            </Text>
          </>
        )}
      </div>

      {/* Modals */}
      <CreateBrandModal
        isVisible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedBrand(null);
        }}
        onSubmit={handleCreateSubmit}
        categoryId={selectedCategoryId}
        isLoading={loading}
      />

      <EditBrandModal
        isVisible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBrand(null);
        }}
        onSubmit={handleEditSubmit}
        initialData={selectedBrand}
        isLoading={loading}
      />

      <DeleteBrandModal
        isVisible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setBrandToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        brand={brandToDelete}
        isLoading={loading}
      />

      <SyncCatalogModal
        isVisible={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onConfirm={handleSyncConfirm}
        categoryName={selectedCategory?.nameAr || selectedCategory?.name}
        isLoading={loading}
      />
    </>
  );
};