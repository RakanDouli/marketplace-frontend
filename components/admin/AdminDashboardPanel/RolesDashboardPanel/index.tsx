'use client';

import React, { useEffect, useState } from 'react';
import { Container } from '@/components/slices/Container/Container';
import { Button } from '@/components/slices/Button/Button';
import { useAdminRolesStore } from '@/stores/admin/adminRolesStore';
import type { Role, RoleWithPermissions } from '@/stores/admin/adminRolesStore';
import { DataTable } from '@/components/slices';
import { useFeaturePermissions } from '@/hooks/usePermissions';
import { Plus, RefreshCw, AlertCircle, Shield, Users, Eye, Settings } from 'lucide-react';
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

  // Action handlers for different action types
  const handleAction = async (actionKey: string, role: Role) => {
    switch (actionKey) {
      case 'edit':
        setSelectedRole(role);
        setFormMode('edit');
        setShowRoleForm(true);
        break;
      case 'permissions':
        const roleWithPermissions = await loadRoleWithPermissions(role.id);
        if (roleWithPermissions) {
          setSelectedRoleWithPermissions(roleWithPermissions);
          setShowPermissionMatrix(true);
        }
        break;
      case 'delete':
        if (confirm('هل أنت متأكد من حذف هذا الدور؟ لا يمكن التراجع عن هذا الإجراء.')) {
          await deleteRole(role.id);
        }
        break;
      default:
        console.warn('Unknown action:', actionKey);
    }
  };

  // Render functions for specific column types
  const getColumnRender = (key: string) => {
    switch (key) {
      case 'priority':
        return (value: any) => {
          const priorityLabels: Record<number, string> = {
            0: 'أعلى صلاحية', // SUPER_ADMIN
            1: 'صلاحية مخصصة',
            2: 'صلاحية منخفضة'
          };
          return priorityLabels[value] || `أولوية ${value}`;
        };
      case 'isActive':
        return (value: any) => (
          <span className={`${styles.statusBadge} ${value ? styles.active : styles.inactive}`}>
            {value ? 'نشط' : 'غير نشط'}
          </span>
        );
      case 'name':
        return (value: any) => (
          <div className={styles.roleName}>
            <Shield size={16} />
            <span>{value}</span>
          </div>
        );
      default:
        return undefined;
    }
  };

  // Auto-generate columns from the first role object
  const columns = React.useMemo(() => {
    if (!roles || roles.length === 0) return [];

    return [
      {
        key: 'name',
        label: 'اسم الدور',
        type: 'text',
        render: getColumnRender('name')
      },
      {
        key: 'description',
        label: 'الوصف',
        type: 'text'
      },
      {
        key: 'priority',
        label: 'مستوى الأولوية',
        type: 'text',
        render: getColumnRender('priority')
      },
      {
        key: 'isActive',
        label: 'الحالة',
        type: 'boolean',
        render: getColumnRender('isActive')
      }
    ];
  }, [roles]);

  // Auto-generate actions based on permissions
  const actions = React.useMemo(() => {
    const availableActions = [];

    if (canView) {
      availableActions.push({
        key: 'permissions',
        label: 'عرض الصلاحيات',
        variant: 'secondary' as const,
        icon: <Eye size={16} />,
        onClick: (role: Role) => handleAction('permissions', role),
        isVisible: () => true
      });
    }

    if (canModify) {
      availableActions.push({
        key: 'edit',
        label: 'تعديل',
        variant: 'secondary' as const,
        icon: <Settings size={16} />,
        onClick: (role: Role) => handleAction('edit', role),
        isVisible: () => true
      });
    }

    if (canDelete) {
      availableActions.push({
        key: 'delete',
        label: 'حذف',
        variant: 'danger' as const,
        onClick: (role: Role) => handleAction('delete', role),
        requiresConfirmation: true,
        confirmationMessage: 'هل أنت متأكد من حذف هذا الدور؟ لا يمكن التراجع عن هذا الإجراء.',
        isVisible: (role: Role) => role.name !== 'SUPER_ADMIN'
      });
    }

    return availableActions;
  }, [canView, canModify, canDelete]);

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
        <DataTable
          data={roles}
          columns={columns}
          actions={actions}
          isLoading={loading}
          emptyMessage="لا توجد أدوار"
        />

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