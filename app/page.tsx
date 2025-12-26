"use client";

import {
  Container,
  TextSection,
  Button,
  Grid,
  FeatureCard,
  CTASection,
  FeaturedListings,
  Text,
} from "@/components/slices";
import { AdContainer } from "@/components/ads";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Search,
  Shield,
  Tag,
  Zap,
  Car,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";
import styles from "./Home.module.scss";

export default function HomePage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Search size={32} />,
      title: "بحث سهل",
      description: "ابحث بسهولة عن سيارتك المثالية باستخدام فلاتر متقدمة",
    },
    {
      icon: <Shield size={32} />,
      title: "آمن وموثوق",
      description: "جميع البائعين موثقين وجميع المعاملات محمية",
    },
    {
      icon: <Tag size={32} />,
      title: "أفضل الأسعار",
      description: "قارن الأسعار واحصل على أفضل صفقة ممكنة",
    },
    {
      icon: <Zap size={32} />,
      title: "سريع وفعال",
      description: "انشر إعلانك في دقائق وابدأ البيع فوراً",
    },
  ];

  const stats = [
    {
      icon: <Car size={32} />,
      title: "+10,000",
      description: "إعلان نشط",
    },
    {
      icon: <Users size={32} />,
      title: "+50,000",
      description: "مستخدم مسجل",
    },
    {
      icon: <TrendingUp size={32} />,
      title: "+100,000",
      description: "زيارة شهرية",
    },
    {
      icon: <Clock size={32} />,
      title: "24/7",
      description: "دعم على مدار الساعة",
    },
  ];

  return (
    <main className={styles.homePage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <Container>
          <TextSection
            title={t("homepage.hero.title")}
            subtitle={t("homepage.hero.subtitle")}
            body={t("homepage.hero.description")}
            align="center"
            nostyle
          >
            <div className={styles.heroButtons}>
              <Button variant="primary" size="lg" href="/cars">
                {t("nav.listings")}
              </Button>
              <Button variant="secondary" size="lg" href="/dashboard/listings/create">
                {t("nav.sell")}
              </Button>
            </div>
          </TextSection>
        </Container>
      </section>

      {/* Top Banner Ad */}
      <Container size="lg" paddingY="md">
        <AdContainer placement="homepage_top" />
      </Container>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <Container>
          <div className={styles.sectionHeader}>
            <Text variant="h2">لماذا تختارنا؟</Text>
            <Text variant="paragraph" color="secondary">
              نوفر لك أفضل تجربة لبيع وشراء السيارات في سوريا
            </Text>
          </div>
          <Grid columns={4}>
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
        </Container>
      </section>

      {/* Featured Listings - Cars */}
      <FeaturedListings
        categorySlug="car"
        limit={8}
      />

      {/* Mid-Page Banner Ad */}
      <Container size="lg" paddingY="md">
        <AdContainer placement="homepage_mid" />
      </Container>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <Container>
          <div className={styles.sectionHeader}>
            <Text variant="h2">أرقامنا تتحدث</Text>
          </div>
          <Grid columns={4}>
            {stats.map((stat, index) => (
              <FeatureCard
                key={index}
                icon={stat.icon}
                title={stat.title}
                description={stat.description}
                variant="default"
              />
            ))}
          </Grid>
        </Container>
      </section>

      {/* CTA Section - Sell Your Car */}
      <CTASection
        title="هل تريد بيع سيارتك؟"
        subtitle="ابدأ الآن"
        description="انشر إعلانك مجاناً واوصل لآلاف المشترين المحتملين في سوريا"
        buttons={[
          { label: "أضف إعلانك الآن", href: "/dashboard/listings/create", variant: "secondary" },
          { label: "تعرف على الباقات", href: "/user-subscriptions", variant: "outline" },
        ]}
        variant="gradient"
        align="center"
      />

      {/* Advertise CTA Section */}
      <CTASection
        title="هل لديك عمل تجاري؟"
        subtitle="أعلن معنا"
        description="اوصل لجمهورك المستهدف من خلال إعلاناتنا المتميزة"
        buttons={[
          { label: "تصفح باقات الإعلانات", href: "/advertise", variant: "primary" },
          { label: "تواصل معنا", href: "/contact", variant: "outline" },
        ]}
        variant="secondary"
        align="center"
      />
    </main>
  );
}
