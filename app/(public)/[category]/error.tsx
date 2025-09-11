'use client';

import React from 'react';
import Container from '../../../components/slices/Container/Container';
import Text from '../../../components/slices/Text/Text';
import Button from '../../../components/slices/Button/Button';
import { useTranslation } from '../../../hooks/useTranslation';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CategoryError({ error, reset }: ErrorPageProps) {
  const { t } = useTranslation();

  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error('Category page error:', error);
  }, [error]);

  return (
    <Container>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Text variant="h1" style={{ marginBottom: '1rem' }}>
          {t('errors.generic.title')}
        </Text>
        <Text variant="paragraph" style={{ marginBottom: '2rem' }}>
          {t('errors.generic.description')}
        </Text>
        <Button onClick={reset} variant="primary">
          {t('errors.generic.tryAgain')}
        </Button>
      </div>
    </Container>
  );
}