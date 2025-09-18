// 🎨 LISTING SKELETON - Optimized for Syrian Internet
// Fast-loading skeleton screens to improve perceived performance

'use client';

import React from 'react';

interface ListingSkeletonProps {
  count?: number;
  layout?: 'grid' | 'list';
  showImages?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const ListingSkeleton: React.FC<ListingSkeletonProps> = ({
  count = 6,
  layout = 'grid',
  showImages = true,
  size = 'medium'
}) => {
  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={`listing-skeleton listing-skeleton--${layout} listing-skeleton--${size}`}
    >
      {layout === 'grid' ? (
        <GridItemSkeleton showImages={showImages} size={size} />
      ) : (
        <ListItemSkeleton showImages={showImages} size={size} />
      )}
    </div>
  ));

  return (
    <div className={`listings-skeleton listings-skeleton--${layout}`}>
      {skeletons}
    </div>
  );
};

// 📱 GRID ITEM SKELETON
const GridItemSkeleton: React.FC<{
  showImages: boolean;
  size: 'small' | 'medium' | 'large';
}> = ({ showImages, size }) => (
  <div className="grid-item-skeleton">
    {/* Image placeholder */}
    {showImages && (
      <div className={`skeleton-image skeleton-image--${size}`}>
        <div className="skeleton-shimmer" />
      </div>
    )}

    {/* Content */}
    <div className="skeleton-content">
      {/* Title */}
      <div className="skeleton-title">
        <div className="skeleton-line skeleton-line--title" />
        <div className="skeleton-line skeleton-line--title skeleton-line--short" />
      </div>

      {/* Price */}
      <div className="skeleton-price">
        <div className="skeleton-line skeleton-line--price" />
      </div>

      {/* Location */}
      <div className="skeleton-location">
        <div className="skeleton-line skeleton-line--location" />
      </div>

      {/* Specs (only for medium+ size) */}
      {size !== 'small' && (
        <div className="skeleton-specs">
          <div className="skeleton-line skeleton-line--spec" />
          <div className="skeleton-line skeleton-line--spec skeleton-line--short" />
        </div>
      )}
    </div>
  </div>
);

// 📋 LIST ITEM SKELETON
const ListItemSkeleton: React.FC<{
  showImages: boolean;
  size: 'small' | 'medium' | 'large';
}> = ({ showImages, size }) => (
  <div className="list-item-skeleton">
    <div className="skeleton-row">
      {/* Image */}
      {showImages && (
        <div className="skeleton-image skeleton-image--list">
          <div className="skeleton-shimmer" />
        </div>
      )}

      {/* Content */}
      <div className="skeleton-content">
        {/* Title and price row */}
        <div className="skeleton-header">
          <div className="skeleton-title">
            <div className="skeleton-line skeleton-line--title" />
          </div>
          <div className="skeleton-price">
            <div className="skeleton-line skeleton-line--price" />
          </div>
        </div>

        {/* Description (only for larger sizes) */}
        {size !== 'small' && (
          <div className="skeleton-description">
            <div className="skeleton-line skeleton-line--description" />
            <div className="skeleton-line skeleton-line--description skeleton-line--short" />
          </div>
        )}

        {/* Footer with specs */}
        <div className="skeleton-footer">
          <div className="skeleton-specs">
            <div className="skeleton-line skeleton-line--spec" />
            <div className="skeleton-line skeleton-line--spec" />
            <div className="skeleton-line skeleton-line--spec" />
          </div>
          <div className="skeleton-date">
            <div className="skeleton-line skeleton-line--date" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// 🎨 STYLES (CSS-in-JS for component isolation)
const skeletonStyles = `
  .listings-skeleton {
    width: 100%;
  }

  .listings-skeleton--grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .listings-skeleton--list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .listing-skeleton {
    background: #f8f9fa;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e9ecef;
  }

  .grid-item-skeleton {
    padding: 1rem;
  }

  .list-item-skeleton {
    padding: 1rem;
  }

  .skeleton-row {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .skeleton-image {
    background: #e9ecef;
    border-radius: 6px;
    position: relative;
    overflow: hidden;
  }

  .skeleton-image--small {
    width: 60px;
    height: 60px;
  }

  .skeleton-image--medium {
    width: 100%;
    height: 180px;
  }

  .skeleton-image--large {
    width: 100%;
    height: 220px;
  }

  .skeleton-image--list {
    width: 120px;
    height: 90px;
    flex-shrink: 0;
  }

  .skeleton-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .skeleton-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .skeleton-title {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .skeleton-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .skeleton-specs {
    display: flex;
    gap: 1rem;
    flex: 1;
  }

  .skeleton-line {
    height: 14px;
    background: #e9ecef;
    border-radius: 4px;
    position: relative;
    overflow: hidden;
  }

  .skeleton-line--title {
    height: 16px;
  }

  .skeleton-line--price {
    height: 18px;
    width: 80px;
    background: #d4edda;
  }

  .skeleton-line--location {
    height: 12px;
    width: 120px;
  }

  .skeleton-line--spec {
    height: 12px;
    width: 60px;
  }

  .skeleton-line--description {
    height: 12px;
  }

  .skeleton-line--date {
    height: 12px;
    width: 80px;
  }

  .skeleton-line--short {
    width: 70%;
  }

  /* 🌊 SHIMMER ANIMATION - Lightweight for slow connections */
  .skeleton-shimmer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.6) 50%,
      transparent 100%
    );
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .skeleton-line::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.4) 50%,
      transparent 100%
    );
    animation: shimmer 2s infinite;
  }

  /* 📱 RESPONSIVE ADJUSTMENTS */
  @media (max-width: 768px) {
    .listings-skeleton--grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 0.75rem;
    }

    .skeleton-image--medium {
      height: 120px;
    }

    .skeleton-specs {
      flex-direction: column;
      gap: 0.5rem;
    }

    .skeleton-footer {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }

  /* 🌐 RTL SUPPORT */
  [dir="rtl"] .skeleton-row {
    flex-direction: row-reverse;
  }

  [dir="rtl"] .skeleton-header {
    flex-direction: row-reverse;
  }
`;

// 💾 LIGHTWEIGHT SKELETON (for very slow connections)
export const LightweightListingSkeleton: React.FC<{
  count?: number;
}> = ({ count = 4 }) => (
  <div className="lightweight-skeleton">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="lightweight-skeleton-item">
        <div className="skeleton-title-line" />
        <div className="skeleton-price-line" />
        <div className="skeleton-location-line" />
      </div>
    ))}
    <style jsx>{`
      .lightweight-skeleton {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .lightweight-skeleton-item {
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .skeleton-title-line {
        height: 16px;
        background: #e9ecef;
        border-radius: 4px;
        width: 80%;
      }

      .skeleton-price-line {
        height: 14px;
        background: #d4edda;
        border-radius: 4px;
        width: 60px;
      }

      .skeleton-location-line {
        height: 12px;
        background: #e9ecef;
        border-radius: 4px;
        width: 40%;
      }
    `}</style>
  </div>
);

// Inject styles (in a real app, this would be in a CSS file)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = skeletonStyles;
  document.head.appendChild(styleSheet);
}