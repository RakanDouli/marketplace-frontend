'use client';

import React from 'react';
import Link from 'next/link';
import Container from '../../../components/slices/Container/Container';
import Text from '../../../components/slices/Text/Text';
import Button from '../../../components/slices/Button/Button';
import { useTranslation } from '../../../hooks/useTranslation';

export default function CategoryNotFound() {
  const { t } = useTranslation();
  
  return (
    <Container>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Text variant="h1" style={{ marginBottom: '1rem' }}>
          {t('errors.categoryNotFound.title')}
        </Text>
        <Text variant="paragraph" style={{ marginBottom: '2rem' }}>
          {t('errors.categoryNotFound.description')}
        </Text>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/">
            <Button variant="primary">
              {t('errors.notFound.goHome')}
            </Button>
          </Link>
          <Link href="/car">
            <Button variant="outline">
              تصفح السيارات
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}