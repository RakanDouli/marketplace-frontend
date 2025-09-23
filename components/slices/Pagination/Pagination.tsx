'use client';

import React from 'react';
import { Button } from '../Button/Button';
import styles from './Pagination.module.scss';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  showFirstLast?: boolean;
  previousLabel?: string;
  nextLabel?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  showFirstLast = true,
  previousLabel = 'السابقة',
  nextLabel = 'التالية',
  className = ''
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  // Calculate visible page range
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Adjust start if we're near the end
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  // Generate page buttons
  const generatePageButtons = () => {
    const pages = [];

    // Show first page and ellipsis if needed
    if (showFirstLast && startPage > 1) {
      pages.push(
        <button
          key={1}
          className={`${styles.pageButton} ${currentPage === 1 ? styles.active : ''}`}
          onClick={() => handlePageClick(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className={styles.ellipsis}>
            ...
          </span>
        );
      }
    }

    // Show visible page range
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`${styles.pageButton} ${currentPage === i ? styles.active : ''}`}
          onClick={() => handlePageClick(i)}
        >
          {i}
        </button>
      );
    }

    // Show ellipsis and last page if needed
    if (showFirstLast && endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className={styles.ellipsis}>
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          className={`${styles.pageButton} ${currentPage === totalPages ? styles.active : ''}`}
          onClick={() => handlePageClick(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className={`${styles.pagination} ${className}`}>
      <Button
        variant="outline"
        disabled={currentPage === 1}
        onClick={() => handlePageClick(currentPage - 1)}
        size="sm"
      >
        {previousLabel}
      </Button>

      <div className={styles.pageNumbers}>
        {generatePageButtons()}
      </div>

      <Button
        variant="outline"
        disabled={currentPage === totalPages}
        onClick={() => handlePageClick(currentPage + 1)}
        size="sm"
      >
        {nextLabel}
      </Button>
    </div>
  );
}

export default Pagination;