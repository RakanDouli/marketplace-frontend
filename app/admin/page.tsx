'use client';

import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';

export default function AdminMainPage() {
  return (
    <AdminAuthGuard>
      <AdminDashboard />
    </AdminAuthGuard>
  );
}