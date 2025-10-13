'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Text, Button } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { BarChart3, Eye, Heart, MessageCircle, TrendingUp } from 'lucide-react';
import styles from './Analytics.module.scss';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user } = useUserAuthStore();

  // Check if user has access to analytics (dealer or business only)
  useEffect(() => {
    if (!user) {
      router.push('/dashboard');
      return;
    }

    if (user.accountType === 'individual') {
      // Redirect individuals to upgrade page
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || user.accountType === 'individual') {
    return null;
  }

  // Mock analytics data
  const stats = [
    {
      icon: <Eye size={24} />,
      label: 'إجمالي المشاهدات',
      value: '12,450',
      change: '+23%',
      positive: true,
    },
    {
      icon: <Heart size={24} />,
      label: 'المفضلة',
      value: '1,284',
      change: '+12%',
      positive: true,
    },
    {
      icon: <MessageCircle size={24} />,
      label: 'الاستفسارات',
      value: '342',
      change: '-5%',
      positive: false,
    },
    {
      icon: <TrendingUp size={24} />,
      label: 'معدل التحويل',
      value: '3.2%',
      change: '+0.8%',
      positive: true,
    },
  ];

  return (
    <div className={styles.analytics}>
      <div className={styles.header}>
        <div>
          <Text variant="h2">الإحصائيات</Text>
          <Text variant="small" color="muted">
            متاح فقط لحسابات المعارض والتجار
          </Text>
        </div>
        <Button icon={<BarChart3 size={20} />}>تصدير التقرير</Button>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} className={styles.statCard}>
            <div className={styles.statIcon}>{stat.icon}</div>
            <div className={styles.statContent}>
              <Text variant="small" color="muted">
                {stat.label}
              </Text>
              <Text variant="h2" className={styles.statValue}>
                {stat.value}
              </Text>
              <span
                className={`${styles.statChange} ${
                  stat.positive ? styles.positive : styles.negative
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className={styles.chartsSection}>
        <div className={styles.chartCard}>
          <Text variant="h3">المشاهدات خلال الأسبوع</Text>
          <div className={styles.chartPlaceholder}>
            <BarChart3 size={48} className={styles.chartIcon} />
            <Text variant="paragraph" color="muted">
              سيتم إضافة الرسوم البيانية قريباً
            </Text>
          </div>
        </div>

        <div className={styles.chartCard}>
          <Text variant="h3">أداء الإعلانات</Text>
          <div className={styles.chartPlaceholder}>
            <TrendingUp size={48} className={styles.chartIcon} />
            <Text variant="paragraph" color="muted">
              سيتم إضافة الرسوم البيانية قريباً
            </Text>
          </div>
        </div>
      </div>

      {/* Upgrade message for free plans */}
      {user.subscription?.planId === 'free_starter' && (
        <div className={styles.upgradeCard}>
          <Text variant="h3">احصل على المزيد من الإحصائيات</Text>
          <Text variant="paragraph" color="muted">
            قم بترقية خطتك للحصول على تقارير مفصلة وتحليلات متقدمة
          </Text>
          <Button variant="primary">ترقية الخطة</Button>
        </div>
      )}
    </div>
  );
}
