'use client';

import React from 'react';
import { Container } from '@/components/slices/Container/Container';
import { Button, Loading, Text } from '@/components/slices';
import { Table, TableHead, TableBody, TableRow, TableCell, Pagination } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { RefreshCw, Edit, Trash2, Eye, Plus } from 'lucide-react';
import styles from './AdminTable.module.scss';

export interface AdminTableColumn {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
  sortable?: boolean;
}

export interface AdminTableFilter {
  key: string;
  label: string;
  type: 'text' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface AdminTableAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  onClick: (item: any) => void;
  show?: (item: any) => boolean;
}

export interface AdminTableProps {
  // Data and loading
  data: any[];
  loading: boolean;
  error: string | null;

  // Header
  title: string;
  description: string;

  // Table structure
  columns: AdminTableColumn[];
  actions?: AdminTableAction[];

  // Filtering
  filters?: AdminTableFilter[];
  onFiltersChange?: (filters: Record<string, string>) => void;

  // Pagination
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange: (page: number) => void;

  // Actions
  onRefresh: () => void;
  onCreate?: () => void;

  // Permissions
  canCreate?: boolean;
  canModify?: boolean;
  canDelete?: boolean;

  // Empty state
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const AdminTable: React.FC<AdminTableProps> = ({
  data,
  loading,
  error,
  title,
  description,
  columns,
  actions = [],
  filters = [],
  onFiltersChange,
  pagination,
  onPageChange,
  onRefresh,
  onCreate,
  canCreate = false,
  canModify = true,
  canDelete = true,
  emptyIcon = <Eye size={48} />,
  emptyTitle = "لا توجد بيانات",
  emptyDescription = "لم يتم العثور على أي بيانات"
}) => {
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>({});

  // Handle filter changes with debounce
  React.useEffect(() => {
    const delayedFilter = setTimeout(() => {
      onFiltersChange?.(filterValues);
    }, 300);

    return () => clearTimeout(delayedFilter);
  }, [filterValues, onFiltersChange]);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const renderCell = (column: AdminTableColumn, item: any) => {
    const value = item[column.key];
    if (column.render) {
      return column.render(value, item);
    }
    return value || '-';
  };

  return (
    <div className={styles.adminTable}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Text variant="h1" className={styles.title}>{title}</Text>
          <Text variant="paragraph" color="secondary" className={styles.description}>
            {description}
          </Text>
        </div>
        <div className={styles.headerActions}>
          {canCreate && onCreate && (
            <Button
              onClick={onCreate}
              variant="primary"
              icon={<Plus size={16} />}
            >
              إضافة جديد
            </Button>
          )}
          <Button
            onClick={onRefresh}
            variant="secondary"
            icon={<RefreshCw size={16} />}
            disabled={loading}
          >
            تحديث
          </Button>
        </div>
      </div>

      {/* Filters */}
      {filters.length > 0 && (
        <div className={styles.filters}>
          {filters.map(filter => (
            <div key={filter.key} className={styles.filterGroup}>
              {filter.type === 'text' && (
                <Input
                  type="search"
                  placeholder={filter.placeholder || `البحث في ${filter.label}...`}
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                />
              )}
              {filter.type === 'select' && filter.options && (
                <Input
                  type="select"
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  options={filter.options}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <Loading />
          <Text variant="paragraph">جاري التحميل...</Text>
        </div>
      ) : data.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>{emptyIcon}</div>
          <Text variant="h3">{emptyTitle}</Text>
          <Text variant="paragraph" color="secondary">{emptyDescription}</Text>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          {/* Scrollable content area */}
          <div className={styles.tableScrollable}>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map(column => (
                    <TableCell key={column.key} isHeader>
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={item.id || index}>
                    {columns.map(column => (
                      <TableCell key={column.key}>
                        {renderCell(column, item)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Fixed actions column */}
          {actions.length > 0 && (
            <div className={styles.actionsColumn}>
              <div className={styles.actionsHeader}>
                <Text variant="small" className={styles.actionsHeaderText}>الإجراءات</Text>
              </div>
              <div className={styles.actionsBody}>
                {data.map((item, index) => (
                  <div key={item.id || index} className={styles.actionsRow}>
                    <div className={styles.actions}>
                      {actions.map(action => {
                        if (action.show && !action.show(item)) return null;
                        return (
                          <Button
                            key={action.key}
                            onClick={() => action.onClick(item)}
                            variant={action.variant}
                            size="sm"
                            icon={action.icon}
                          >
                            {action.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && data.length > 0 && (
        <>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
          />
          <Text variant="small" color="secondary">
            عرض {data.length} من {pagination.total} عنصر
          </Text>
        </>
      )}
    </div>
  );
};

export default AdminTable;