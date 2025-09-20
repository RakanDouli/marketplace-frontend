'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Shield, Users, CreditCard, BarChart3, Mail, Package, Settings, FileText, LogOut } from 'lucide-react';
import { useAdminAuthStore } from '../../../stores/adminAuthStore';
import { Text, Button, Container } from '../../slices';

interface AdminSidebarContentProps {
  onClose?: () => void;
}

// Dynamic menu items based on permissions
const menuItems = [
  {
    path: '/admin/dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    permission: null // Always visible
  },
  {
    path: '/admin/roles',
    label: 'Roles & Permissions',
    icon: Shield,
    permission: 'roles.manage'
  },
  {
    path: '/admin/subscriptions',
    label: 'User Subscriptions',
    icon: CreditCard,
    permission: 'subscriptions.manage'
  },
  {
    path: '/admin/analytics',
    label: 'Analytics & Reports',
    icon: BarChart3,
    permission: 'analytics.view'
  },
  {
    path: '/admin/emails',
    label: 'Email Templates',
    icon: Mail,
    permission: 'email_templates.manage'
  },
  {
    path: '/admin/campaigns',
    label: 'Campaigns',
    icon: Package,
    permission: 'campaigns.manage'
  },
  {
    path: '/admin/categories',
    label: 'Categories',
    icon: Settings,
    permission: 'categories.manage'
  },
  {
    path: '/admin/listings',
    label: 'Listings',
    icon: FileText,
    permission: 'listings.manage'
  }
];

const AdminSidebarContent: React.FC<AdminSidebarContentProps> = ({ onClose }) => {
  const pathname = usePathname();
  const { user, logout, checkPermission } = useAdminAuthStore();

  // Filter menu items based on user permissions
  const visibleMenuItems = menuItems.filter(item => {
    if (!item.permission) return true; // Always show items without permission requirements
    return checkPermission(item.permission);
  });

  const isActiveLink = (path: string) => {
    if (path === '/admin/dashboard') {
      return pathname === '/admin/dashboard' || pathname === '/admin';
    }
    return pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
  };

  return (
    <Container size="sm" padding={true}>
   
      {/* User Info */}
      {user && (
        <Container size="sm" backgroundColor="rgba(0,0,0,0.05)" padding={true}>
          <Text variant="paragraph">{user.name.charAt(0).toUpperCase()}</Text>
          <div>
            <Text variant="paragraph">{user.name}</Text>
            <Text variant="small">{user.role.replace('_', ' ')}</Text>
          </div>
        </Container>
      )}

      {/* Navigation Menu */}
      <nav>
        {visibleMenuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = isActiveLink(item.path);

          return (
            <Button
              key={item.path}
              variant={isActive ? "primary" : "link"}
              href={item.path}
              icon={<IconComponent size={20} />}
              onClick={onClose}
            >
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <Button
        variant="danger"
        icon={<LogOut size={20} />}
        onClick={handleLogout}
      >
        Sign Out
      </Button>
    </Container>
  );
};

export default AdminSidebarContent;