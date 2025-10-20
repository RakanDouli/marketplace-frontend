'use client';

import React, { useEffect, useState } from 'react';
import { Button, Loading, Text } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { useAdminUsersStore } from '@/stores/admin';
import { Table, TableHead, TableBody, TableRow, TableCell, Pagination } from '@/components/slices';
import { CreateUserModal, EditUserModal, DeleteUserModal } from './modals';
import { useFeaturePermissions } from '@/hooks/usePermissions';
import { useNotificationStore } from '@/stores/notificationStore';
import { Plus, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { invalidateGraphQLCache } from '@/utils/graphql-cache';
import { useMetadataStore } from '@/stores/metadataStore';
import { USER_STATUS_LABELS, ACCOUNT_TYPE_LABELS, mapToOptions, getLabel } from '@/constants/metadata-labels';
import styles from '../SharedDashboardPanel.module.scss';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string; // "pending" | "active" | "banned"
  accountType: string;
  accountBadge: string | null;
  businessVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const UsersDashboardPanel: React.FC = () => {
  const {
    users,
    roles,
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
    loadUsersWithCache,
    loadRoles,
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
  const { addNotification } = useNotificationStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    // Invalidate users cache on mount to ensure fresh data
    invalidateGraphQLCache('usersSearch');
    invalidateGraphQLCache('usersCount');
    loadUsersWithCache();
    loadRoles();
  }, [loadUsersWithCache, loadRoles]);

  useEffect(() => {
    if (error) {
      // Show error notification using toast system
      addNotification({
        type: 'error',
        title: 'خطأ في إدارة المستخدمين',
        message: error,
        duration: 5000
      });
      // Clear error from store
      clearError();
    }
  }, [error, clearError, addNotification]);

  // Fetch metadata on mount
  const { userStatuses } = useMetadataStore();

  useEffect(() => {
    const metadataStore = useMetadataStore.getState();
    if (userStatuses.length === 0) {
      metadataStore.fetchUserMetadata();
    }
  }, [userStatuses.length]);

  // Simple helper functions for display (now using metadata-labels.ts)
  const getRoleLabel = (role: string) => {
    // Try to find role by case-insensitive match (since backend uses lowercase enum)
    const roleObj = roles.find(r => r.name.toLowerCase() === role.toLowerCase());
    return roleObj ? roleObj.name : role.toUpperCase();
  };

  // Action handlers for new modal structure
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };


  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Handle create new user
  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowCreateModal(true);
  };

  // Handle create form submission
  const handleCreateSubmit = async (userData: any) => {
    try {
      await createUser(userData);
      addNotification({
        type: 'success',
        title: 'تم إنشاء المستخدم بنجاح',
        message: `تم إنشاء المستخدم ${userData.name} بنجاح`,
        duration: 3000
      });
      setShowCreateModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Create user error:', error);
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (userData: any) => {
    try {
      await updateUser(userData);
      addNotification({
        type: 'success',
        title: 'تم تحديث المستخدم بنجاح',
        message: 'تم حفظ التغييرات بنجاح',
        duration: 3000
      });
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete.id);
        addNotification({
          type: 'success',
          title: 'تم حذف المستخدم بنجاح',
          message: `تم حذف المستخدم ${userToDelete.name} بنجاح`,
          duration: 3000
        });
        setShowDeleteModal(false);
        setUserToDelete(null);
      } catch (error) {
        console.error('Delete user error:', error);
      }
    }
  };

  return (
    <>
      <div className={styles.dashboardPanel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Text variant="h2" className={styles.title}>إدارة المستخدمين</Text>
            <Text variant="paragraph" color="secondary" className={styles.description}>
              إدارة وتحكم في جميع مستخدمي النظام
            </Text>
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


        {/* Controls */}
        <div className={styles.searchSection}>
          <div className={styles.searchRow}>
            <Text variant="small" className={styles.userCount}>
              النتيحه: {pagination.total}
            </Text>
            <Input
              type="search"
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
                  loadUsersWithCache(1, true); // Force refresh when filters change
                }
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
                  search: searchTerm || undefined,
                  role: e.target.value || undefined,
                  status: statusFilter || undefined
                };
                setFilters(newFilters);
                loadUsersWithCache(1, true); // Force refresh when filters change
              }}
              options={[
                { value: "", label: "جميع الأدوار" },
                ...roles.map(role => ({
                  value: role.name,
                  label: role.name
                }))
              ]}
            />

            <Input
              type="select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                const newFilters = {
                  search: searchTerm || undefined,
                  role: roleFilter || undefined,
                  status: e.target.value || undefined
                };
                setFilters(newFilters);
                loadUsersWithCache(1, true); // Force refresh when filters change
              }}
              options={[
                { value: "", label: "جميع الحالات" },
                ...mapToOptions(userStatuses, USER_STATUS_LABELS)
              ]}
            />

          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <Loading type='svg' />
            <Text variant="paragraph">جاري تحميل المستخدمين...</Text>
          </div>
        ) : users.length === 0 ? (
          <div className={styles.emptyState}>
            <Text variant="h3">لا يوجد مستخدمون</Text>
            <Text variant="paragraph" color="secondary">لم يتم العثور على مستخدمين</Text>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>الاسم</TableCell>
                <TableCell isHeader>البريد الإلكتروني</TableCell>
                <TableCell isHeader>الدور</TableCell>
                <TableCell isHeader>الحالة</TableCell>
                <TableCell isHeader>نوع الحساب</TableCell>
                {(canModify || canDelete) && <TableCell isHeader>الإجراءات</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleLabel(user.role)}</TableCell>
                  <TableCell>{getLabel(user.status, USER_STATUS_LABELS)}</TableCell>
                  <TableCell>{getLabel(user.accountType, ACCOUNT_TYPE_LABELS)}</TableCell>
                  {(canModify || canDelete) && (
                    <TableCell>
                      <div className={styles.actions}>
                        {canModify && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            title="تعديل"
                          >
                            <Edit size={16} />
                          </Button>
                        )}
                        {canDelete && user.role !== 'SUPER_ADMIN' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(user)}
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

        {/* Pagination Controls */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => loadUsersWithCache(page, true)}
        />

        {/* Create User Modal */}
        <CreateUserModal
          isVisible={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleCreateSubmit}
          roles={roles}
          isLoading={loading}
        />

        {/* Edit User Modal */}
        <EditUserModal
          isVisible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleEditSubmit}
          onResetPassword={async (userId: string) => {
            await resetUserPassword(userId);
          }}
          initialData={selectedUser}
          isLoading={loading}
        />

        {/* Delete User Modal */}
        <DeleteUserModal
          isVisible={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          user={userToDelete}
          isLoading={loading}
        />
      </div>
    </>
  );
};