'use client';

import React, { useEffect, useState } from 'react';
import { Container } from '@/components/slices/Container/Container';
import { Button, Loading } from '@/components/slices';
import { useAdminRolesStore } from '@/stores/admin/adminRolesStore';
import type { Role, RoleWithPermissions } from '@/stores/admin/adminRolesStore';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/slices';
import { useFeaturePermissions } from '@/hooks/usePermissions';
import { Plus, RefreshCw, AlertCircle, Shield, Users, Eye, Settings, Trash2 } from 'lucide-react';
import { RoleForm } from '../../RoleManagement/RoleForm';
import styles from './RolesCRUD.module.scss';

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
    deleteRole,
    setSelectedRole,
    clearError
  } = useAdminRolesStore();

  const { canView, canCreate, canModify, canDelete } = useFeaturePermissions('roles');

  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedRoleWithPermissions, setSelectedRoleWithPermissions] = useState<RoleWithPermissions | null>(null);

  useEffect(() => {
    loadRoles();
    loadFeatures();
  }, [loadRoles, loadFeatures]);

  useEffect(() => {
    if (error) {
      // Auto-clear error after 5 seconds
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

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

  // Simple action handlers
  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setFormMode('edit');
    setShowRoleForm(true);
  };

  const handleViewPermissions = async (role: Role) => {
    const roleWithPermissions = await loadRoleWithPermissions(role.id);
    if (roleWithPermissions) {
      setSelectedRoleWithPermissions(roleWithPermissions);
      setShowPermissionMatrix(true);
    }
  };

  const handleDelete = async (role: Role) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الدور؟ لا يمكن التراجع عن هذا الإجراء.')) {
      await deleteRole(role.id);
    }
  };

  // Handle create new role
  const handleCreateRole = () => {
    setSelectedRole(null);
    setFormMode('create');
    setShowRoleForm(true);
  };

  return (
    <>
      <div className={styles.rolesCRUD}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>إدارة الأدوار والصلاحيات</h1>
            <p className={styles.description}>
              إنشاء وتحديث أدوار المستخدمين وصلاحياتهم في النظام
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button
              onClick={loadRoles}
              variant="secondary"
              icon={<RefreshCw size={16} className={loading ? styles.spinning : ''} />}
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

        {/* Error Display */}
        {error && (
          <div className={styles.errorAlert}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button
              onClick={clearError}
              className={styles.errorClose}
            >
              ×
            </button>
          </div>
        )}

        {/* Info Cards */}
        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <Shield size={24} />
            </div>
            <div className={styles.infoContent}>
              <h3>الأدوار النشطة</h3>
              <p>{roles.filter(role => role.isActive).length} دور</p>
            </div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <Settings size={24} />
            </div>
            <div className={styles.infoContent}>
              <h3>الميزات المتاحة</h3>
              <p>{features.length} ميزة</p>
            </div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <Users size={24} />
            </div>
            <div className={styles.infoContent}>
              <h3>أدوار مخصصة</h3>
              <p>{roles.filter(role => role.name !== 'SUPER_ADMIN').length} دور</p>
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
            <p>لا توجد أدوار</p>
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
                      <Shield size={16} />
                      <span>{role.name}</span>
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
                        {canView && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewPermissions(role)}
                            title="عرض الصلاحيات"
                          >
                            <Eye size={16} />
                          </Button>
                        )}
                        {canModify && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(role)}
                            title="تعديل"
                          >
                            <Settings size={16} />
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

        {/* Role Form Modal */}
        <RoleForm
          isVisible={showRoleForm}
          onClose={() => {
            setShowRoleForm(false);
            setSelectedRole(null);
          }}
          initialData={selectedRole}
          mode={formMode}
        />

        {/* Permission Matrix Modal - TODO: Implement */}
        {showPermissionMatrix && selectedRoleWithPermissions && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>صلاحيات الدور: {selectedRoleWithPermissions.name}</h2>
              <p>مصفوفة الصلاحيات قيد التطوير...</p>

              {/* Display current permissions */}
              <div className={styles.permissionsPreview}>
                <h3>الصلاحيات الحالية:</h3>
                <pre>
                  {JSON.stringify(selectedRoleWithPermissions.featurePermissionsObject, null, 2)}
                </pre>
              </div>

              <Button onClick={() => setShowPermissionMatrix(false)} variant="secondary">
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};