'use client';

import React from 'react';
import { Button } from '@/components/slices';
import { RefreshCw } from 'lucide-react';
import styles from './DataTable.module.scss';

interface DataTableProps {
  featureKey: string;
  data: any[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onRowAction?: (action: string, row: any) => void;
}

export function DataTable({
  featureKey,
  data,
  isLoading = false,
  onRefresh,
  onRowAction
}: DataTableProps) {

  if (isLoading) {
    return (
      <div className={styles.loading}>
        Loading {featureKey}...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No {featureKey} found</p>
        {onRefresh && (
          <Button onClick={onRefresh} variant="secondary">
            <RefreshCw size={16} />
            Refresh
          </Button>
        )}
      </div>
    );
  }

  // Get columns from first data item
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className={styles.dataTable}>
      {onRefresh && (
        <div className={styles.tableActions}>
          <Button onClick={onRefresh} variant="secondary">
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column}>{column}</th>
            ))}
            {onRowAction && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map(column => (
                <td key={column}>
                  {typeof row[column] === 'boolean'
                    ? (row[column] ? 'Yes' : 'No')
                    : row[column]?.toString() || '-'
                  }
                </td>
              ))}
              {onRowAction && (
                <td>
                  <Button
                    onClick={() => onRowAction('view', row)}
                    variant="ghost"
                    size="small"
                  >
                    View
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}