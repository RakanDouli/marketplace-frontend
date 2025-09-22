'use client';

import React, { useState } from 'react';
import { Button } from '@/components/slices';
import { Modal } from '@/components/slices';
import {
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Key,
  UserX,
  UserCheck
} from 'lucide-react';
import styles from './EnhancedDataTable.module.scss';

export interface TableColumn {
  key: string;
  label: string;
  labelAr?: string;
  type?: 'text' | 'email' | 'date' | 'boolean' | 'badge' | 'currency' | 'number';
  sortable?: boolean;
  searchable?: boolean;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface TableAction {
  key: string;
  label: string;
  labelAr?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
  onClick: (row: any) => void;
  isVisible?: (row: any) => boolean;
  isDisabled?: (row: any) => boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface EnhancedDataTableProps {
  data: any[];
  columns: TableColumn[];
  actions?: TableAction[];
  isLoading?: boolean;
  onRefresh?: () => void;
  searchable?: boolean;
  filterable?: boolean;
  title?: string;
  titleAr?: string;
  emptyMessage?: string;
  emptyMessageAr?: string;
}

const formatValue = (value: any, type?: string) => {
  if (value === null || value === undefined) return '-';

  switch (type) {
    case 'boolean':
      return value ? 'نعم' : 'لا';
    case 'date':
      return new Date(value).toLocaleDateString('ar-SA');
    case 'email':
      return value;
    case 'currency':
      return `$${Number(value).toLocaleString()}`;
    case 'badge':
      return <span className={styles.badge}>{value}</span>;
    default:
      return value?.toString() || '-';
  }
};

const getActionIcon = (key: string) => {
  const icons: Record<string, React.ReactNode> = {
    'edit': <Edit size={16} />,
    'delete': <Trash2 size={16} />,
    'view': <Eye size={16} />,
    'reset-password': <Key size={16} />,
    'activate': <UserCheck size={16} />,
    'deactivate': <UserX size={16} />,
  };
  return icons[key] || <MoreVertical size={16} />;
};

export function EnhancedDataTable({
  data,
  columns,
  actions = [],
  isLoading = false,
  onRefresh,
  searchable = true,
  filterable = false,
  title = 'البيانات',
  titleAr,
  emptyMessage = 'لا توجد بيانات',
  emptyMessageAr
}: EnhancedDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [confirmAction, setConfirmAction] = useState<{ action: TableAction; row: any } | null>(null);

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;

    const searchableColumns = columns.filter(col => col.searchable !== false);

    return data.filter(row =>
      searchableColumns.some(col =>
        String(row[col.key]).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleActionClick = (action: TableAction, row: any) => {
    if (action.requiresConfirmation) {
      setConfirmAction({ action, row });
    } else {
      action.onClick(row);
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction) {
      confirmAction.action.onClick(confirmAction.row);
      setConfirmAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <RefreshCw className={styles.spinner} size={24} />
          <span>جاري التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>{titleAr || title}</h2>
        <div className={styles.headerActions}>
          {onRefresh && (
            <Button onClick={onRefresh} variant="secondary" size="small">
              <RefreshCw size={16} />
              تحديث
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      {(searchable || filterable) && (
        <div className={styles.controls}>
          {searchable && (
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="البحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          )}
          {filterable && (
            <Button variant="secondary" size="small">
              <Filter size={16} />
              فلترة
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      {sortedData.length === 0 ? (
        <div className={styles.empty}>
          <p>{emptyMessageAr || emptyMessage}</p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="secondary">
              <RefreshCw size={16} />
              تحديث
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map(column => (
                  <th
                    key={column.key}
                    className={column.sortable ? styles.sortable : ''}
                    style={{ width: column.width }}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className={styles.headerCell}>
                      <span>{column.labelAr || column.label}</span>
                      {column.sortable && (
                        <div className={styles.sortIcons}>
                          <ChevronUp
                            size={12}
                            className={
                              sortColumn === column.key && sortDirection === 'asc'
                                ? styles.activeSortIcon
                                : styles.sortIcon
                            }
                          />
                          <ChevronDown
                            size={12}
                            className={
                              sortColumn === column.key && sortDirection === 'desc'
                                ? styles.activeSortIcon
                                : styles.sortIcon
                            }
                          />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className={styles.actionsHeader}>الإجراءات</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, index) => (
                <tr key={row.id || index} className={styles.tableRow}>
                  {columns.map(column => (
                    <td key={column.key} className={styles.tableCell}>
                      {column.render
                        ? column.render(row[column.key], row)
                        : formatValue(row[column.key], column.type)
                      }
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className={styles.actionsCell}>
                      <div className={styles.actions}>
                        {actions
                          .filter(action => !action.isVisible || action.isVisible(row))
                          .map(action => (
                            <Button
                              key={action.key}
                              onClick={() => handleActionClick(action, row)}
                              variant={action.variant === 'warning' ? 'outline' : action.variant || 'secondary'}
                              size="sm"
                              disabled={action.isDisabled ? action.isDisabled(row) : false}
                              title={action.labelAr || action.label}
                            >
                              {action.icon || getActionIcon(action.key)}
                            </Button>
                          ))
                        }
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <Modal
          isVisible={true}
          onClose={() => setConfirmAction(null)}
          title="تأكيد الإجراء"
          maxWidth="sm"
        >
          <div className={styles.confirmationModal}>
            <p>{confirmAction.action.confirmationMessage || 'هل أنت متأكد من هذا الإجراء؟'}</p>
            <div className={styles.confirmationActions}>
              <Button
                onClick={() => setConfirmAction(null)}
                variant="secondary"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleConfirmAction}
                variant={confirmAction.action.variant || 'primary'}
              >
                تأكيد
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default EnhancedDataTable;