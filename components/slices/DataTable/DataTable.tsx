'use client';

import React, { useState } from 'react';
import { Button, Loading, Modal } from '@/components/slices';
import {
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Key,
  UserX,
  UserCheck
} from 'lucide-react';
import styles from './DataTable.module.scss';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'date' | 'boolean' | 'badge' | 'currency' | 'number';
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface TableAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
  onClick: (row: any) => void;
  isVisible?: (row: any) => boolean;
  isDisabled?: (row: any) => boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface DataTableProps {
  data: any[];
  columns: TableColumn[];
  actions?: TableAction[];
  isLoading?: boolean;
  emptyMessage?: string;
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

export function DataTable({
  data,
  columns,
  actions = [],
  isLoading = false,
  emptyMessage = 'لا توجد بيانات'
}: DataTableProps) {
  const [confirmAction, setConfirmAction] = useState<{ action: TableAction; row: any } | null>(null);

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
        <Loading type='svg' />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Table */}
      {data.length === 0 ? (
        <div className={styles.emptyCell}>
          <span className={styles.emptyText}>{emptyMessage}</span>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map(column => (
                  <th
                    key={column.key}
                    style={{ width: column.width }}
                  >
                    <div className={styles.headerCell}>
                      <span>{column.label}</span>
                    </div>
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className={styles.actionsHeader}>الإجراءات</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
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
                              title={action.label}
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
                variant={'primary'}
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

export default DataTable;