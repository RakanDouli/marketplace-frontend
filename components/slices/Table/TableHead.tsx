import React from 'react';
import styles from './Table.module.scss';

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHead: React.FC<TableHeadProps> = ({ children, className = '' }) => {
  return (
    <thead className={`${styles.tableHead} ${className}`}>
      {children}
    </thead>
  );
};

export default TableHead;