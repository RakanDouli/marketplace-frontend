'use client';

import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/slices';

export default function AdminOverviewPage() {
  const { t, language } = useI18n();

  const stats = [
    {
      label: language === 'ar' ? 'إجمالي الإعلانات' : 'Total Listings',
      value: '1,234',
      icon: '🚗',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      label: language === 'ar' ? 'المستخدمين النشطين' : 'Active Users',
      value: '892',
      icon: '👥',
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      label: language === 'ar' ? 'المبيعات اليوم' : 'Sales Today',
      value: '45',
      icon: '💰',
      change: '+23%',
      changeType: 'positive' as const,
    },
    {
      label: language === 'ar' ? 'المزايدات الجديدة' : 'New Bids',
      value: '156',
      icon: '📈',
      change: '-2%',
      changeType: 'negative' as const,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'listing',
      message: language === 'ar' 
        ? 'تم إضافة إعلان جديد: 2020 Toyota Camry'
        : 'New listing added: 2020 Toyota Camry',
      user: 'Ahmad Al-Rashid',
      time: '5 min ago',
    },
    {
      id: 2,
      type: 'bid',
      message: language === 'ar'
        ? 'مزايدة جديدة على Honda Civic 2018'
        : 'New bid on Honda Civic 2018',
      user: 'Fatima Khalil',
      time: '12 min ago',
    },
    {
      id: 3,
      type: 'user',
      message: language === 'ar'
        ? 'مستخدم جديد انضم للمنصة'
        : 'New user registered',
      user: 'Omar Nasser',
      time: '1 hour ago',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {language === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          {language === 'ar' 
            ? 'مرحباً بك في لوحة إدارة السوق السوري للسيارات'
            : 'Welcome to Syrian Car Marketplace Admin Panel'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stat.value}
                </p>
                <p className={`text-sm mt-2 ${
                  stat.changeType === 'positive' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {stat.change} from last month
                </p>
              </div>
              <div className="text-3xl">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
            </h2>
            <Button variant="ghost" size="sm">
              {language === 'ar' ? 'عرض الكل' : 'View All'}
            </Button>
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'listing' ? 'bg-blue-500' :
                  activity.type === 'bid' ? 'bg-green-500' : 'bg-purple-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    by {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
          </h2>
          
          <div className="space-y-3">
            <Button variant="primary" size="md" className="w-full justify-start">
              📝 {language === 'ar' ? 'إضافة إعلان' : 'Add Listing'}
            </Button>
            <Button variant="ghost" size="md" className="w-full justify-start">
              👤 {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
            </Button>
            <Button variant="ghost" size="md" className="w-full justify-start">
              📊 {language === 'ar' ? 'تقرير شامل' : 'Generate Report'}
            </Button>
            <Button variant="ghost" size="md" className="w-full justify-start">
              ⚙️ {language === 'ar' ? 'إعدادات النظام' : 'System Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}