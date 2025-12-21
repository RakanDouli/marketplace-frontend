'use client';

import { useRouter } from 'next/navigation';
import { PersonalInfoPanel } from '@/components/dashboard/PersonalInfoPanel';
import { MobileBackButton } from '@/components/slices';

export default function ProfilePage() {
  const router = useRouter();

  return (
    <>
      <MobileBackButton
        onClick={() => router.push('/dashboard')}
        title="معلومات الحساب"
      />
      <PersonalInfoPanel />
    </>
  );
}
