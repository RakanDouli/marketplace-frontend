'use client';

import { useState } from 'react';
import CarInspection from '@/components/slices/CarInspection/CarInspection';
import type { DamageReport } from '@/components/slices/CarInspection/CarInspection';
import styles from './TestInspection.module.scss';

export default function TestInspectionPage() {
  const [damages, setDamages] = useState<DamageReport[]>([]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>اختبار فحص السيارة</h1>

      <CarInspection
        value={damages}
        onChange={setDamages}
      />

      <div className={styles.dataBox}>
        <strong>البيانات المخزنة:</strong>
        <pre>
          {JSON.stringify(damages, null, 2)}
        </pre>
      </div>
    </div>
  );
}
