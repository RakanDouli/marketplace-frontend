'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Container from '../Container/Container';
import Text from '../Text/Text';
import Button from '../Button/Button';
import { useTranslation } from '../../../hooks/useTranslation';
import styles from './ErrorBoundary.module.scss';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
    
    // In production, you might want to send to error reporting service
    // reportError(error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    // Here you could open a modal to report the error
    // or navigate to a support page
    const subject = encodeURIComponent('Error Report - Syrian Marketplace');
    const body = encodeURIComponent(`
An error occurred on the website:

Error: ${this.state.error?.message || 'Unknown error'}
Stack: ${this.state.error?.stack || 'No stack trace'}
Component Stack: ${this.state.errorInfo?.componentStack || 'No component stack'}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
    `);
    
    window.open(`mailto:support@syrianmarketplace.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Use fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return <ErrorBoundaryFallback
        onRefresh={this.handleRefresh}
        onGoHome={this.handleGoHome}
        onReportError={this.handleReportError}
        error={this.state.error}
        isDevelopment={process.env.NODE_ENV === 'development'}
      />;
    }

    return this.props.children;
  }
}

interface FallbackProps {
  onRefresh: () => void;
  onGoHome: () => void;
  onReportError: () => void;
  error?: Error;
  isDevelopment: boolean;
}

function ErrorBoundaryFallback({ 
  onRefresh, 
  onGoHome, 
  onReportError, 
  error, 
  isDevelopment 
}: FallbackProps) {
  const { t } = useTranslation();

  return (
    <main className={styles.errorBoundary}>
      <Container size="lg">
        <div className={styles.content}>
          <div className={styles.icon}>
            <Text variant="h1" className={styles.iconText}>
              !
            </Text>
          </div>
          
          <div className={styles.message}>
            <Text variant="h1" className={styles.title}>
              {t('errors.boundary.title')}
            </Text>
            <Text variant="paragraph" className={styles.description}>
              {t('errors.boundary.description')}
            </Text>
          </div>
          
          <div className={styles.actions}>
            <Button 
              variant="primary" 
              size="lg" 
              onClick={onRefresh}
            >
              {t('errors.boundary.refresh')}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={onGoHome}
            >
              {t('errors.boundary.goHome')}
            </Button>
            <Button 
              variant="secondary" 
              size="md" 
              onClick={onReportError}
            >
              {t('errors.boundary.reportError')}
            </Button>
          </div>
          
          {isDevelopment && error && (
            <details className={styles.errorDetails}>
              <summary className={styles.errorSummary}>
                <Text variant="small">
                  Error Details (Development Only)
                </Text>
              </summary>
              <div className={styles.errorContent}>
                <Text variant="small" className={styles.errorMessage}>
                  {error.message}
                </Text>
                {error.stack && (
                  <pre className={styles.errorStack}>
                    <Text variant="small">
                      {error.stack}
                    </Text>
                  </pre>
                )}
              </div>
            </details>
          )}
        </div>
      </Container>
    </main>
  );
}

// Convenience wrapper for easier usage
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorBoundaryClass {...props} />;
}

export default ErrorBoundary;