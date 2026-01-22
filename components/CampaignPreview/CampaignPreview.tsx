import React from 'react';
import { Text } from '@/components/slices';
import { Package, Calendar, DollarSign, Image, Video, ExternalLink, Zap } from 'lucide-react';
import styles from './CampaignPreview.module.scss';

interface CampaignPackageData {
  packageId: string;
  packageData: {
    packageName: string;
    adType: string;
    placement: string;
    format: string;
    dimensions: {
      desktop: { width: number; height: number };
      mobile: { width: number; height: number };
    };
    basePrice: number;
    durationDays: number;
    impressionLimit: number;
  };
  startDate: string | null;
  endDate: string | null;
  isAsap: boolean;
  desktopMediaUrl: string;
  mobileMediaUrl: string;
  clickUrl?: string;
  openInNewTab?: boolean;
}

interface PackageBreakdown {
  packages: CampaignPackageData[];
  discountPercentage?: number;
  discountReason?: string;
  totalBeforeDiscount: number;
  totalAfterDiscount: number;
}

interface CampaignPreviewProps {
  campaign: {
    campaignName: string;
    description?: string;
    totalPrice: number;
    currency: string;
    startDate: string;
    endDate: string;
    isCustomPackage: boolean;
    packageBreakdown?: PackageBreakdown;
    package?: {
      packageName: string;
      adType: string;
    };
    client: {
      companyName: string;
      contactName: string;
      contactEmail: string;
    };
  };
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'غير محدد';
  return new Date(dateString).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getAdTypeName = (adType: string) => {
  const types: Record<string, string> = {
    'IMAGE': 'صورة',
    'VIDEO': 'فيديو',
    'between_listings_banner': 'إعلان بين القوائم',
    'homepage_top': 'الصفحة الرئيسية - أعلى',
    'homepage_mid': 'الصفحة الرئيسية - وسط',
    'detail_top': 'صفحة التفاصيل - أعلى',
    'detail_before_description': 'صفحة التفاصيل - قبل الوصف',
  };
  return types[adType] || adType;
};

export const CampaignPreview: React.FC<CampaignPreviewProps> = ({ campaign }) => {
  const hasMultiplePackages = campaign.isCustomPackage && campaign.packageBreakdown?.packages && campaign.packageBreakdown.packages.length > 0;
  const hasDiscount = campaign.packageBreakdown && campaign.packageBreakdown.discountPercentage && campaign.packageBreakdown.discountPercentage > 0;

  return (
    <div className={styles.preview}>
      {/* Campaign Header */}
      <div className={styles.header}>
        <div className={styles.icon}>
          <Package size={32} />
        </div>
        <div className={styles.headerContent}>
          <Text variant="h3">{campaign.campaignName}</Text>
          {campaign.description && (
            <Text variant="small" color="secondary">{campaign.description}</Text>
          )}
        </div>
      </div>

      {/* Client Info */}
      <div className={styles.section}>
        <Text variant="h4">معلومات العميل</Text>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Text variant="small" color="secondary">اسم الشركة</Text>
            <Text variant="paragraph">{campaign.client.companyName}</Text>
          </div>
          <div className={styles.infoItem}>
            <Text variant="small" color="secondary">جهة الاتصال</Text>
            <Text variant="paragraph">{campaign.client.contactName}</Text>
          </div>
          <div className={styles.infoItem}>
            <Text variant="small" color="secondary">البريد الإلكتروني</Text>
            <Text variant="paragraph">{campaign.client.contactEmail}</Text>
          </div>
        </div>
      </div>

      {/* Package(s) Details */}
      {hasMultiplePackages ? (
        <>
          <div className={styles.section}>
            <Text variant="h4">الحزم الإعلانية ({campaign.packageBreakdown!.packages.length})</Text>
            <div className={styles.packagesContainer}>
              {campaign.packageBreakdown!.packages.map((pkg, index) => (
                <div key={index} className={styles.packageCard}>
                  <div className={styles.packageHeader}>
                    <div className={styles.packageNumber}>#{index + 1}</div>
                    <Text variant="h4">{pkg.packageData.packageName}</Text>
                    {pkg.isAsap && (
                      <div className={styles.asapBadge}>
                        <Zap size={14} />
                        <span>ASAP</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.packageDetails}>
                    <div className={styles.detailRow}>
                      <Text variant="small" color="secondary">نوع الإعلان</Text>
                      <div className={styles.mediaType}>
                        {pkg.packageData.adType === 'IMAGE' ? <Image size={16} /> : <Video size={16} />}
                        <Text variant="paragraph">{getAdTypeName(pkg.packageData.adType)}</Text>
                      </div>
                    </div>

                    <div className={styles.detailRow}>
                      <Text variant="small" color="secondary">الموضع</Text>
                      <Text variant="paragraph">{getAdTypeName(pkg.packageData.placement)}</Text>
                    </div>

                    <div className={styles.detailRow}>
                      <Text variant="small" color="secondary">الأبعاد (سطح المكتب)</Text>
                      <Text variant="paragraph">
                        {pkg.packageData.dimensions.desktop.width}x{pkg.packageData.dimensions.desktop.height}px
                      </Text>
                    </div>

                    <div className={styles.detailRow}>
                      <Text variant="small" color="secondary">الأبعاد (موبايل)</Text>
                      <Text variant="paragraph">
                        {pkg.packageData.dimensions.mobile.width}x{pkg.packageData.dimensions.mobile.height}px
                      </Text>
                    </div>

                    <div className={styles.detailRow}>
                      <Text variant="small" color="secondary">مرات الظهور المضمونة</Text>
                      <Text variant="paragraph">{pkg.packageData.impressionLimit.toLocaleString('en-US')}</Text>
                    </div>

                    <div className={styles.detailRow}>
                      <Text variant="small" color="secondary">المدة</Text>
                      <div className={styles.duration}>
                        <Calendar size={16} />
                        <Text variant="paragraph">{pkg.packageData.durationDays} يوم</Text>
                      </div>
                    </div>

                    <div className={styles.detailRow}>
                      <Text variant="small" color="secondary">تاريخ البدء</Text>
                      <Text variant="paragraph">
                        {pkg.isAsap ? '⚡ فوراً بعد الدفع' : formatDate(pkg.startDate)}
                      </Text>
                    </div>

                    <div className={styles.detailRow}>
                      <Text variant="small" color="secondary">تاريخ الانتهاء</Text>
                      <Text variant="paragraph">
                        {pkg.isAsap ? 'يُحسب بعد الدفع' : formatDate(pkg.endDate)}
                      </Text>
                    </div>

                    {pkg.clickUrl && (
                      <div className={styles.detailRow}>
                        <Text variant="small" color="secondary">رابط النقر</Text>
                        <div className={styles.clickUrl}>
                          <ExternalLink size={14} />
                          <Text variant="small">{pkg.clickUrl}</Text>
                        </div>
                      </div>
                    )}

                    <div className={styles.priceRow}>
                      <Text variant="small" color="secondary">السعر</Text>
                      <div className={styles.packagePrice}>
                        <DollarSign size={18} />
                        <Text variant="h4">{pkg.packageData.basePrice.toFixed(2)}</Text>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className={styles.section}>
          <Text variant="h4">تفاصيل الحزمة</Text>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <Text variant="small" color="secondary">اسم الحزمة</Text>
              <Text variant="paragraph">{campaign.package?.packageName}</Text>
            </div>
            <div className={styles.infoItem}>
              <Text variant="small" color="secondary">نوع الإعلان</Text>
              <Text variant="paragraph">{getAdTypeName(campaign.package?.adType || '')}</Text>
            </div>
            <div className={styles.infoItem}>
              <Text variant="small" color="secondary">تاريخ البدء</Text>
              <Text variant="paragraph">{formatDate(campaign.startDate)}</Text>
            </div>
            <div className={styles.infoItem}>
              <Text variant="small" color="secondary">تاريخ الانتهاء</Text>
              <Text variant="paragraph">{formatDate(campaign.endDate)}</Text>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Summary */}
      <div className={styles.pricingSummary}>
        <Text variant="h4">ملخص التكلفة</Text>
        <div className={styles.pricingDetails}>
          {hasDiscount && (
            <>
              <div className={styles.pricingRow}>
                <Text variant="paragraph">الإجمالي قبل الخصم</Text>
                <Text variant="paragraph">
                  {campaign.packageBreakdown!.totalBeforeDiscount.toFixed(2)} {campaign.currency}
                </Text>
              </div>
              <div className={styles.discountRow}>
                <div>
                  <Text variant="paragraph">الخصم ({campaign.packageBreakdown!.discountPercentage}%)</Text>
                  {campaign.packageBreakdown!.discountReason && (
                    <Text variant="small" color="secondary">{campaign.packageBreakdown!.discountReason}</Text>
                  )}
                </div>
                <Text variant="paragraph" color="success">
                  -{(campaign.packageBreakdown!.totalBeforeDiscount - campaign.packageBreakdown!.totalAfterDiscount).toFixed(2)} {campaign.currency}
                </Text>
              </div>
            </>
          )}
          <div className={styles.totalRow}>
            <Text variant="h4">الإجمالي المطلوب</Text>
            <div className={styles.totalAmount}>
              <DollarSign size={24} />
              <Text variant="h3">{campaign.totalPrice.toFixed(2)}</Text>
              <Text variant="paragraph">{campaign.currency}</Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
