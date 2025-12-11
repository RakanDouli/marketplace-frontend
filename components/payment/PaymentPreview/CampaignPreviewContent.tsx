import React from 'react';
import { Text } from '@/components/slices';
import { Package, Calendar, DollarSign, Image, Video, ExternalLink, Zap, CreditCard, ArrowLeftRight, Receipt } from 'lucide-react';
import type { AdCampaignPaymentData, PaymentFeeInfo } from '../types';
import styles from './PaymentPreview.module.scss';

interface CampaignPreviewContentProps {
  data: AdCampaignPaymentData;
  feeInfo?: PaymentFeeInfo | null;
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

// Format numbers with thousand separators (English digits)
const formatNumber = (num: number, decimals: number = 2) => {
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const CampaignPreviewContent: React.FC<CampaignPreviewContentProps> = ({ data: campaign, feeInfo }) => {
  const hasMultiplePackages = Boolean(campaign.isCustomPackage && campaign.packageBreakdown?.packages && campaign.packageBreakdown.packages.length > 0);
  const hasDiscount = Boolean(campaign.packageBreakdown && campaign.packageBreakdown.discountPercentage && campaign.packageBreakdown.discountPercentage > 0);

  // Calculate totals based on whether payment method is selected
  const baseAmount = campaign.totalPrice;
  const hasPaymentMethod = feeInfo && feeInfo.paymentMethod !== null;
  const taxRate = feeInfo?.taxRate || 0;
  const taxAmount = feeInfo?.taxAmount || 0;
  const processingFee = hasPaymentMethod ? feeInfo.processingFee : 0;
  const finalTotal = feeInfo?.totalWithFee || baseAmount;
  const finalTotalSyp = feeInfo?.totalInSyp || 0;

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

                    {pkg.packageData.dimensions && (
                      <>
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
                      </>
                    )}

                    {pkg.packageData.impressionLimit && (
                      <div className={styles.detailRow}>
                        <Text variant="small" color="secondary">مرات الظهور المضمونة</Text>
                        <Text variant="paragraph">{pkg.packageData.impressionLimit.toLocaleString('ar-EG')}</Text>
                      </div>
                    )}

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
          <Text variant="h4">الحزمة الإعلانية</Text>
          <div className={styles.packagesContainer}>
            <div className={styles.packageCard}>
              <div className={styles.packageHeader}>
                <Text variant="h4">{campaign.package?.packageName}</Text>
              </div>

              <div className={styles.packageDetails}>
                <div className={styles.detailRow}>
                  <Text variant="small" color="secondary">نوع الإعلان</Text>
                  <div className={styles.mediaType}>
                    {campaign.package?.adType === 'IMAGE' ? <Image size={16} /> : <Video size={16} />}
                    <Text variant="paragraph">{getAdTypeName(campaign.package?.adType || '')}</Text>
                  </div>
                </div>

                <div className={styles.detailRow}>
                  <Text variant="small" color="secondary">تاريخ البدء</Text>
                  <Text variant="paragraph">{formatDate(campaign.startDate)}</Text>
                </div>

                <div className={styles.detailRow}>
                  <Text variant="small" color="secondary">تاريخ الانتهاء</Text>
                  <Text variant="paragraph">{formatDate(campaign.endDate)}</Text>
                </div>

                <div className={styles.priceRow}>
                  <Text variant="small" color="secondary">السعر</Text>
                  <div className={styles.packagePrice}>
                    <DollarSign size={18} />
                    <Text variant="h4">{campaign.totalPrice.toFixed(2)}</Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Summary */}
      <div className={styles.pricingSummary}>
        <div className={styles.pricingDetails}>
          {/* Show discount breakdown if applicable */}
          {hasDiscount && campaign.packageBreakdown?.totalBeforeDiscount && (
            <>
              <div className={styles.pricingRow}>
                <Text variant="paragraph" color="secondary">السعر الأصلي</Text>
                <Text variant="paragraph">{campaign.packageBreakdown.totalBeforeDiscount.toFixed(2)} {campaign.currency}</Text>
              </div>
              <div className={styles.discountRow}>
                <div>
                  <Text variant="paragraph">الخصم ({campaign.packageBreakdown.discountPercentage}%)</Text>
                  {campaign.packageBreakdown.discountReason && (
                    <Text variant="small" color="secondary">{campaign.packageBreakdown.discountReason}</Text>
                  )}
                </div>
                <Text variant="paragraph">-{(campaign.packageBreakdown.totalBeforeDiscount - campaign.totalPrice).toFixed(2)} {campaign.currency}</Text>
              </div>
              <div className={styles.pricingRow}>
                <Text variant="paragraph" color="secondary">المبلغ بعد الخصم</Text>
                <Text variant="paragraph">{baseAmount.toFixed(2)} {campaign.currency}</Text>
              </div>
            </>
          )}

          {/* Show base amount if no discount */}
          {!hasDiscount && (
            <div className={styles.pricingRow}>
              <Text variant="paragraph" color="secondary">المبلغ</Text>
              <Text variant="paragraph">{baseAmount.toFixed(2)} {campaign.currency}</Text>
            </div>
          )}

          {/* Tax Row - Always show if tax rate > 0 (tax is INCLUDED in price) */}
          {taxRate > 0 && (
            <div className={styles.taxRow}>
              <div className={styles.feeLabel}>
                <Receipt size={16} />
                <Text variant="paragraph">الضريبة ({taxRate}%) - شامل</Text>
              </div>
              <Text variant="paragraph" color="secondary">{taxAmount.toFixed(2)} {campaign.currency}</Text>
            </div>
          )}

          {/* Processing Fee - Only show when payment method is selected */}
          {hasPaymentMethod && processingFee > 0 && (
            <div className={styles.processingFeeRow}>
              <div className={styles.feeLabel}>
                <CreditCard size={16} />
                <Text variant="paragraph">رسوم المعالجة ({feeInfo.paymentMethodNameAr})</Text>
              </div>
              <Text variant="paragraph">+{processingFee.toFixed(2)} {campaign.currency}</Text>
            </div>
          )}
        </div>

        {/* Final Total in USD */}
        <div className={styles.totalRow}>
          <Text variant="h4">الإجمالي المطلوب</Text>
          <div className={styles.totalAmount}>
            <DollarSign size={24} />
            <Text variant="h3">{finalTotal.toFixed(2)} {campaign.currency}</Text>
          </div>
        </div>

        {/* Syrian Pound Total - Always show if exchange rate is available */}
        {feeInfo?.exchangeRate && feeInfo.exchangeRate > 0 && (
          <div className={styles.sypTotalSection}>
            <div className={styles.exchangeRateRow}>
              <div className={styles.exchangeInfo}>
                <ArrowLeftRight size={16} />
                <Text variant="small" color="secondary">
                  سعر الصرف: 1 {campaign.currency} = {formatNumber(feeInfo.exchangeRate, 0)} ل.س
                </Text>
              </div>
            </div>
            <div className={styles.sypTotalRow}>
              <Text variant="h4">الإجمالي بالليرة السورية</Text>
              <div className={styles.sypAmount}>
                <Text variant="h3">{formatNumber(finalTotalSyp, 0)} ل.س</Text>
              </div>
            </div>
          </div>
        )}

        {/* Prompt to select payment method if not selected */}
        {!hasPaymentMethod && (
          <div className={styles.selectMethodPrompt}>
            <Text variant="small" color="secondary">
              اختر طريقة الدفع لعرض الرسوم النهائية والمبلغ بالليرة السورية
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};
