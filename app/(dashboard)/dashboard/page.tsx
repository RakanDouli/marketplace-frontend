"use client";

import { useTranslation, useLanguage } from "@/hooks/useTranslation";
import { Button } from "@/components/slices";

export default function UserDashboardPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const userStats = [
    {
      label: language === "ar" ? "إعلاناتي" : "My Listings",
      value: "12",
      icon: "🚗",
      href: "/dashboard/listings",
    },
    {
      label: language === "ar" ? "مزايداتي" : "My Bids",
      value: "8",
      icon: "💰",
      href: "/dashboard/bids",
    },
    {
      label: language === "ar" ? "المفضلة" : "Favorites",
      value: "24",
      icon: "❤️",
      href: "/dashboard/favorites",
    },
    {
      label: language === "ar" ? "الرسائل" : "Messages",
      value: "5",
      icon: "💬",
      href: "/dashboard/messages",
    },
  ];

  const recentListings = [
    {
      id: 1,
      title: "2020 Toyota Camry",
      price: 25000,
      status: "active",
      views: 156,
      bids: 3,
      postedAt: "2024-01-15",
    },
    {
      id: 2,
      title: "2018 Honda Civic",
      price: 18500,
      status: "sold",
      views: 89,
      bids: 7,
      postedAt: "2024-01-12",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {language === "ar" ? "لوحة التحكم" : "Dashboard"}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          {language === "ar"
            ? "مرحباً بك، إدارة إعلاناتك ومزايداتك"
            : "Welcome back! Manage your listings and bids"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {userStats.map((stat, index) => (
          <div key={index}>
            <div className="flex items-center justify-between">
              <div>
                <p>{stat.label}</p>
                <p>{stat.value}</p>
              </div>
              <div className="text-2xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Listings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {language === "ar" ? "إعلاناتي الأخيرة" : "Recent Listings"}
            </h2>
            <Button variant="primary" size="sm">
              {language === "ar" ? "عرض الكل" : "View All"}
            </Button>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentListings.map((listing) => (
            <div key={listing.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {listing.title}
                  </h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>${listing.price.toLocaleString()}</span>
                    <span>👁️ {listing.views}</span>
                    <span>💰 {listing.bids} bids</span>
                    <span>📅 {listing.postedAt}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      listing.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {listing.status === "active"
                      ? language === "ar"
                        ? "نشط"
                        : "Active"
                      : language === "ar"
                      ? "تم البيع"
                      : "Sold"}
                  </span>
                  <Button variant="primary" size="sm">
                    {language === "ar" ? "عرض" : "View"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {language === "ar" ? "إجراءات سريعة" : "Quick Actions"}
          </h3>
          <div className="space-y-3">
            <Button
              variant="primary"
              size="md"
              className="w-full justify-start"
            >
              ➕ {language === "ar" ? "إضافة إعلان جديد" : "Add New Listing"}
            </Button>
            <Button
              variant="primary"
              size="md"
              className="w-full justify-start"
            >
              🔍 {language === "ar" ? "تصفح المزايدات" : "Browse Auctions"}
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {language === "ar" ? "نصائح" : "Tips"}
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>
              •{" "}
              {language === "ar"
                ? "أضف صور واضحة لسيارتك"
                : "Add clear photos of your vehicle"}
            </li>
            <li>
              •{" "}
              {language === "ar"
                ? "اكتب وصف مفصل وصادق"
                : "Write detailed and honest descriptions"}
            </li>
            <li>
              •{" "}
              {language === "ar" ? "حدد سعر تنافسي" : "Set competitive pricing"}
            </li>
            <li>
              •{" "}
              {language === "ar"
                ? "رد على الاستفسارات بسرعة"
                : "Respond to inquiries quickly"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
