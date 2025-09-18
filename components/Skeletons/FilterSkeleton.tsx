// 🎛️ FILTER SKELETON - Fast loading placeholders for filters
// Optimized for Syrian internet with minimal animation

'use client';

import React from 'react';

interface FilterSkeletonProps {
  count?: number;
  showSearch?: boolean;
  compact?: boolean;
}

export const FilterSkeleton: React.FC<FilterSkeletonProps> = ({
  count = 6,
  showSearch = true,
  compact = false
}) => {
  return (
    <div className={`filter-skeleton ${compact ? 'filter-skeleton--compact' : ''}`}>
      {/* Search filter skeleton */}
      {showSearch && (
        <div className="filter-skeleton-item filter-skeleton-item--search">
          <div className="skeleton-label" />
          <div className="skeleton-input" />
        </div>
      )}

      {/* Filter items */}
      {Array.from({ length: count }, (_, index) => (
        <FilterItemSkeleton
          key={index}
          type={getSkeletonType(index)}
          compact={compact}
        />
      ))}

      {/* Applied filters skeleton */}
      <div className="applied-filters-skeleton">
        <div className="skeleton-label skeleton-label--small" />
        <div className="applied-filter-tags">
          <div className="skeleton-tag" />
          <div className="skeleton-tag skeleton-tag--short" />
        </div>
      </div>
    </div>
  );
};

// 🎯 INDIVIDUAL FILTER ITEM SKELETON
const FilterItemSkeleton: React.FC<{
  type: 'dropdown' | 'checkbox' | 'range' | 'icons';
  compact: boolean;
}> = ({ type, compact }) => (
  <div className={`filter-skeleton-item filter-skeleton-item--${type}`}>
    {/* Filter label */}
    <div className="skeleton-label" />

    {/* Filter content based on type */}
    {type === 'dropdown' && (
      <div className="skeleton-dropdown">
        <div className="skeleton-dropdown-button" />
      </div>
    )}

    {type === 'checkbox' && (
      <div className="skeleton-checkboxes">
        <CheckboxSkeleton />
        <CheckboxSkeleton />
        <CheckboxSkeleton />
        {!compact && (
          <>
            <CheckboxSkeleton />
            <CheckboxSkeleton />
          </>
        )}
      </div>
    )}

    {type === 'range' && (
      <div className="skeleton-range">
        <div className="skeleton-range-inputs">
          <div className="skeleton-input skeleton-input--small" />
          <div className="skeleton-range-separator" />
          <div className="skeleton-input skeleton-input--small" />
        </div>
      </div>
    )}

    {type === 'icons' && (
      <div className="skeleton-icons">
        <IconSkeleton />
        <IconSkeleton />
        <IconSkeleton />
        <IconSkeleton />
        {!compact && (
          <>
            <IconSkeleton />
            <IconSkeleton />
          </>
        )}
      </div>
    )}
  </div>
);

// 📋 CHECKBOX SKELETON
const CheckboxSkeleton: React.FC = () => (
  <div className="skeleton-checkbox-item">
    <div className="skeleton-checkbox" />
    <div className="skeleton-checkbox-label" />
    <div className="skeleton-count" />
  </div>
);

// 🎨 ICON SKELETON
const IconSkeleton: React.FC = () => (
  <div className="skeleton-icon-item">
    <div className="skeleton-icon" />
    <div className="skeleton-icon-label" />
  </div>
);

// 🔧 HELPER FUNCTION
function getSkeletonType(index: number): 'dropdown' | 'checkbox' | 'range' | 'icons' {
  const types = ['dropdown', 'checkbox', 'range', 'icons'] as const;
  return types[index % types.length];
}

// 🎨 STYLES
const filterSkeletonStyles = `
  .filter-skeleton {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    width: 100%;
    max-width: 300px;
  }

  .filter-skeleton--compact {
    gap: 1rem;
    padding: 0.75rem;
  }

  .filter-skeleton-item {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .filter-skeleton-item--search {
    padding-bottom: 1rem;
    border-bottom: 1px solid #e9ecef;
  }

  .skeleton-label {
    height: 16px;
    background: #e9ecef;
    border-radius: 4px;
    width: 40%;
    position: relative;
    overflow: hidden;
  }

  .skeleton-label--small {
    height: 14px;
    width: 30%;
  }

  .skeleton-input {
    height: 40px;
    background: #e9ecef;
    border-radius: 6px;
    position: relative;
    overflow: hidden;
  }

  .skeleton-input--small {
    height: 36px;
    width: 80px;
  }

  .skeleton-dropdown-button {
    height: 40px;
    background: #e9ecef;
    border-radius: 6px;
    position: relative;
    overflow: hidden;
  }

  .skeleton-checkboxes {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .skeleton-checkbox-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .skeleton-checkbox {
    width: 16px;
    height: 16px;
    background: #e9ecef;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .skeleton-checkbox-label {
    height: 14px;
    background: #e9ecef;
    border-radius: 4px;
    flex: 1;
    max-width: 120px;
  }

  .skeleton-count {
    height: 12px;
    width: 24px;
    background: #d4edda;
    border-radius: 10px;
    flex-shrink: 0;
  }

  .skeleton-range-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .skeleton-range-separator {
    width: 12px;
    height: 2px;
    background: #e9ecef;
    border-radius: 1px;
  }

  .skeleton-icons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
    gap: 0.5rem;
  }

  .skeleton-icon-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem;
    background: #f1f3f5;
    border-radius: 6px;
  }

  .skeleton-icon {
    width: 32px;
    height: 32px;
    background: #e9ecef;
    border-radius: 6px;
  }

  .skeleton-icon-label {
    height: 10px;
    width: 40px;
    background: #e9ecef;
    border-radius: 4px;
  }

  .applied-filters-skeleton {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e9ecef;
  }

  .applied-filter-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .skeleton-tag {
    height: 28px;
    width: 80px;
    background: #e3f2fd;
    border-radius: 14px;
    position: relative;
    overflow: hidden;
  }

  .skeleton-tag--short {
    width: 60px;
  }

  /* 🌊 SUBTLE SHIMMER - Lightweight for slow connections */
  .skeleton-label::before,
  .skeleton-input::before,
  .skeleton-dropdown-button::before,
  .skeleton-tag::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 100%
    );
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  /* 📱 RESPONSIVE */
  @media (max-width: 768px) {
    .filter-skeleton {
      max-width: 100%;
    }

    .skeleton-icons {
      grid-template-columns: repeat(3, 1fr);
    }

    .skeleton-icon-item {
      padding: 0.25rem;
    }

    .skeleton-icon {
      width: 28px;
      height: 28px;
    }
  }

  /* 🌐 RTL SUPPORT */
  [dir="rtl"] .skeleton-checkbox-item {
    flex-direction: row-reverse;
  }

  [dir="rtl"] .skeleton-range-inputs {
    flex-direction: row-reverse;
  }
`;

// 💾 ULTRA-LIGHTWEIGHT FILTER SKELETON (for very slow connections)
export const LightweightFilterSkeleton: React.FC<{
  count?: number;
}> = ({ count = 4 }) => (
  <div className="lightweight-filter-skeleton">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="lightweight-filter-item">
        <div className="filter-label-line" />
        <div className="filter-content-line" />
      </div>
    ))}
    <style jsx>{`
      .lightweight-filter-skeleton {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 6px;
      }

      .lightweight-filter-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .filter-label-line {
        height: 14px;
        background: #e9ecef;
        border-radius: 4px;
        width: 40%;
      }

      .filter-content-line {
        height: 32px;
        background: #e9ecef;
        border-radius: 4px;
        width: 100%;
      }
    `}</style>
  </div>
);

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = filterSkeletonStyles;
  document.head.appendChild(styleSheet);
}