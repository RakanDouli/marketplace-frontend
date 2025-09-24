import React from 'react';
import styles from './Table.module.scss';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={`${styles.table} ${className}`}>
        {children}
      </table>
    </div>
  );
};

export default Table;