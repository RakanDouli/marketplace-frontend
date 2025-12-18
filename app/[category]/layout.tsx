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
  
  // Static fallback mapping for common categories
  const categoryNames: Record<string, { ar: string; en: string }> = {
    car: { ar: "سيارات", en: "Cars" },
    electronics: { ar: "إلكترونيات", en: "Electronics" },
    furniture: { ar: "أثاث", en: "Furniture" },
    "real-estate": { ar: "عقارات", en: "Real Estate" },
  };
  
  const category = categoryNames[categorySlug];
  const categoryNameAr = category?.ar || categorySlug.replace(/-/g, " ");
  const categoryNameEn = category?.en || categorySlug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return {
    title: `${categoryNameAr} للبيع في سوريا | السوق السوري`,
    description: `تصفح ${categoryNameAr} للبيع في السوق السوري. أفضل العروض والأسعار في سوريا. Browse quality ${categoryNameEn.toLowerCase()} listings in Syria.`,
    openGraph: {
      title: `${categoryNameAr} للبيع في سوريا`,
      description: `تصفح ${categoryNameAr} للبيع في السوق السوري`,
      type: "website",
      locale: "ar_SY",
      siteName: "السوق السوري",
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
