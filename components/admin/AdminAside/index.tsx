// 'use client';

// import React, { useState } from 'react';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { Button } from '@/components/slices';
// import Text from '@/components/slices/Text/Text';
// import {
//   Users,
//   Shield,
//   Settings,
//   BarChart3,
//   Package,
//   FolderTree,
//   FileText,
//   Search,

//   MenuIcon
// } from 'lucide-react';
// import styles from './AdminAside.module.scss';

// interface AdminAsideProps {
//   featureKey: string;
//   onBackToDashboard?: () => void;
// }

// // Helper function to get feature navigation
// const getFeatureNavigation = (featureKey: string) => {
//   const pathToModuleKey: Record<string, string> = {
//     'users': 'user-management',
//     'listings': 'listing-management',
//     'roles': 'role-management',
//     'campaigns': 'campaign-management',
//     'categories': 'category-management',
//     'analytics': 'analytics',
//     'audit': 'audit-logs'
//   };

//   const moduleKey = pathToModuleKey[featureKey];
//   if (!moduleKey) return { title: '', items: [] };

//   const navigationMap: Record<string, {
//     title: string;
//     items: Array<{
//       key: string;
//       label: string;
//       icon: React.ReactNode;
//       path: string;
//     }>;
//   }> = {
//     'user-management': {
//       title: 'إدارة المستخدمين',
//       items: [
//         { key: 'users-list', label: 'قائمة المستخدمين', icon: <Users size={18} />, path: '/admin/users' },
//         { key: 'roles', label: 'الأدوار', icon: <Shield size={18} />, path: '/admin/users/roles' },
//         { key: 'permissions', label: 'الصلاحيات', icon: <Settings size={18} />, path: '/admin/users/permissions' }
//       ]
//     },
//     'listing-management': {
//       title: 'إدارة الإعلانات',
//       items: [
//         { key: 'listings-list', label: 'قائمة الإعلانات', icon: <FileText size={18} />, path: '/admin/listings' },
//         { key: 'moderation', label: 'المراجعة', icon: <Search size={18} />, path: '/admin/listings/moderation' }
//       ]
//     },
//     'role-management': {
//       title: 'إدارة الأدوار',
//       items: [
//         { key: 'roles-list', label: 'الأدوار والصلاحيات', icon: <Shield size={18} />, path: '/admin/roles' }
//       ]
//     },
//     'campaign-management': {
//       title: 'إدارة الحملات',
//       items: [
//         { key: 'campaigns-list', label: 'الحملات الإعلانية', icon: <Package size={18} />, path: '/admin/campaigns' }
//       ]
//     },
//     'category-management': {
//       title: 'إدارة الفئات',
//       items: [
//         { key: 'categories-list', label: 'الفئات', icon: <FolderTree size={18} />, path: '/admin/categories' }
//       ]
//     },
//     'analytics': {
//       title: 'التحليلات والتقارير',
//       items: [
//         { key: 'analytics-dashboard', label: 'لوحة التحليلات', icon: <BarChart3 size={18} />, path: '/admin/analytics' }
//       ]
//     },
//     'audit-logs': {
//       title: 'سجلات المراجعة',
//       items: [
//         { key: 'audit-list', label: 'سجلات الأحداث', icon: <Search size={18} />, path: '/admin/audit' }
//       ]
//     }
//   };

//   return navigationMap[moduleKey] || { title: '', items: [] };
// };

// export function AdminAside({ featureKey, onBackToDashboard }: AdminAsideProps) {
//   const pathname = usePathname();
//   const [isExpanded, setIsExpanded] = useState(false);
//   const navigation = getFeatureNavigation(featureKey);

//   const isLinkActive = (path: string) => {
//     return pathname === path || pathname?.startsWith(path + '/');
//   };

//   const handleToggleExpand = () => {
//     setIsExpanded(!isExpanded);
//   };



//   return (
//     <aside className={`${styles.aside} ${isExpanded ? styles.expanded : styles.collapsed}`}>
//       {/* Toggle Button */}
//       <Button
//         className={styles.toggleButton}
//         variant={isExpanded ? 'outline' : 'primary'}
//         onClick={handleToggleExpand}
//         aria-label={isExpanded ? 'طي القائمة' : 'توسيع القائمة'}
//       >
//         <MenuIcon />
//       </Button>

//       {/* Header */}
//       <div className={styles.header}>
//         {/* Feature Title */}
//         {navigation.title && (
//           <div className={styles.title}>
//             <Text variant="h4">{navigation.title}</Text>
//           </div>
//         )}
//       </div>

//       {/* Navigation */}
//       <nav className={styles.nav}>
//         {navigation.items.map((item) => (
//           <Link
//             key={item.key}
//             href={item.path}
//             className={`${styles.navItem} ${isLinkActive(item.path) ? styles.active : ''}`}
//             title={item.label}
//           >
//             <span className={styles.navIcon}>
//               {item.icon}
//             </span>
//             {isExpanded && (
//               <Text variant="small" className={styles.navLabel}>
//                 {item.label}
//               </Text>
//             )}
//           </Link>
//         ))}
//       </nav>
//     </aside>
//   );
// }

// export default AdminAside;