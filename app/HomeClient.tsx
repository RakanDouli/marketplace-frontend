'use client';

import {
  Grid,
  FeatureCard,
  FeaturedListings,
  PromoBanner,
  PromoCard,
  Container,
} from '@/components/slices';
import { AdContainer } from '@/components/ads';
import { SearchBarSection } from '@/components/SearchBarSection';
import { CategorySection } from '@/components/CategorySection';
import { useTranslation } from '@/hooks/useTranslation';
import { CMS_ASSETS } from '@/constants/cms-assets';
import {
  Search,
  Shield,
  Tag,
  Zap,
} from 'lucide-react';
import styles from './Home.module.scss';

// Promo cards config - "Add listing" CTAs for categories
const promoCategories = [
  {
    slug: 'real-estate',
    title: 'هل لديك عقار للبيع؟',
    subtitle: 'أضف إعلانك الآن واوصل لآلاف المشترين',
    buttonText: 'أضف إعلانك',
    buttonHref: '/dashboard/listings/create?category=real-estate',
    imageSrc: CMS_ASSETS.home.promoCards.realEstate,
    imageAlt: 'بيع عقارك',
    badge: 'جديد',
  },
  {
    slug: 'electronics',
    title: 'هل لديك جهاز للبيع؟',
    subtitle: 'أضف إعلانك الآن واوصل لآلاف المشترين',
    buttonText: 'أضف إعلانك',
    buttonHref: '/dashboard/listings/create?category=electronics',
    imageSrc: CMS_ASSETS.home.promoCards.electronics,
    imageAlt: 'بيع جهازك',
  },
];

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

export default function HomeClient() {
  const { t } = useTranslation();

  return (
    <main className={styles.homePage}>
      {/* 1. Hero + Search */}
      <SearchBarSection />

      {/* 2. Category Tabs */}
      <CategorySection />

      {/* 3. Main CTA - Sell Your Car (Dubizzle style: CTA first) */}
      <PromoBanner
        title="هل لديك سيارة للبيع؟"
        subtitle="أضف إعلانك الآن واوصل لآلاف المشترين"
        buttonText="أضف إعلانك"
        buttonHref="/dashboard/listings/create"
        imageSrc={CMS_ASSETS.home.promoBanner.car}
        imageAlt="بيع سيارتك"
      />

      {/* 4. Featured Listings */}
      <FeaturedListings
        categorySlug="cars"
        variant="grid"
        columns={5}
        mobileColumns={2}
        outerBackground="transparent"
      />

      {/* 5. Secondary CTAs - Other Categories */}
      {promoCategories.length > 0 && (
        <Container paddingY="sm" outerBackground="transparent">
          <div className={styles.promoCardsGrid}>
            {promoCategories.map((category, index) => (
              <PromoCard
                key={category.slug}
                title={category.title}
                subtitle={category.subtitle}
                buttonText={category.buttonText}
                buttonHref={category.buttonHref}
                imageSrc={category.imageSrc}
                imageAlt={category.imageAlt}
                imagePosition={index % 2 === 0 ? 'right' : 'left'}
                badge={category.badge}
              />
            ))}
          </div>
        </Container>
      )}

      {/* 6. Trust Signals - Why Choose Us (closing argument before footer) */}
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

      {/* Ads - commented out for now */}
      {/* <AdContainer placement="homepage_top" /> */}
      {/* <AdContainer placement="homepage_mid" /> */}
    </main>
  );
}
