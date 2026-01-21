'use client';

import {
  Button,
  Grid,
  FeatureCard,
  CTASection,
  FeaturedListings,
  Container,
  Text,
} from '@/components/slices';
import { AdContainer } from '@/components/ads';
import { HomeSearchBar } from '@/components/HomeSearchBar';
import { CategorySection } from '@/components/CategorySection';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Search,
  Shield,
  Tag,
  Zap,
  Car,
  Users,
  TrendingUp,
  Clock,
} from 'lucide-react';
import styles from './Home.module.scss';

// Static feature items
const features = [
  {
    icon: <Search size={28} />,
    title: 'بحث سهل',
    description: 'ابحث بسهولة عن ما تريد باستخدام فلاتر متقدمة',
  },
  {
    icon: <Shield size={28} />,
    title: 'آمن وموثوق',
    description: 'جميع البائعين موثقين وجميع المعاملات محمية',
  },
  {
    icon: <Tag size={28} />,
    title: 'أفضل الأسعار',
    description: 'قارن الأسعار واحصل على أفضل صفقة ممكنة',
  },
  {
    icon: <Zap size={28} />,
    title: 'سريع وفعال',
    description: 'انشر إعلانك في دقائق وابدأ البيع فوراً',
  },
];

// Static stats
const stats = [
  {
    icon: <Car size={36} />,
    value: '+10,000',
    label: 'إعلان نشط',
  },
  {
    icon: <Users size={36} />,
    value: '+50,000',
    label: 'مستخدم مسجل',
  },
  {
    icon: <TrendingUp size={36} />,
    value: '+100,000',
    label: 'زيارة شهرية',
  },
  {
    icon: <Clock size={36} />,
    value: '24/7',
    label: 'دعم فني',
  },
];

export default function HomeClient() {
  const { t } = useTranslation();

  return (
    <main className={styles.homePage}>
      {/* Search Bar */}
      <HomeSearchBar />

      {/* Category Section */}
      <CategorySection />

      {/* Featured Listings */}
      <FeaturedListings
        categorySlug="cars"
        outerBackground="transparent"
      />

      {/* Top Banner Ad */}
      <AdContainer placement="homepage_top" />

      {/* Stats Section - Compact */}
      <Container size="lg" paddingY="xl" outerBackground="transparent">
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.statItem}>
              <div className={styles.statIcon}>{stat.icon}</div>
              <div className={styles.statContent}>
                <Text variant="h2" className={styles.statValue}>{stat.value}</Text>
                <Text variant="small" color="secondary">{stat.label}</Text>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Features Section */}
      <Grid title="لماذا تختارنا؟" columns={4} paddingY="xl" outerBackground="transparent">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            variant="card"
          />
        ))}
      </Grid>

      {/* Mid-Page Banner Ad */}
      <AdContainer placement="homepage_mid" />

      {/* CTA Section - Start Selling */}
      <CTASection
        title="هل لديك شيء للبيع؟"
        subtitle="ابدأ الآن"
        description="انشر إعلانك مجاناً واوصل لآلاف المشترين المحتملين في سوريا"
        buttons={[
          { label: 'أضف إعلانك الآن', href: '/dashboard/listings/create', variant: 'secondary', arrow: true },
          { label: 'تعرف على الباقات', href: '/user-subscriptions', variant: 'outline', arrow: true },
        ]}
        variant="gradient"
        align="center"
        paddingY="xl"
        outerPaddingY="xl"
      />
    </main>
  );
}
