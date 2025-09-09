import AdminSidebar from '@/components/layout/AdminSidebar/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <div className="flex-1 overflow-hidden" style={{ marginLeft: '280px' }}>
        <main className="h-full overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}