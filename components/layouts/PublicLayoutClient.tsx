'use client';

import { usePathname } from 'next/navigation';
import Header from "../Header/Header";
import { NotificationToast } from '../slices';
import { AuthModal } from '../AuthModal';

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
    <div>
      <Header />
      <NotificationToast />
      <AuthModal />
      <main>{children}</main>
      {/* Footer will be added later */}
    </div>
  );
}