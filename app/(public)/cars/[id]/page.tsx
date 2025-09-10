"use client";

import { Container, Button } from "@/components/slices";
import { useTranslation, useLanguage } from "@/hooks/useTranslation";
import { useNotificationStore } from "@/store";
import { formatCurrency, formatDate } from "@/utils/i18n";
import Image from "next/image";
interface ListingDetailPageProps {
  params: { id: string };
}

// Mock data - will be replaced with API call
const getMockListing = (id: string) => ({
  id,
  title: "2020 Toyota Camry - Excellent Condition",
  description:
    "Well-maintained Toyota Camry with full service history. Perfect for families, excellent fuel economy, and reliable performance.",
  price: 25000,
  currency: "USD",
  condition: "EXCELLENT",
  location: "Damascus / دمشق",
  images: [
    "/images/placeholder-car.svg",
    "/images/placeholder-car.svg",
    "/images/placeholder-car.svg",
  ],
  specifications: {
    make: "Toyota",
    model: "Camry",
    year: 2020,
    mileage: 45000,
    transmission: "Automatic",
    fuelType: "Gasoline",
    engine: "2.5L 4-cylinder",
    color: "Silver",
  },
  isFeatured: true,
  status: "ACTIVE" as const,
  seller: {
    firstName: "Ahmad",
    lastName: "Al-Rashid",
    avatar: undefined,
    phone: "+963 11 123 4567",
    memberSince: "2022-03-15",
  },
  viewCount: 156,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
});

export default function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = params;
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { addNotification } = useNotificationStore();

  const listing = getMockListing(id);

  const handleContactSeller = () => {
    addNotification({
      type: "info",
      title: t("listing.contactSeller"),
      message:
        language === "ar"
          ? "قريباً.. وظيفة التواصل مع البائع قيد التطوير"
          : "Contact seller functionality coming soon!",
    });
  };

  const handlePlaceBid = () => {
    addNotification({
      type: "info",
      title: t("bid.placeBid"),
      message:
        language === "ar"
          ? "قريباً.. وظيفة المزايدة قيد التطوير"
          : "Bidding functionality coming soon!",
    });
  };

  const handleSaveToFavorites = () => {
    addNotification({
      type: "success",
      title: "Saved",
      message:
        language === "ar"
          ? "تم حفظ الإعلان في المفضلة"
          : "Listing saved to favorites",
    });
  };

  const getConditionLabel = (condition: string) => {
    const conditionMap = {
      NEW: language === "ar" ? "جديد" : "New",
      USED: language === "ar" ? "مستعمل" : "Used",
      EXCELLENT: language === "ar" ? "ممتاز" : "Excellent",
      GOOD: language === "ar" ? "جيد" : "Good",
      FAIR: language === "ar" ? "متوسط" : "Fair",
      POOR: language === "ar" ? "يحتاج صيانة" : "Needs Repair",
    };
    return conditionMap[condition as keyof typeof conditionMap] || condition;
  };

  return (
    <div className="py-8">
      <Container outer>
        <Container inner>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Images Section */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                <div className="aspect-video relative rounded-lg overflow-hidden">
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                  {listing.isFeatured && (
                    <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {t("listing.featured")}
                    </div>
                  )}
                </div>

                {/* Thumbnail gallery */}
                <div className="grid grid-cols-3 gap-2">
                  {listing.images.slice(1, 4).map((image, index) => (
                    <div
                      key={index}
                      className="aspect-video relative rounded-md overflow-hidden"
                    >
                      <Image
                        src={image}
                        alt={`${listing.title} ${index + 2}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Description</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {listing.description}
                </p>
              </div>

              {/* Specifications */}
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Specifications</h2>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                  <div>
                    <span className="font-medium">Make:</span>{" "}
                    {listing.specifications.make}
                  </div>
                  <div>
                    <span className="font-medium">Model:</span>{" "}
                    {listing.specifications.model}
                  </div>
                  <div>
                    <span className="font-medium">Year:</span>{" "}
                    {listing.specifications.year}
                  </div>
                  <div>
                    <span className="font-medium">Mileage:</span>{" "}
                    {listing.specifications.mileage.toLocaleString()} km
                  </div>
                  <div>
                    <span className="font-medium">Transmission:</span>{" "}
                    {listing.specifications.transmission}
                  </div>
                  <div>
                    <span className="font-medium">Fuel Type:</span>{" "}
                    {listing.specifications.fuelType}
                  </div>
                  <div>
                    <span className="font-medium">Engine:</span>{" "}
                    {listing.specifications.engine}
                  </div>
                  <div>
                    <span className="font-medium">Color:</span>{" "}
                    {listing.specifications.color}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price and Actions */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 sticky top-4">
                <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
                <div className="text-3xl font-bold text-blue-600 mb-4">
                  {formatCurrency(listing.price, listing.currency, language)}
                </div>

                <div className="flex items-center justify-between mb-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                    {getConditionLabel(listing.condition)}
                  </span>
                  <span>📍 {listing.location}</span>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handlePlaceBid}
                    className="w-full"
                    disabled={listing.status !== "ACTIVE"}
                  >
                    {listing.status !== "ACTIVE"
                      ? language === "ar"
                        ? "تم البيع"
                        : "Sold"
                      : t("bid.placeBid")}
                  </Button>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleContactSeller}
                    className="w-full"
                  >
                    {t("listing.contactSeller")}
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSaveToFavorites}
                    className="w-full"
                  >
                    {t("listing.saveToFavorites")}
                  </Button>
                </div>

                {/* Seller Info */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium mb-3">Seller Information</h3>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {listing.seller.firstName[0]}
                    </div>
                    <div>
                      <div className="font-medium">
                        {listing.seller.firstName} {listing.seller.lastName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Member since{" "}
                        {formatDate(
                          new Date(listing.seller.memberSince),
                          language
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Views: {listing.viewCount}</span>
                    <span>
                      Posted:{" "}
                      {formatDate(new Date(listing.createdAt), language)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Container>
    </div>
  );
}
