import { Metadata } from "next";

interface CategoryLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    category: string;
  }>;
}

// Static metadata - avoid SSR issues
export async function generateMetadata({
  params,
}: CategoryLayoutProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  
  // Static fallback mapping for common categories (use actual slugs from DB)
  const categoryNames: Record<string, { ar: string; en: string }> = {
    cars: { ar: "سيارات", en: "Cars" },
    electronics: { ar: "إلكترونيات", en: "Electronics" },
    furniture: { ar: "أثاث", en: "Furniture" },
    "real-estate": { ar: "عقارات", en: "Real Estate" },
    phones: { ar: "هواتف", en: "Phones" },
    motorcycles: { ar: "دراجات نارية", en: "Motorcycles" },
    jobs: { ar: "وظائف", en: "Jobs" },
    services: { ar: "خدمات", en: "Services" },
  };

  const category = categoryNames[categorySlug];
  // Fallback to generic Arabic text instead of showing English slug
  const categoryNameAr = category?.ar || "إعلانات";
  const categoryNameEn = category?.en || "Listings";

  return {
    title: `${categoryNameAr} للبيع في سوريا | شام باي`,
    description: `تصفح ${categoryNameAr} للبيع على شام باي. أفضل العروض والأسعار في سوريا. Browse quality ${categoryNameEn.toLowerCase()} listings in Syria.`,
    openGraph: {
      title: `${categoryNameAr} للبيع في سوريا`,
      description: `تصفح ${categoryNameAr} للبيع على شام باي`,
      type: "website",
      locale: "ar_SY",
      siteName: "شام باي",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function CategoryLayout({ children }: CategoryLayoutProps) {
  return children;
}
