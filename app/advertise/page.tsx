'use client';

import React, { useEffect, useState } from 'react';
import { Monitor, Smartphone, Eye, MapPin, BarChart, Clock } from 'lucide-react';
import { Container, Text, Slider, Collapsible, TextSection, Loading, Grid, FeatureCard } from '@/components/slices';
import { PricingCard, ContactAdModal } from '@/components/pricing';
import type { FeatureItem } from '@/components/pricing';
import { useAdPackagesStore } from '@/stores/adPackagesStore';
import type { AdPackage } from '@/stores/adPackagesStore/types';
import { AdPlacement } from '@/common/enums';
import styles from './Advertise.module.scss';

export default function AdvertisePage() {
  const { packages, isLoading, fetchActivePackages } = useAdPackagesStore();
  const [selectedPackage, setSelectedPackage] = useState<AdPackage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchActivePackages();
  }, [fetchActivePackages]);

  const getFeatureList = (pkg: AdPackage): FeatureItem[] => {
    const features: FeatureItem[] = [];

    // Desktop dimensions
    features.push({
      icon: <Monitor size={16} />,
      label: 'سطح المكتب',
      value: `${pkg.dimensions.desktop.width} × ${pkg.dimensions.desktop.height}`,
      included: true,
    });

    // Mobile dimensions
    features.push({
      icon: <Smartphone size={16} />,
      label: 'الموبايل',
      value: `${pkg.dimensions.mobile.width} × ${pkg.dimensions.mobile.height}`,
      included: true,
    });

    // Impressions
    features.push({
      icon: <Eye size={16} />,
      label: 'عدد الظهور',
      value: pkg.impressionLimit > 0 ? pkg.impressionLimit.toLocaleString() : 'غير محدود',
      included: true,
    });

    // Placement
    const placementLabels: Record<string, string> = {
      homepage_top: 'أعلى الصفحة الرئيسية',
      homepage_mid: 'وسط الصفحة الرئيسية',
      between_listings: 'بين القوائم',
      detail_top: 'أعلى صفحة التفاصيل',
      detail_before_description: 'صفحة التفاصيل (قبل الوصف)',
      detail_bottom: 'أسفل صفحة التفاصيل',
    };

    features.push({
      icon: <MapPin size={16} />,
      label: 'الموضع',
      value: placementLabels[pkg.placement] || pkg.placement,
      included: true,
    });

    // Duration
    features.push({
      icon: <Clock size={16} />,
      label: 'المدة',
      value: `${pkg.durationDays} يوم`,
      included: true,
    });

    return features;
  };

  const handleContactClick = (pkg: AdPackage) => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
  };

  const getBadge = (pkg: AdPackage): string | undefined => {
    if (pkg.placement === AdPlacement.DETAIL_TOP || pkg.placement === AdPlacement.DETAIL_BEFORE_DESCRIPTION) {
      return 'أفضل تحويل';
    }
    if (pkg.placement === AdPlacement.HOMEPAGE_TOP && pkg.adType === 'video') {
      return 'الأكثر تأثيراً';
    }
    if (pkg.basePrice >= 300) {
      return 'الأكثر شعبية';
    }
    return undefined;
  };

  const getBadgeColor = (pkg: AdPackage): 'primary' | 'success' | 'warning' => {
    if (pkg.placement === AdPlacement.DETAIL_TOP || pkg.placement === AdPlacement.DETAIL_BEFORE_DESCRIPTION) {
      return 'success';
    }
    return 'primary';
  };

  const getMetadata = (pkg: AdPackage): React.ReactNode => {
    return (
      <div className={styles.metadata}>
        <Text variant="small" color="secondary">
          {pkg.mediaRequirements.slice(0, 3).join(' • ')}
        </Text>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Loading type="svg" />
      </div>
    );
  }

  return (
    <div className={styles.AdvertisePage}>

      <TextSection
        title="أعلن معنا - وصول إلى آلاف المستخدمين"
        subtitle="إعلانات احترافية بمعايير IAB العالمية مع تقارير شفافة وأسعار تنافسية"
        align="center"
        nostyle
      />

      <Container >

        {/* Why Advertise Section */}
        <Grid columns={4} className={styles.benefits}>
          <FeatureCard
            icon={<BarChart size={32} />}
            title="100k+ زائر شهرياً"
            description="وصول واسع لجمهورك المستهدف"
            variant="card"
          />
          <FeatureCard
            icon={<MapPin size={32} />}
            title="مشترو سيارات مستهدفون"
            description="جمهور مهتم بالسيارات فعلياً"
            variant="card"
          />
          <FeatureCard
            icon={<BarChart size={32} />}
            title="تقارير شفافة"
            description="تتبع أداء حملتك بالتفصيل"
            variant="card"
          />
          <FeatureCard
            icon={<Eye size={32} />}
            title="أسعار تنافسية"
            description="أفضل قيمة مقابل المال"
            variant="card"
          />
        </Grid>

        {/* Ad Packages */}
        <div className={styles.packagesSection}>
          <Text variant="h2">حزم الإعلانات المتاحة</Text>
          {packages.length > 0 && (
            <Slider
              slidesToShow={3}
              slidesToShowTablet={2}
              slidesToShowMobile={1}
              showArrows={true}
              showDots={true}
            >
              {packages.map((pkg) => (
                <PricingCard
                  key={pkg.id}
                  title={pkg.packageName}
                  description={pkg.description}
                  price={pkg.basePrice}
                  currency={pkg.currency}
                  billingCycle="days"
                  durationDays={pkg.durationDays}
                  features={getFeatureList(pkg)}
                  badge={getBadge(pkg)}
                  badgeColor={getBadgeColor(pkg)}
                  highlighted={pkg.placement === AdPlacement.DETAIL_TOP || pkg.placement === AdPlacement.DETAIL_BEFORE_DESCRIPTION}
                  buttonText="تواصل معنا"
                  buttonVariant="outline"
                  metadata={getMetadata(pkg)}
                  onButtonClick={() => handleContactClick(pkg)}
                />
              ))}
            </Slider>
          )}
        </div>

        {/* FAQ Section */}
        <div className={styles.faq}>
          <Text variant="h2">الأسئلة الشائعة</Text>

          <div className={styles.faqList}>
            <Collapsible title="كيف يتم الدفع؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                يتم الدفع بعد التواصل مع فريق الإعلانات وتحديد تفاصيل الحملة. نقبل الدفع عبر التحويل البنكي أو PayPal.
              </Text>
            </Collapsible>

            <Collapsible title="ما هي مواصفات الإعلانات؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                نتبع معايير IAB العالمية. كل حزمة لها مواصفات محددة (الأبعاد، الحجم، النوع). سيتم إرسال التفاصيل الكاملة بعد التواصل.
              </Text>
            </Collapsible>

            <Collapsible title="هل أحصل على تقارير أداء؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                نعم، ستحصل على رابط خاص لتتبع أداء حملتك (الظهور، النقرات، معدل التحويل) بشكل يومي.
              </Text>
            </Collapsible>

            <Collapsible title="هل يمكنني تخصيص الحزمة؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                نعم، نوفر حزم مخصصة للشركات الكبرى. تواصل معنا لمناقشة احتياجاتك الخاصة.
              </Text>
            </Collapsible>
          </div>
        </div>

        {/* Contact Modal */}
        <ContactAdModal
          package={selectedPackage}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </Container>
    </div>
  );
}
