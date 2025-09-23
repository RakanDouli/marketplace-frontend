'use client';

import React, { useEffect, useState } from 'react';
import { Container } from '@/components/slices/Container/Container';
import { Button } from '@/components/slices/Button/Button';
import { useAdminUsersStore } from '@/stores/admin';
import type { TableAction } from '@/stores/admin/adminUsersStore';
import { DataTable, Pagination } from '@/components/slices';
import UserForm from '../../UserManagement/UserForm';
import PasswordResetModal from '../../UserManagement/PasswordResetModal';
import { useFeaturePermissions } from '@/hooks/usePermissions';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';
import styles from './UsersCRUD.module.scss';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string; // "pending" | "active" | "banned"
  accountType: string;
  sellerBadge: string | null;
  businessVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UsersDashboardPanel: React.FC = () => {
  const {
    users,
    loading,
    error,
    selectedUser,
    pagination,
    filters,
    sortBy,
    sortOrder,
    tableConfig,
    loadUsers,
    loadUsersPaginated,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    setSelectedUser,
    setFilters,
    setSorting,
    clearError
  } = useAdminUsersStore();

  const { canView, canCreate, canModify, canDelete } = useFeaturePermissions('users');

  const [showUserForm, setShowUserForm] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
  const handleAction = (actionKey: string, user: User) => {
    switch (actionKey) {
      case 'edit':
        setSelectedUser(user);
        setFormMode('edit');
        setShowUserForm(true);
        break;
      case 'reset-password':
        setUserToReset(user);
        setShowPasswordReset(true);
        break;
      case 'delete':
        deleteUser(user.id);
        break;
      default:
        console.warn('Unknown action:', actionKey);
    }
  };

  // Render functions for specific column types
  const getColumnRender = (key: string) => {
    switch (key) {
      case 'role':
        return (value: any) => {
          const roleLabels: Record<string, string> = {
            'user': 'مستخدم',
            'editor': 'محرر',
            'ads_manager': 'مدير إعلانات',
            'admin': 'مدير',
            'super_admin': 'مدير عام'
          };
          return (
            <span className={`${styles.roleBadge} ${styles[value?.toLowerCase() || 'user']}`}>
              {roleLabels[value] || value}
            </span>
          );
        };
      case 'accountType':
        return (value: any) => {
          const typeLabels: Record<string, string> = {
            'individual': 'فردي',
            'dealer': 'تاجر',
            'business': 'شركة'
          };
          return typeLabels[value] || value;
        };
      case 'status':
        return (value: any) => {
          const statusLabels: Record<string, string> = {
            'active': 'نشط',
            'pending': 'معلق',
            'banned': 'محظور'
          };
          const statusClass = value === 'active' ? styles.active :
            value === 'pending' ? styles.pending : styles.banned;
          return (
            <span className={`${styles.statusBadge} ${statusClass}`}>
              {statusLabels[value] || value}
            </span>
          );
        };
      case 'sellerBadge':
        return (value: any) => value || '-';
      default:
        return undefined;
    }
  };

  // Auto-generate columns from the first user object
  const columns = React.useMemo(() => {
    if (!users || users.length === 0) return [];

    const firstUser = users[0];
    const excludedFields = ['id', 'authUserId', 'password']; // Fields to hide

    return Object.keys(firstUser)
      .filter(key => !excludedFields.includes(key))
      .map(key => ({
        key,
        label: key, // Could be improved with translation
        type: inferColumnType(key, firstUser[key]),
        render: getColumnRender(key)
      }));
  }, [users]);

  // Auto-generate actions based on permissions
  const actions = React.useMemo(() => {
    const availableActions = [];

    if (canModify) {
      availableActions.push({
        key: 'edit',
        label: 'تعديل',
        variant: 'secondary' as const,
        onClick: (user: User) => handleAction('edit', user),
        isVisible: () => true
      });

      availableActions.push({
        key: 'reset-password',
        label: 'إعادة تعيين كلمة المرور',
        variant: 'warning' as const,
        onClick: (user: User) => handleAction('reset-password', user),
        isVisible: () => true
      });
    }

    if (canDelete) {
      availableActions.push({
        key: 'delete',
        label: 'حذف',
        variant: 'danger' as const,
        onClick: (user: User) => handleAction('delete', user),
        requiresConfirmation: true,
        confirmationMessage: 'هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.',
        isVisible: (user: User) => user.role !== 'SUPER_ADMIN'
      });
    }

    return availableActions;
  }, [canModify, canDelete]);

  // Infer column type from key name and value
  const inferColumnType = (key: string, value: any) => {
    if (key.includes('email') || key.includes('Email')) return 'email';
    if (key.includes('date') || key.includes('At') || value instanceof Date) return 'date';
    if (key === 'role' || key === 'status') return 'badge';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    return 'text';
  };

  // Handle form submission
  const handleFormSubmit = async (userData: any) => {
    if (formMode === 'create') {
      await createUser(userData);
    } else {
      await updateUser(userData);
    }
  };

  // Handle password reset
  const handlePasswordReset = async (newPassword: string) => {
    if (userToReset) {
      await resetUserPassword(userToReset.id, newPassword);
    }
  };

  // Handle create new user
  const handleCreateUser = () => {
    setSelectedUser(null);
    setFormMode('create');
    setShowUserForm(true);
  };

  return (
    <>
      <div className={styles.usersCRUD}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>إدارة المستخدمين</h1>
            <p className={styles.description}>
              إدارة وتحكم في جميع مستخدمي النظام
            </p>
          </div>
          <div className={styles.headerActions}>
            {canCreate && (
              <Button
                onClick={handleCreateUser}
                variant="primary"
                icon={<Plus size={16} />}
              >

                إضافة مستخدم جديد
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

        {/* Controls */}
        <div className={styles.searchSection}>
          <div className={styles.searchRow}>
            <input
              type="text"
              placeholder="البحث بالاسم أو البريد الإلكتروني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const newFilters = {
                    search: searchTerm || undefined,
                    role: roleFilter || undefined,
                    status: statusFilter || undefined
                  };
                  setFilters(newFilters);
                  loadUsersPaginated({ page: 1, limit: pagination.limit, sortBy, sortOrder }, newFilters);
                }
              }}
              className={styles.searchInput}
            />
            <div className={styles.userCount}>
              {pagination.total} مستخدم
            </div>
          </div>

          {/* Filter Controls */}
          <div className={styles.controlsRow}>
            <div className={styles.filterDropdowns}>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  const newFilters = {
                    search: searchTerm || undefined,
                    role: e.target.value || undefined,
                    status: statusFilter || undefined
                  };
                  setFilters(newFilters);
                  loadUsersPaginated({ page: 1, limit: pagination.limit, sortBy, sortOrder }, newFilters);
                }}
                className={styles.filterSelect}
              >
                <option value="">جميع الأدوار</option>
                <option value="user">مستخدم</option>
                <option value="editor">محرر</option>
                <option value="ads_manager">مدير إعلانات</option>
                <option value="admin">مدير</option>
                <option value="super_admin">مدير عام</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  const newFilters = {
                    search: searchTerm || undefined,
                    role: roleFilter || undefined,
                    status: e.target.value || undefined
                  };
                  setFilters(newFilters);
                  loadUsersPaginated({ page: 1, limit: pagination.limit, sortBy, sortOrder }, newFilters);
                }}
                className={styles.filterSelect}
              >
                <option value="">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="pending">معلق</option>
                <option value="banned">محظور</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <DataTable
          data={users}
          columns={columns}
          actions={actions}
          isLoading={loading}
          emptyMessage="لا يوجد مستخدمون"
        />

        {/* Pagination Controls */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => loadUsers(page)}
        />

        {/* User Form Modal */}
        <UserForm
          isVisible={showUserForm}
          onClose={() => {
            setShowUserForm(false);
            setSelectedUser(null);
          }}
          onSubmit={handleFormSubmit}
          initialData={selectedUser}
          isLoading={loading}
          mode={formMode}
        />

        {/* Password Reset Modal */}
        <PasswordResetModal
          isVisible={showPasswordReset}
          onClose={() => {
            setShowPasswordReset(false);
            setUserToReset(null);
          }}
          onSubmit={handlePasswordReset}
          userEmail={userToReset?.email || ''}
          isLoading={loading}
        />
      </div>
    </>
  );
};