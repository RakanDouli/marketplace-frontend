'use client';

import React, { useEffect, useState } from 'react';
import { Button, Loading, Text, Input, Table, TableHead, TableBody, TableRow, TableCell, Pagination } from '@/components/slices';
import { useAdminAuditStore, AuditLog } from '@/stores/admin/adminAuditStore';
import { useAdminUsersStore } from '@/stores/admin';
import { PreviewAuditModal, DeleteAuditModal } from './modals';
import { useNotificationStore } from '@/stores/notificationStore';
import { Trash2, Eye } from 'lucide-react';
import styles from '../SharedDashboardPanel.module.scss';

export const AuditDashboardPanel: React.FC = () => {
  const {
    audits,
    loading,
    error,
    selectedAudit,
    pagination,
    loadAudits,
    deleteAudit,
    setSelectedAudit,
    filters,
    setFilters
  } = useAdminAuditStore();

  const { addNotification } = useNotificationStore();
  const { roles, loadRoles } = useAdminUsersStore();

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [auditToDelete, setAuditToDelete] = useState<AuditLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Initial load
  useEffect(() => {
    loadAudits();
    loadRoles();
  }, [loadAudits, loadRoles]);

  // Error notifications
  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في تحميل سجلات التدقيق',
        message: error,
        duration: 5000
      });
    }
  }, [error, addNotification]);

  // Search handler
  const handleSearch = () => {
    const newFilters = {
      userEmail: searchTerm || undefined,
      userRole: roleFilter || undefined,
      entityId: searchTerm || undefined
    };
    setFilters(newFilters);
    loadAudits(newFilters, 1);
  };

  const handlePreview = (audit: AuditLog) => {
    setSelectedAudit(audit);
    setShowPreviewModal(true);
  };

  const handleDelete = (audit: AuditLog) => {
    setAuditToDelete(audit);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!auditToDelete) return;
    try {
      await deleteAudit(auditToDelete.id);
      addNotification({
        type: 'success',
        title: 'تم حذف السجل',
        message: `تم حذف سجل التدقيق بنجاح`,
        duration: 3000
      });
      setShowDeleteModal(false);
      setAuditToDelete(null);
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'خطأ عند الحذف',
        message: err instanceof Error ? err.message : 'حدث خطأ',
        duration: 3000
      });
    }
  };

  return (
    <div className={styles.dashboardPanel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Text variant="h2" className={styles.title}>سجلات التدقيق</Text>
          <Text variant="paragraph" color="secondary" className={styles.description}>
            متابعة كل التغييرات التي تحدث في النظام
          </Text>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchSection}>
        <div className={styles.searchRow}>
          <Text variant="small" className={styles.userCount}>
            النتيجة: {pagination.total}
          </Text>
          <Input
            type="search"
            placeholder="البحث بالبريد الإلكتروني أو معرّف الكيان..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
        </div>

        {/* Filter Controls */}
        <div className={styles.controlsRow}>
          <Input
            type="select"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              const newFilters = {
                userEmail: searchTerm || undefined,
                userRole: e.target.value || undefined,
                entityId: searchTerm || undefined
              };
              setFilters(newFilters);
              loadAudits(newFilters, 1);
            }}
            options={[
              { value: "", label: "جميع الأدوار" },
              ...roles.map(role => ({
                value: role.name,
                label: role.name
              }))
            ]}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <Loading type="svg" />
          <Text variant="paragraph">جاري تحميل سجلات التدقيق...</Text>
        </div>
      ) : audits.length === 0 ? (
        <div className={styles.emptyState}>
          <Text variant="h3">لا توجد سجلات</Text>
          <Text variant="paragraph" color="secondary">لم يتم العثور على سجلات تدقيق</Text>
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell isHeader>البريد الإلكتروني</TableCell>
              <TableCell isHeader>الدور</TableCell>
              <TableCell isHeader>الإجراء</TableCell>
              <TableCell isHeader>الكيان</TableCell>
              <TableCell isHeader>معرّف الكيان</TableCell>
              <TableCell isHeader>تاريخ الإنشاء</TableCell>
              <TableCell isHeader>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {audits.map(audit => (
              <TableRow key={audit.id}>
                <TableCell>{audit.user?.email || '-'}</TableCell>
                <TableCell>{audit.user?.role || '-'}</TableCell>
                <TableCell>{audit.action}</TableCell>
                <TableCell>{audit.entity}</TableCell>
                <TableCell>{audit.entityId}</TableCell>
                <TableCell>{new Date(audit.createdAt).toLocaleString('ar-EG')}</TableCell>
                <TableCell>
                  <div className={styles.actions}>
                    <Button variant="outline" size="sm" onClick={() => handlePreview(audit)}>
                      <Eye size={16} />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(audit)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) => loadAudits(filters, page)}
      />

      {/* Preview Modal */}
      <PreviewAuditModal
        isVisible={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedAudit(null);
        }}
        audit={selectedAudit}
      />

      {/* Delete Modal */}
      <DeleteAuditModal
        isVisible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAuditToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        audit={auditToDelete}
        isLoading={loading}
      />
    </div>
  );
};
