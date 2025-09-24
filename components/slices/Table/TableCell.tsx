import React from 'react';
import styles from './Table.module.scss';

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  isHeader?: boolean;
  width?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  className = '',
  isHeader = false,
  width,
  textAlign
}) => {
  const Tag = isHeader ? 'th' : 'td';

  const style = {
    width,
    textAlign
  };

  return (
    <Tag
      className={`${isHeader ? styles.tableHeader : styles.tableCell} ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
};

export default TableCell;