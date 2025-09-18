// 🚀 PROGRESSIVE LOADER - Shows loading progress for Syrian internet
// Provides visual feedback during multi-stage loading

'use client';

import React from 'react';

interface ProgressiveLoaderProps {
  phase: 'initial' | 'grid' | 'list' | 'detail' | 'complete';
  isLoadingEssential?: boolean;
  isLoadingSecondary?: boolean;
  compact?: boolean;
}

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  phase,
  isLoadingEssential = false,
  isLoadingSecondary = false,
  compact = false
}) => {
  // Don't show loader when complete
  if (phase === 'complete' && !isLoadingEssential && !isLoadingSecondary) {
    return null;
  }

  const getPhaseMessage = () => {
    if (isLoadingEssential) return 'جاري تحميل الفلاتر الأساسية...';
    if (isLoadingSecondary) return 'جاري تحميل المزيد من الخيارات...';

    switch (phase) {
      case 'initial':
        return 'جاري التحميل...';
      case 'grid':
        return 'جاري تحميل الإعلانات...';
      case 'list':
        return 'جاري تحديث العرض...';
      case 'detail':
        return 'جاري تحميل التفاصيل...';
      default:
        return 'جاري التحميل...';
    }
  };

  const getPhaseProgress = () => {
    if (isLoadingEssential || isLoadingSecondary) return 75;

    switch (phase) {
      case 'initial':
        return 25;
      case 'grid':
        return 50;
      case 'list':
        return 75;
      case 'detail':
        return 90;
      case 'complete':
        return 100;
      default:
        return 0;
    }
  };

  const progress = getPhaseProgress();
  const message = getPhaseMessage();

  if (compact) {
    return (
      <div className="progressive-loader progressive-loader--compact">
        <div className="loader-spinner" />
        <span className="loader-text">{message}</span>
      </div>
    );
  }

  return (
    <div className="progressive-loader">
      <div className="loader-content">
        <div className="loader-icon">
          <LoadingIcon />
        </div>

        <div className="loader-info">
          <div className="loader-message">{message}</div>

          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-text">{progress}%</div>
          </div>

          <div className="loader-tips">
            {phase === 'initial' && (
              <span>تحسين التحميل للإنترنت البطيء...</span>
            )}
            {isLoadingSecondary && (
              <span>يمكنك استخدام الفلاتر الأساسية الآن</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 🎨 LOADING ICON COMPONENT
const LoadingIcon: React.FC = () => (
  <svg
    className="loading-icon"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="60"
      strokeDashoffset="60"
    >
      <animate
        attributeName="stroke-dashoffset"
        values="60;0;60"
        dur="2s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);

// 🎨 STYLES
const progressiveLoaderStyles = `
  .progressive-loader {
    position: fixed;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    padding: 1.5rem;
    min-width: 320px;
    max-width: 400px;
    border: 1px solid #e9ecef;
  }

  .progressive-loader--compact {
    position: static;
    transform: none;
    background: #f8f9fa;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    box-shadow: none;
    border: 1px solid #dee2e6;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: auto;
    max-width: none;
  }

  .loader-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .loader-icon {
    color: #007bff;
  }

  .loader-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }

  .loader-message {
    font-weight: 500;
    color: #495057;
    text-align: center;
    font-size: 14px;
  }

  .progress-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }

  .progress-bar {
    flex: 1;
    height: 6px;
    background: #e9ecef;
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #007bff, #28a745);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 12px;
    color: #6c757d;
    font-weight: 500;
    min-width: 35px;
    text-align: right;
  }

  .loader-tips {
    font-size: 12px;
    color: #6c757d;
    text-align: center;
    font-style: italic;
  }

  .loader-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #e9ecef;
    border-top: 2px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loader-text {
    font-size: 12px;
    color: #495057;
    font-weight: 500;
  }

  .loading-icon {
    animation: rotate 2s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* 📱 RESPONSIVE */
  @media (max-width: 768px) {
    .progressive-loader {
      top: 60px;
      left: 1rem;
      right: 1rem;
      transform: none;
      min-width: auto;
      max-width: none;
    }

    .loader-message {
      font-size: 13px;
    }

    .progress-container {
      gap: 0.5rem;
    }
  }

  /* 🌐 RTL SUPPORT */
  [dir="rtl"] .progress-text {
    text-align: left;
  }

  [dir="rtl"] .progressive-loader--compact {
    flex-direction: row-reverse;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = progressiveLoaderStyles;
  document.head.appendChild(styleSheet);
}