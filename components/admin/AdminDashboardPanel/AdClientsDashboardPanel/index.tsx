'use client';

import React, { useEffect, useState } from 'react';
import { Button, Loading, Text } from '@/components/slices';
import { useAdminAdClientsStore, type AdClient } from '@/stores/admin/adminAdClientsStore';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/slices';
import { CreateAdClientModal, EditAdClientModal, DeleteAdClientModal } from './modals';
import { useFeaturePermissions } from '@/hooks/usePermissions';
import { useNotificationStore } from '@/stores/notificationStore';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { invalidateGraphQLCache } from '@/utils/graphql-cache';
import styles from '../SharedDashboardPanel.module.scss';

export const AdClientsDashboardPanel: React.FC = () => {
  const {
    adClients,
    loading,
    error,
    loadAdClientsWithCache,
    createAdClient,
    updateAdClient,
    deleteAdClient,
    clearError
  } = useAdminAdClientsStore();

  const { canView, canCreate, canModify, canDelete } = useFeaturePermissions('ad_clients');
  const { addNotification } = useNotificationStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<AdClient | null>(null);
  const [clientToDelete, setClientToDelete] = useState<AdClient | null>(null);

  useEffect(() => {
    // Invalidate cache on mount to ensure fresh data
    invalidateGraphQLCache('adClients');
    loadAdClientsWithCache();
  }, [loadAdClientsWithCache]);

  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في إدارة عملاء الإعلانات',
        message: error,
        duration: 5000
      });
      clearError();
    }
  }, [error, addNotification, clearError]);

  const handleCreateClient = () => {
    setShowCreateModal(true);
  };

  const handleEdit = (client: AdClient) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleDelete = (client: AdClient) => {
    setClientToDelete(client);
    setShowDeleteModal(true);
  };

  const handleCreateSubmit = async (input: any) => {
    try {
      await createAdClient(input);
      addNotification({
        type: 'success',
        title: 'تم إنشاء العميل بنجاح',
        message: `تم إنشاء العميل ${input.companyName} بنجاح`,
        duration: 3000
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Create ad client error:', error);
    }
  };

  const handleEditSubmit = async (input: any) => {
    try {
      await updateAdClient(input);
      addNotification({
        type: 'success',
        title: 'تم تحديث العميل بنجاح',
        message: `تم تحديث بيانات العميل ${input.companyName} بنجاح`,
        duration: 3000
      });
      setShowEditModal(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Update ad client error:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (clientToDelete) {
      try {
        await deleteAdClient(clientToDelete.id);
        addNotification({
          type: 'success',
          title: 'تم حذف العميل بنجاح',
          message: `تم حذف العميل ${clientToDelete.companyName} بنجاح`,
          duration: 3000
        });
        setShowDeleteModal(false);
        setClientToDelete(null);
      } catch (error) {
        console.error('Delete ad client error:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'warning';
      case 'BLACKLISTED':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'نشط';
      case 'INACTIVE':
        return 'غير نشط';
      case 'BLACKLISTED':
        return 'محظور';
      default:
        return status;
    }
  };

  return (
    <>
      <div className={styles.dashboardPanel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Text variant="h2" className={styles.title}>إدارة عملاء الإعلانات</Text>
            <Text variant="paragraph" color="secondary" className={styles.description}>
              إدارة الشركات والعملاء المعلنين
            </Text>
          </div>
          <div className={styles.headerActions}>
            {canCreate && (
              <Button
                onClick={handleCreateClient}
                variant="primary"
                icon={<Plus size={16} />}
              >
                إضافة عميل جديد
              </Button>
            )}
          </div>
        </div>

        {/* Ad Clients Table */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <Loading type='svg' />
            <Text variant="paragraph">جاري تحميل العملاء...</Text>
          </div>
        ) : adClients.length === 0 ? (
          <div className={styles.emptyState}>
            <Text variant="h3">لا يوجد عملاء إعلانيين</Text>
            <Text variant="paragraph" color="secondary">لم يتم العثور على عملاء</Text>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>اسم الشركة</TableCell>
                <TableCell isHeader>الصناعة</TableCell>
                <TableCell isHeader>جهة الاتصال</TableCell>
                <TableCell isHeader>البريد الإلكتروني</TableCell>
                <TableCell isHeader>الهاتف</TableCell>
                <TableCell isHeader>الحالة</TableCell>
                {(canModify || canDelete) && <TableCell isHeader>الإجراءات</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {adClients.map(client => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Text variant="paragraph" weight="medium">{client.companyName}</Text>
                  </TableCell>
                  <TableCell>
                    <Text variant="paragraph" color="secondary">
                      {client.industry || '-'}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text variant="paragraph">{client.contactName}</Text>
                    <Text variant="small" color="secondary">{client.contactEmail}</Text>
                  </TableCell>
                  <TableCell>
                    <Text variant="small" color="secondary">
                      {client.contactEmail}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text variant="small" color="secondary">
                      {client.contactPhone || '-'}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <span
                      className={styles.statusBadge}
                      style={{
                        backgroundColor: `var(--color-${getStatusColor(client.status)}-light)`,
                        color: `var(--color-${getStatusColor(client.status)})`
                      }}
                    >
                      {getStatusLabel(client.status)}
                    </span>
                  </TableCell>
                  {(canModify || canDelete) && (
                    <TableCell>
                      <div className={styles.actions}>
                        {canModify && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(client)}
                            title="تعديل"
                          >
                            <Edit size={16} />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(client)}
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Create Ad Client Modal */}
        <CreateAdClientModal
          isVisible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSubmit}
          isLoading={loading}
        />

        {/* Edit Ad Client Modal */}
        <EditAdClientModal
          isVisible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedClient(null);
          }}
          onSubmit={handleEditSubmit}
          initialData={selectedClient}
          isLoading={loading}
        />

        {/* Delete Ad Client Modal */}
        <DeleteAdClientModal
          isVisible={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setClientToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          adClient={clientToDelete}
          isLoading={loading}
        />
      </div>
    </>
  );
};
