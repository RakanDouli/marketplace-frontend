'use client';

import { useEffect, useState } from 'react';
import styles from './EnvironmentBadge.module.scss';

interface HealthResponse {
  status: string;
  environment: string;
  checks: {
    api: { status: string };
    database: { status: string };
  };
}

// Only show in development or staging - NEVER in production or unknown environments
const ALLOWED_ENVIRONMENTS = ['development', 'staging'];

export const EnvironmentBadge: React.FC = () => {
  const frontendEnv = process.env.NEXT_PUBLIC_APP_ENV || '';

  // STRICT: Only show if explicitly development or staging
  if (!ALLOWED_ENVIRONMENTS.includes(frontendEnv)) {
    return null;
  }

  const [backendEnv, setBackendEnv] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('env-badge-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  useEffect(() => {
    const checkBackendEnv = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/health`);
        const data: HealthResponse = await response.json();
        setBackendEnv(data.environment);
        setMismatch(data.environment !== frontendEnv);
      } catch {
        setBackendEnv('offline');
      }
    };

    checkBackendEnv();
    const interval = setInterval(checkBackendEnv, 30000);
    return () => clearInterval(interval);
  }, [frontendEnv]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('env-badge-dismissed', 'true');
  };

  if (isDismissed) {
    return null;
  }

  const getEnvLabel = (env: string) => {
    if (env === 'development') return 'DEV';
    if (env === 'staging') return 'STAGING';
    return 'OFFLINE';
  };

  const getEnvColor = (env: string) => {
    if (env === 'development') return 'dev';
    if (env === 'staging') return 'staging';
    return 'offline';
  };

  return (
    <div className={`${styles.badge} ${mismatch ? styles.mismatch : ''}`}>
      <div className={styles.envGroup}>
        <span className={styles.label}>FE:</span>
        <span className={`${styles.env} ${styles[getEnvColor(frontendEnv)]}`}>
          {getEnvLabel(frontendEnv)}
        </span>
      </div>
      <div className={styles.envGroup}>
        <span className={styles.label}>BE:</span>
        <span className={`${styles.env} ${styles[getEnvColor(backendEnv || 'offline')]}`}>
          {backendEnv ? getEnvLabel(backendEnv) : '...'}
        </span>
      </div>
      {mismatch && <span className={styles.warning}>!</span>}
      <button
        className={styles.closeButton}
        onClick={handleDismiss}
        title="Hide badge for this session"
      >
        ×
      </button>
    </div>
  );
};
