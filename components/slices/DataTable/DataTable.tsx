'use client';

import React, { useState, useMemo } from 'react';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import useAdminModulesStore from '@/stores/adminModulesStore';
import { Button, Loading } from '@/components/slices';
import { ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import type { ColumnConfig } from '@/lib/admin/types';
import styles from './DataTable.module.scss';

interface DataTableProps {
  moduleKey: string;
  data: any[];
  isLoading?: boolean;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    onPageChange: (page: number) => void;
  };
  onRefresh?: () => void;
  onRowAction?: (action: string, row: any) => void;
  onBulkAction?: (action: string, selectedRows: any[]) => void;
}

export function DataTable({
  moduleKey,
  data,
  isLoading = false,
  pagination,
  onRefresh,
  onRowAction,
  onBulkAction
}: DataTableProps) {
  const { user, hasAnyPermission } = useAdminAuthStore();
  const { getAvailableModules } = useAdminModulesStore();
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  // Get module configuration
  const module = useMemo(() => {
    if (!user) return null;
    const availableModules = getAvailableModules(user.role, user.permissions);
    return availableModules.find((m: any) => m.key === moduleKey);
  }, [moduleKey, user, getAvailableModules]);

  // Get visible columns based on permissions
  const visibleColumns = useMemo(() => {
    if (!module?.config?.listColumns || !user) return [];

    return module.config.listColumns.filter((column: ColumnConfig) => {
      // Always show basic columns
      if (['id', 'createdAt', 'updatedAt'].includes(column.key)) return true;

      // Check field-level permissions
      const hasFieldPermission = hasAnyPermission([
        `${moduleKey}.read.*`,
        `${moduleKey}.read.${column.key}`,
        `${moduleKey}.manage`
      ]);

      return hasFieldPermission;
    });
  }, [module, user, moduleKey, hasAnyPermission]);

  // Get available actions based on permissions
  const availableActions = useMemo(() => {
    if (!module?.config?.customActions || !user) return [];

    return module.config.customActions.filter((action: any) => {
      const hasActionPermission = hasAnyPermission([
        `${moduleKey}.${action.key}`,
        `${moduleKey}.manage`,
        `${moduleKey}.actions.*`
      ]);

      return hasActionPermission;
    });
  }, [module, user, moduleKey, hasAnyPermission]);

  // Get bulk actions based on permissions
  const bulkActions = useMemo(() => {
    if (!module?.config?.bulkActions || !user) return [];

    return module.config.bulkActions.filter((action: any) => {
      const hasBulkPermission = hasAnyPermission([
        `${moduleKey}.bulk.${action.key}`,
        `${moduleKey}.manage`,
        `${moduleKey}.bulk.*`
      ]);

      return hasBulkPermission;
    });
  }, [module, user, moduleKey, hasAnyPermission]);

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(columnKey);
      setSortOrder('ASC');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows([...data]);
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (row: any, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, row]);
    } else {
      setSelectedRows(selectedRows.filter(r => r.id !== row.id));
    }
  };

  const handleBulkAction = (actionKey: string) => {
    if (selectedRows.length === 0) return;

    const action = bulkActions.find((a: any) => a.key === actionKey);
    if (action?.requiresConfirmation) {
      const message = action.confirmationMessageAr || action.confirmationMessage || `هل أنت متأكد من ${action.labelAr || action.label}؟`;
      if (!confirm(message)) return;
    }

    onBulkAction?.(actionKey, selectedRows);
    setSelectedRows([]);
  };

  const formatCellValue = (value: any, column: ColumnConfig) => {
    if (value === null || value === undefined) {
      return <span className={styles.emptyValue}>-</span>;
    }

    switch (column.type) {
      case 'boolean':
        return (
          <span className={`${styles.badge} ${value ? styles.badgeSuccess : styles.badgeError}`}>
            {value ? 'نعم' : 'لا'}
          </span>
        );

      case 'date':
        return new Date(value).toLocaleDateString('ar-SY', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

      case 'currency':
        return new Intl.NumberFormat('ar-SY', {
          style: 'currency',
          currency: 'SYP'
        }).format(value / 100);

      case 'enum':
        return (
          <span className={`${styles.badge} ${styles.badgeInfo}`}>
            {value}
          </span>
        );

      case 'relation':
        if (column.key.includes('.')) {
          const keys = column.key.split('.');
          let nestedValue = value;
          for (const key of keys.slice(1)) {
            nestedValue = nestedValue?.[key];
          }
          return nestedValue || '-';
        }
        return value;

      default:
        return String(value);
    }
  };

  const getCellValue = (row: any, column: ColumnConfig) => {
    if (column.key.includes('.')) {
      const keys = column.key.split('.');
      let value = row;
      for (const key of keys) {
        value = value?.[key];
      }
      return value;
    }
    return row[column.key];
  };

  if (!module) {
    return (
      <div className={styles.emptyState}>
        <p>وحدة غير موجودة أو غير مسموح الوصول إليها</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Table Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <h3 className={styles.title}>
              {module.nameAr || module.name}
            </h3>

            {/* Bulk Actions */}
            {selectedRows.length > 0 && bulkActions.length > 0 && (
              <div className={styles.bulkActions}>
                <span className={styles.selectionCount}>
                  {selectedRows.length} محدد
                </span>
                {bulkActions.map((action: any) => (
                  <Button
                    key={action.key}
                    variant={action.variant === 'danger' ? 'danger' : action.variant === 'warning' ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => handleBulkAction(action.key)}
                  >
                    {action.labelAr || action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={16} />}
              onClick={onRefresh}
            >
              تحديث
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table} dir="rtl">
          <thead className={styles.thead}>
            <tr>
              {/* Select All Checkbox */}
              {bulkActions.length > 0 && (
                <th className={styles.checkboxHeader}>
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className={styles.checkbox}
                  />
                </th>
              )}

              {/* Column Headers */}
              {visibleColumns.map((column: ColumnConfig) => (
                <th key={column.key} className={styles.th}>
                  <div className={styles.thContent}>
                    <span>{column.labelAr || column.label}</span>
                    {column.sortable && (
                      <button
                        onClick={() => handleSort(column.key)}
                        className={styles.sortButton}
                      >
                        {sortBy === column.key ? (
                          sortOrder === 'ASC' ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )
                        ) : (
                          <div className={styles.sortIcons}>
                            <ChevronUp size={12} />
                            <ChevronDown size={12} />
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}

              {/* Actions Column */}
              {availableActions.length > 0 && (
                <th className={styles.th}>
                  الإجراءات
                </th>
              )}
            </tr>
          </thead>

          <tbody className={styles.tbody}>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (bulkActions.length > 0 ? 1 : 0) + (availableActions.length > 0 ? 1 : 0)}
                  className={styles.emptyCell}
                >
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={row.id || index} className={styles.tr}>
                  {/* Select Row Checkbox */}
                  {bulkActions.length > 0 && (
                    <td className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={selectedRows.some(r => r.id === row.id)}
                        onChange={(e) => handleSelectRow(row, e.target.checked)}
                        className={styles.checkbox}
                      />
                    </td>
                  )}

                  {/* Data Cells */}
                  {visibleColumns.map((column: ColumnConfig) => (
                    <td key={column.key} className={styles.td}>
                      {formatCellValue(getCellValue(row, column), column)}
                    </td>
                  ))}

                  {/* Action Buttons */}
                  {availableActions.length > 0 && (
                    <td className={styles.actionsCell}>
                      <div className={styles.actions}>
                        {availableActions.map((action: any) => (
                          <Button
                            key={action.key}
                            variant={action.variant === 'danger' ? 'danger' : action.variant === 'warning' ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => onRowAction?.(action.key, row)}
                          >
                            {action.labelAr || action.label}
                          </Button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            عرض {data.length} من {pagination.total} عنصر
          </div>

          <div className={styles.paginationControls}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              السابق
            </Button>

            <span className={styles.pageInfo}>
              صفحة {pagination.page} من {Math.ceil(pagination.total / pagination.limit)}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;