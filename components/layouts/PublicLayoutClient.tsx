'use client';

import { usePathname } from 'next/navigation';
import Header from "../Header/Header";

interface PublicLayoutClientProps {
  children: React.ReactNode;
}

export function PublicLayoutClient({ children }: PublicLayoutClientProps) {
  const pathname = usePathname();

  // Don't show public header for admin routes
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      {/* Footer will be added later */}
    </div>
  );
}