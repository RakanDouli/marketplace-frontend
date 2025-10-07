'use client';

import React, { useEffect, useState } from 'react';
import { Button, Loading, Text } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { useAdminRolesStore } from '@/stores/admin/adminRolesStore';
import type { Role } from '@/stores/admin/adminRolesStore';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/slices';
import { useFeaturePermissions } from '@/hooks/usePermissions';
import { useNotificationStore } from '@/stores/notificationStore';
import { Plus, RefreshCw, Edit, Trash2, Shield, Users, Eye, Settings } from 'lucide-react';
import { CreateRoleModal, EditRoleModal, DeleteRoleModal } from './modals';
import styles from '../SharedDashboardPanel.module.scss';

export const RolesDashboardPanel: React.FC = () => {
  const {
    roles,
    features,
    selectedRole,
    loading,
    error,
    loadRoles,
    loadFeatures,
    loadRoleWithPermissions,
    createRole,
    updateRolePermissions,
    deleteRole,
    setSelectedRole,
    clearError
  } = useAdminRolesStore();

  const { canView, canCreate, canModify, canDelete } = useFeaturePermissions('roles');
  const { addNotification } = useNotificationStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadRoles();
    loadFeatures();
  }, [loadRoles, loadFeatures]);

  useEffect(() => {
    if (error) {
      // Show error notification using toast system
      addNotification({
        type: 'error',
        title: 'خطأ في إدارة الأدوار',
        message: error,
        duration: 5000
      });
      // Clear error from store
      clearError();
    }
  }, [error, clearError, addNotification]);

  // Simple helper functions for display
  const getPriorityLabel = (priority: number) => {
    const priorityLabels: Record<number, string> = {
      0: 'أعلى صلاحية', // SUPER_ADMIN
      1: 'صلاحية مخصصة',
      2: 'صلاحية منخفضة'
    };
    return priorityLabels[priority] || `أولوية ${priority}`;
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'نشط' : 'غير نشط';
  };

  // Action handlers for new modal structure
  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const handleDelete = (role: Role) => {
    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  // Handle create new role
  const handleCreateRole = () => {
    setSelectedRole(null);
    setShowCreateModal(true);
  };

  // Handle create form submission
  const handleCreateSubmit = async (roleData: any) => {
    try {
      await createRole(roleData);
      addNotification({
        type: 'success',
        title: 'تم إنشاء الدور بنجاح',
        message: `تم إنشاء الدور ${roleData.name} بنجاح`,
        duration: 3000
      });
      setShowCreateModal(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('Create role error:', error);
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (roleData: any) => {
    try {
      if (selectedRole) {
        await updateRolePermissions(selectedRole.id, roleData.featurePermissions);
        addNotification({
          type: 'success',
          title: 'تم تحديث الدور بنجاح',
          message: 'تم حفظ التغييرات بنجاح',
          duration: 3000
        });
      }
      setShowEditModal(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('Update role error:', error);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (roleToDelete) {
      try {
        await deleteRole(roleToDelete.id);
        addNotification({
          type: 'success',
          title: 'تم حذف الدور بنجاح',
          message: `تم حذف الدور ${roleToDelete.name} بنجاح`,
          duration: 3000
        });
        setShowDeleteModal(false);
        setRoleToDelete(null);
      } catch (error) {
        console.error('Delete role error:', error);
      }
    }
  };

  return (
    <>
      <div className={styles.dashboardPanel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Text variant="h2" className={styles.title}>إدارة الأدوار والصلاحيات</Text>
            <Text variant="paragraph" color="secondary" className={styles.description}>
              إنشاء وتحديث أدوار المستخدمين وصلاحياتهم في النظام
            </Text>
          </div>
          <div className={styles.headerActions}>
            <Button
              onClick={loadRoles}
              variant="secondary"
              icon={<RefreshCw size={16} />}
              loading={loading}
              disabled={loading}
            >
              تحديث
            </Button>
            {canCreate && (
              <Button
                onClick={handleCreateRole}
                variant="primary"
                icon={<Plus size={16} />}
              >
                إضافة دور جديد
              </Button>
            )}
          </div>
        </div>

        {/* Search and Controls */}
        <div className={styles.searchSection}>
          <div className={styles.searchRow}>
            <Text variant="small" className={styles.roleCount}>
              النتيحه: {roles.length}
            </Text>
            <Input
              type="search"
              placeholder="البحث بالاسم أو الوصف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Controls */}
          <div className={styles.controlsRow}>
            <Input
              type="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "", label: "جميع الحالات" },
                { value: "active", label: "نشط" },
                { value: "inactive", label: "غير نشط" }
              ]}
            />

          </div>
        </div>

        {/* Info Cards */}
        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <Shield size={24} />
            </div>
            <div className={styles.infoContent}>
              <Text variant="h3">الأدوار النشطة</Text>
              <Text variant="paragraph" color="secondary">{roles.filter(role => role.isActive).length} دور</Text>
            </div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <Settings size={24} />
            </div>
            <div className={styles.infoContent}>
              <Text variant="h3">الميزات المتاحة</Text>
              <Text variant="paragraph" color="secondary">{features.length} ميزة</Text>
            </div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <Users size={24} />
            </div>
            <div className={styles.infoContent}>
              <Text variant="h3">أدوار مخصصة</Text>
              <Text variant="paragraph" color="secondary">{roles.filter(role => role.name !== 'SUPER_ADMIN').length} دور</Text>
            </div>
          </div>
        </div>

        {/* Roles Table */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <Loading type='svg' />
          </div>
        ) : roles.length === 0 ? (
          <div className={styles.emptyState}>
            <Text variant="h3">لا توجد أدوار</Text>
            <Text variant="paragraph" color="secondary">لم يتم العثور على أي أدوار</Text>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>اسم الدور</TableCell>
                <TableCell isHeader>الوصف</TableCell>
                <TableCell isHeader>مستوى الأولوية</TableCell>
                <TableCell isHeader>الحالة</TableCell>
                {(canView || canModify || canDelete) && <TableCell isHeader>الإجراءات</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map(role => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className={styles.roleName}>
                      <Text variant="paragraph">{role.name}</Text>
                    </div>
                  </TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>{getPriorityLabel(role.priority)}</TableCell>
                  <TableCell>
                    <span className={`${styles.statusBadge} ${role.isActive ? styles.active : styles.inactive}`}>
                      {getStatusLabel(role.isActive)}
                    </span>
                  </TableCell>
                  {(canView || canModify || canDelete) && (
                    <TableCell>
                      <div className={styles.actions}>
                        {canModify && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(role)}
                            title="تعديل"
                          >
                            <Edit size={16} />
                          </Button>
                        )}
                        {canDelete && role.name !== 'SUPER_ADMIN' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(role)}
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

        {/* Create Role Modal */}
        <CreateRoleModal
          isVisible={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedRole(null);
          }}
          onSubmit={handleCreateSubmit}
          features={features}
          isLoading={loading}
        />

        {/* Edit Role Modal */}
        <EditRoleModal
          isVisible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRole(null);
          }}
          onSubmit={handleEditSubmit}
          initialData={selectedRole}
          features={features}
          isLoading={loading}
          loadRoleWithPermissions={loadRoleWithPermissions}
        />

        {/* Delete Role Modal */}
        <DeleteRoleModal
          isVisible={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setRoleToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          role={roleToDelete}
          isLoading={loading}
        />
      </div>
    </>
  );
};