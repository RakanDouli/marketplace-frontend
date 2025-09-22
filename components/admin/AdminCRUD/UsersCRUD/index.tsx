'use client';

import React, { useEffect, useState } from 'react';
import { Container } from '@/components/slices/Container/Container';
import { Button } from '@/components/slices/Button/Button';
import { useAdminUsersStore } from '@/stores/admin';
import { EnhancedDataTable, TableColumn, TableAction } from '../../EnhancedDataTable/EnhancedDataTable';
import UserForm from '../../UserManagement/UserForm';
import PasswordResetModal from '../../UserManagement/PasswordResetModal';
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

export const UsersCRUD: React.FC = () => {
  const {
    users,
    loading,
    error,
    selectedUser,
    pagination,
    filters,
    sortBy,
    sortOrder,
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

  // Table columns configuration
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Name',
      labelAr: 'الاسم',
      type: 'text',
      sortable: true,
      searchable: true,
      width: '200px'
    },
    {
      key: 'email',
      label: 'Email',
      labelAr: 'البريد الإلكتروني',
      type: 'email',
      sortable: true,
      searchable: true,
      width: '250px'
    },
    {
      key: 'role',
      label: 'Role',
      labelAr: 'الدور',
      type: 'badge',
      sortable: true,
      width: '120px',
      render: (value) => {
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
      }
    },
    {
      key: 'accountType',
      label: 'Account Type',
      labelAr: 'نوع الحساب',
      type: 'text',
      sortable: true,
      width: '120px',
      render: (value) => {
        const typeLabels: Record<string, string> = {
          'individual': 'فردي',
          'dealer': 'تاجر',
          'business': 'شركة'
        };
        return typeLabels[value] || value;
      }
    },
    {
      key: 'status',
      label: 'Status',
      labelAr: 'الحالة',
      type: 'text',
      sortable: true,
      width: '100px',
      render: (value) => {
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
      }
    },
    {
      key: 'sellerBadge',
      label: 'Seller Badge',
      labelAr: 'شارة البائع',
      type: 'text',
      width: '120px',
      render: (value) => value || '-'
    },
    {
      key: 'createdAt',
      label: 'Created At',
      labelAr: 'تاريخ الإنشاء',
      type: 'date',
      sortable: true,
      width: '150px'
    }
  ];

  // Table actions configuration
  const actions: TableAction[] = [
    {
      key: 'edit',
      label: 'Edit',
      labelAr: 'تعديل',
      variant: 'secondary',
      onClick: (user: User) => {
        setSelectedUser(user);
        setFormMode('edit');
        setShowUserForm(true);
      }
    },
    {
      key: 'reset-password',
      label: 'Reset Password',
      labelAr: 'إعادة تعيين كلمة المرور',
      variant: 'warning',
      onClick: (user: User) => {
        setUserToReset(user);
        setShowPasswordReset(true);
      },
      requiresConfirmation: false
    },
    {
      key: 'delete',
      label: 'Delete',
      labelAr: 'حذف',
      variant: 'danger',
      onClick: async (user: User) => {
        await deleteUser(user.id);
      },
      requiresConfirmation: true,
      confirmationMessage: 'هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.',
      isVisible: (user: User) => user.role !== 'SUPER_ADMIN' // Can't delete super admin
    }
  ];

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
    <Container>
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
            <Button
              onClick={handleCreateUser}
              variant="primary"
            >
              <Plus size={16} />
              إضافة مستخدم جديد
            </Button>
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

        {/* Search and User Count */}
        <div className={styles.searchSection}>
          <div className={styles.searchRow}>
            <input
              type="text"
              placeholder="البحث بالاسم أو البريد الإلكتروني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
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

          {/* Sort and Filter Controls */}
          <div className={styles.controlsRow}>
            <div className={styles.sortButtons}>
              <span className={styles.sortLabel}>ترتيب حسب:</span>
              <Button
                onClick={() => {
                  setSorting('name', sortBy === 'name' && sortOrder === 'ASC' ? 'DESC' : 'ASC');
                  loadUsersPaginated({ page: pagination.page, limit: pagination.limit, sortBy: 'name', sortOrder: sortBy === 'name' && sortOrder === 'ASC' ? 'DESC' : 'ASC' }, filters);
                }}
                variant={sortBy === 'name' ? 'primary' : 'secondary'}
                size="sm"
              >
                الاسم {sortBy === 'name' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </Button>
              <Button
                onClick={() => {
                  setSorting('role', sortBy === 'role' && sortOrder === 'ASC' ? 'DESC' : 'ASC');
                  loadUsersPaginated({ page: pagination.page, limit: pagination.limit, sortBy: 'role', sortOrder: sortBy === 'role' && sortOrder === 'ASC' ? 'DESC' : 'ASC' }, filters);
                }}
                variant={sortBy === 'role' ? 'primary' : 'secondary'}
                size="sm"
              >
                الدور {sortBy === 'role' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </Button>
              <Button
                onClick={() => {
                  setSorting('status', sortBy === 'status' && sortOrder === 'ASC' ? 'DESC' : 'ASC');
                  loadUsersPaginated({ page: pagination.page, limit: pagination.limit, sortBy: 'status', sortOrder: sortBy === 'status' && sortOrder === 'ASC' ? 'DESC' : 'ASC' }, filters);
                }}
                variant={sortBy === 'status' ? 'primary' : 'secondary'}
                size="sm"
              >
                الحالة {sortBy === 'status' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </Button>
              <Button
                onClick={() => {
                  setSorting('createdAt', sortBy === 'createdAt' && sortOrder === 'ASC' ? 'DESC' : 'ASC');
                  loadUsersPaginated({ page: pagination.page, limit: pagination.limit, sortBy: 'createdAt', sortOrder: sortBy === 'createdAt' && sortOrder === 'ASC' ? 'DESC' : 'ASC' }, filters);
                }}
                variant={sortBy === 'createdAt' ? 'primary' : 'secondary'}
                size="sm"
              >
                تاريخ الإنشاء {sortBy === 'createdAt' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </Button>
            </div>

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
        <EnhancedDataTable
          data={users}
          columns={columns}
          actions={actions}
          isLoading={loading}
          onRefresh={loadUsers}
          searchable={false}
          filterable={false}
          title="المستخدمون"
          emptyMessage="لا يوجد مستخدمون"
        />

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className={styles.paginationContainer}>
            <div className={styles.paginationControls}>
              <Button
                onClick={() => loadUsers(pagination.page - 1)}
                disabled={!pagination.hasPrev || loading}
                variant="secondary"
                size="sm"
              >
                السابقة
              </Button>
              <span className={styles.pageNumber}>
                {pagination.page}
              </span>
              <Button
                onClick={() => loadUsers(pagination.page + 1)}
                disabled={!pagination.hasNext || loading}
                variant="secondary"
                size="sm"
              >
                التالية
              </Button>
              <span className={styles.pageInfo}>
                من {pagination.totalPages}
              </span>
            </div>
          </div>
        )}

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
    </Container>
  );
};