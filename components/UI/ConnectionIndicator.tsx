// 📶 CONNECTION INDICATOR - Shows connection status and optimization tips
// Helps Syrian users understand and optimize their experience

'use client';

import React, { useState } from 'react';

interface ConnectionIndicatorProps {
  speed: 'slow' | 'medium' | 'fast';
  onOptimize?: () => void;
  showTips?: boolean;
  dismissible?: boolean;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  speed,
  onOptimize,
  showTips = true,
  dismissible = true
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [showOptimizationTips, setShowOptimizationTips] = useState(false);

  if (dismissed) return null;

  const getConnectionInfo = () => {
    switch (speed) {
      case 'slow':
        return {
          icon: '🐌',
          color: '#dc3545',
          text: 'اتصال بطيء',
          message: 'تم تحسين الموقع للإنترنت البطيء',
          tips: [
            'سيتم تحميل الصور بجودة أقل لتوفير البيانات',
            'سيتم عرض عدد أقل من الإعلانات في كل صفحة',
            'ستظهر الفلاتر الأساسية أولاً',
            'يمكنك إيقاف تشغيل الصور نهائياً من الإعدادات'
          ]
        };
      case 'medium':
        return {
          icon: '📶',
          color: '#ffc107',
          text: 'اتصال متوسط',
          message: 'الاتصال جيد، سيتم التحميل بسرعة معقولة',
          tips: [
            'جودة الصور محسنة للسرعة',
            'التحميل التدريجي مفعل',
            'يمكنك تبديل إلى الوضع السريع'
          ]
        };
      case 'fast':
        return {
          icon: '🚀',
          color: '#28a745',
          text: 'اتصال سريع',
          message: 'اتصال ممتاز! جميع الميزات متاحة',
          tips: [
            'سيتم تحميل جميع الصور بجودة عالية',
            'التحديثات الفورية مفعلة',
            'يمكنك استخدام جميع الميزات'
          ]
        };
    }
  };

  const connectionInfo = getConnectionInfo();

  return (
    <div className={`connection-indicator connection-indicator--${speed}`}>
      <div className="connection-header">
        <div className="connection-status">
          <span className="connection-icon">{connectionInfo.icon}</span>
          <div className="connection-info">
            <div className="connection-text" style={{ color: connectionInfo.color }}>
              {connectionInfo.text}
            </div>
            <div className="connection-message">
              {connectionInfo.message}
            </div>
          </div>
        </div>

        <div className="connection-actions">
          {speed === 'slow' && showTips && (
            <button
              className="tips-button"
              onClick={() => setShowOptimizationTips(!showOptimizationTips)}
            >
              {showOptimizationTips ? 'إخفاء النصائح' : 'نصائح التحسين'}
            </button>
          )}

          {dismissible && (
            <button
              className="dismiss-button"
              onClick={() => setDismissed(true)}
              aria-label="إغلاق"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Optimization tips */}
      {showOptimizationTips && showTips && (
        <div className="optimization-tips">
          <h4>نصائح لتحسين التجربة:</h4>
          <ul>
            {connectionInfo.tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>

          {speed === 'slow' && (
            <div className="optimization-actions">
              <button
                className="optimize-button"
                onClick={() => {
                  onOptimize?.();
                  setShowOptimizationTips(false);
                }}
              >
                تطبيق التحسينات
              </button>
            </div>
          )}
        </div>
      )}

      {/* Data saving mode indicator */}
      {speed === 'slow' && (
        <div className="data-saver-info">
          <span className="data-saver-icon">💾</span>
          <span>وضع توفير البيانات مفعل</span>
        </div>
      )}
    </div>
  );
};

// 🎚️ CONNECTION SPEED SELECTOR (for testing/manual override)
export const ConnectionSpeedSelector: React.FC<{
  currentSpeed: 'slow' | 'medium' | 'fast';
  onSpeedChange: (speed: 'slow' | 'medium' | 'fast') => void;
}> = ({ currentSpeed, onSpeedChange }) => (
  <div className="connection-speed-selector">
    <label>سرعة الاتصال:</label>
    <div className="speed-options">
      {(['slow', 'medium', 'fast'] as const).map(speed => (
        <button
          key={speed}
          className={`speed-option ${currentSpeed === speed ? 'active' : ''}`}
          onClick={() => onSpeedChange(speed)}
        >
          {speed === 'slow' && '🐌 بطيء'}
          {speed === 'medium' && '📶 متوسط'}
          {speed === 'fast' && '🚀 سريع'}
        </button>
      ))}
    </div>
  </div>
);

// 📊 DATA USAGE MONITOR
export const DataUsageMonitor: React.FC<{
  dataUsed: number; // in KB
  showWarning?: boolean;
}> = ({ dataUsed, showWarning = false }) => {
  const formatDataUsage = (kb: number): string => {
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getUsageColor = () => {
    if (dataUsed < 500) return '#28a745'; // Green
    if (dataUsed < 1024) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  };

  return (
    <div className="data-usage-monitor">
      <div className="usage-header">
        <span className="usage-icon">📊</span>
        <span>استهلاك البيانات: </span>
        <span style={{ color: getUsageColor(), fontWeight: 'bold' }}>
          {formatDataUsage(dataUsed)}
        </span>
      </div>

      {showWarning && dataUsed > 1024 && (
        <div className="usage-warning">
          ⚠️ استهلاك عالي للبيانات - فعل وضع توفير البيانات
        </div>
      )}
    </div>
  );
};

// 🎨 STYLES
const connectionIndicatorStyles = `
  .connection-indicator {
    background: white;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    border-left: 4px solid;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .connection-indicator--slow {
    border-color: #dc3545;
    background: #fff5f5;
  }

  .connection-indicator--medium {
    border-color: #ffc107;
    background: #fffbf0;
  }

  .connection-indicator--fast {
    border-color: #28a745;
    background: #f8fff9;
  }

  .connection-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .connection-status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .connection-icon {
    font-size: 1.5rem;
  }

  .connection-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .connection-text {
    font-weight: 600;
    font-size: 14px;
  }

  .connection-message {
    font-size: 12px;
    color: #6c757d;
  }

  .connection-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tips-button {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .tips-button:hover {
    background: #0056b3;
  }

  .dismiss-button {
    background: none;
    border: none;
    font-size: 18px;
    color: #6c757d;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dismiss-button:hover {
    color: #495057;
  }

  .optimization-tips {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e9ecef;
  }

  .optimization-tips h4 {
    margin: 0 0 0.5rem 0;
    font-size: 14px;
    color: #495057;
  }

  .optimization-tips ul {
    margin: 0;
    padding-left: 1.5rem;
    list-style-type: disc;
  }

  .optimization-tips li {
    font-size: 12px;
    color: #6c757d;
    margin-bottom: 0.25rem;
  }

  .optimization-actions {
    margin-top: 0.75rem;
  }

  .optimize-button {
    background: #28a745;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    font-weight: 500;
  }

  .optimize-button:hover {
    background: #218838;
  }

  .data-saver-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding: 0.5rem;
    background: rgba(40, 167, 69, 0.1);
    border-radius: 4px;
    font-size: 12px;
    color: #155724;
  }

  .data-saver-icon {
    font-size: 14px;
  }

  .connection-speed-selector {
    background: white;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #dee2e6;
    margin-bottom: 1rem;
  }

  .connection-speed-selector label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    font-size: 14px;
  }

  .speed-options {
    display: flex;
    gap: 0.5rem;
  }

  .speed-option {
    padding: 0.5rem 0.75rem;
    border: 1px solid #dee2e6;
    background: white;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .speed-option:hover {
    background: #f8f9fa;
  }

  .speed-option.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }

  .data-usage-monitor {
    background: white;
    padding: 0.75rem;
    border-radius: 6px;
    border: 1px solid #dee2e6;
    margin-top: 1rem;
  }

  .usage-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 12px;
  }

  .usage-icon {
    font-size: 14px;
  }

  .usage-warning {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 4px;
    font-size: 11px;
    color: #856404;
  }

  /* 📱 RESPONSIVE */
  @media (max-width: 768px) {
    .connection-header {
      flex-direction: column;
      gap: 0.75rem;
    }

    .connection-actions {
      align-self: flex-start;
    }

    .optimization-tips ul {
      padding-left: 1rem;
    }

    .speed-options {
      flex-direction: column;
    }

    .speed-option {
      text-align: center;
    }
  }

  /* 🌐 RTL SUPPORT */
  [dir="rtl"] .optimization-tips ul {
    padding-left: 0;
    padding-right: 1.5rem;
  }

  [dir="rtl"] .connection-status {
    flex-direction: row-reverse;
  }

  [dir="rtl"] .usage-header {
    flex-direction: row-reverse;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = connectionIndicatorStyles;
  document.head.appendChild(styleSheet);
}