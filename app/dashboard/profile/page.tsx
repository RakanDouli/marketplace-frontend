'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { PersonalInfoPanel } from '@/components/dashboard/PersonalInfoPanel';
import { MobileBackButton } from '@/components/slices';

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  // Pass the action to PersonalInfoPanel so it can auto-open the password modal
  return (
    <>
      <MobileBackButton
        onClick={() => router.push('/dashboard')}
        title="معلومات الحساب"
      />
      <PersonalInfoPanel initialAction={action} />
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
