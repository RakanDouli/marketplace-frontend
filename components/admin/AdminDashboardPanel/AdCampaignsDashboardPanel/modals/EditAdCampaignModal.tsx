'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button, Text, Form, Image } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { useAdminAuthStore } from '@/stores/admin/adminAuthStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAdminAdCampaignsStore, type AdCampaign } from '@/stores/admin/adminAdCampaignsStore';
import { Copy, RefreshCw, Plus, Edit2, Trash2, Mail } from 'lucide-react';
import {
  validateEditAdCampaignForm,
  hasValidationErrors,
  type ValidationErrors,
} from '@/lib/admin/validation/adCampaignValidation';
import { AddPackageModal, type CampaignPackage } from './AddPackageModal';
import { deleteFromCloudflare } from '@/utils/cloudflare-upload';
import { formatAdPrice } from '@/utils/formatPrice';
import styles from './AdCampaignModals.module.scss';

interface EditAdCampaignModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData: AdCampaign | null;
  isLoading: boolean;
}

interface AdClient {
  id: string;
  companyName: string;
}

interface AdPackage {
  id: string;
  packageName: string;
  basePrice: number;
  currency: string;
  adType: string;
  placement: string;
  format: string;
  dimensions: {
    desktop: { width: number; height: number };
    mobile: { width: number; height: number };
  };
  mediaRequirements: string[];
}

const makeGraphQLCall = async (query: string, variables: any = {}, token?: string) => {
  const response = await fetch("http://localhost:4000/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }
  return result.data;
};

export const EditAdCampaignModal: React.FC<EditAdCampaignModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  initialData,
  isLoading
}) => {
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { user } = useAdminAuthStore();
  const { addNotification } = useNotificationStore();
  const { regeneratePublicReportToken } = useAdminAdCampaignsStore();
  const [clients, setClients] = useState<AdClient[]>([]);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [regeneratingToken, setRegeneratingToken] = useState(false);
  const [campaignPackages, setCampaignPackages] = useState<CampaignPackage[]>([]);
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [editingPackageIndex, setEditingPackageIndex] = useState<number | null>(null);
  const [sendingPaymentLink, setSendingPaymentLink] = useState(false);

  // Discount state (campaign-level, stored in packageBreakdown only)
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');

  // Convert clients to options format for Input select
  const clientOptions = clients.map(client => ({
    value: client.id,
    label: client.companyName
  }));

  const [formData, setFormData] = useState({
    id: '',
    campaignName: '',
    description: '',
    clientId: '',
    packageId: '',
    isCustomPackage: false,
    startPreference: 'SPECIFIC_DATE',
    startDate: '',
    endDate: '',
    totalPrice: 0,
    currency: 'USD',
    notes: '',
    paymentLink: '',
  });

  // Populate form when initialData changes
  useEffect(() => {
    if (initialData) {
      console.log('🔵 EditAdCampaignModal - initialData:', initialData);
      console.log('🔵 packageBreakdown:', initialData.packageBreakdown);

      setFormData({
        id: initialData.id,
        campaignName: initialData.campaignName,
        description: initialData.description || '',
        clientId: initialData.clientId,
        packageId: initialData.packageId,
        isCustomPackage: initialData.isCustomPackage,
        startPreference: initialData.startPreference,
        startDate: initialData.startDate.split('T')[0],
        endDate: initialData.endDate.split('T')[0],
        totalPrice: initialData.totalPrice,
        currency: initialData.currency,
        notes: initialData.notes || '',
        paymentLink: initialData.paymentLink || '',
      });

      // Parse packageBreakdown if exists
      // Note: packageBreakdown structure from backend is simplified, we need to reconstruct it
      if (initialData.packageBreakdown?.packages && Array.isArray(initialData.packageBreakdown.packages)) {
        console.log('✅ Found packages in packageBreakdown:', initialData.packageBreakdown.packages);

        // Transform backend structure to full CampaignPackage structure
        const transformedPackages: CampaignPackage[] = initialData.packageBreakdown.packages.map((pkg: any) => ({
          packageId: pkg.packageId,
          packageData: pkg.packageData || {
            // Fallback for old flattened structure
            id: pkg.packageId,
            packageName: pkg.packageName || 'Unknown Package',
            basePrice: pkg.basePrice || pkg.price || 0,
            currency: 'USD',
            adType: pkg.adType || 'BANNER',
            placement: pkg.placement || '',
            format: pkg.format || '',
            durationDays: pkg.durationDays || 30,
            impressionLimit: pkg.impressionLimit || 0,
            dimensions: pkg.dimensions || {
              desktop: { width: 970, height: 250 },
              mobile: { width: 300, height: 250 }
            },
            mediaRequirements: pkg.mediaRequirements || []
          },
          startDate: pkg.startDate || initialData.startDate.split('T')[0],
          endDate: pkg.endDate || initialData.endDate.split('T')[0],
          isAsap: pkg.isAsap || false,
          desktopMediaUrl: pkg.desktopMediaUrl || '',
          mobileMediaUrl: pkg.mobileMediaUrl || '',
          clickUrl: pkg.clickUrl,
          openInNewTab: pkg.openInNewTab,
          customPrice: pkg.customPrice || pkg.price,
        }));

        console.log('📦 Transformed packages:', transformedPackages);
        setCampaignPackages(transformedPackages);

        // Load discount data from packageBreakdown
        if (initialData.packageBreakdown.discountPercentage) {
          setDiscountPercentage(initialData.packageBreakdown.discountPercentage);
        }
        if (initialData.packageBreakdown.discountReason) {
          setDiscountReason(initialData.packageBreakdown.discountReason);
        }
      } else {
        console.log('❌ No packages found in packageBreakdown');
        setCampaignPackages([]);
      }
    }
  }, [initialData]);

  // Auto-update total price when packages or discount change
  useEffect(() => {
    if (campaignPackages.length > 0) {
      const calculatedTotal = calculateTotalPrice();
      setFormData(prev => ({ ...prev, totalPrice: calculatedTotal }));
    }
  }, [campaignPackages, discountPercentage]);

  // Auto-calculate end date when start date or packages change
  useEffect(() => {
    if (formData.startDate && campaignPackages.length > 0) {
      // Get the maximum duration from all packages
      const maxDuration = Math.max(
        ...campaignPackages.map(pkg => pkg.packageData.durationDays || 30)
      );

      // Calculate end date
      const startDate = new Date(formData.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + maxDuration);

      // Format as YYYY-MM-DD
      const endDateStr = endDate.toISOString().split('T')[0];

      setFormData(prev => ({ ...prev, endDate: endDateStr }));
    }
  }, [formData.startDate, campaignPackages]);

  // Fetch clients and packages
  useEffect(() => {
    if (isVisible && user?.token) {
      fetchClientsAndPackages();
    }
  }, [isVisible, user?.token]);

  const fetchClientsAndPackages = async () => {
    setLoadingData(true);
    try {
      // Fetch clients
      const clientsQuery = `
        query GetAdClients {
          adClients {
            id
            companyName
          }
        }
      `;
      const clientsData = await makeGraphQLCall(clientsQuery, {}, user?.token);
      setClients(clientsData.adClients || []);

      // Fetch packages
      const packagesQuery = `
        query GetActiveAdPackages {
          activeAdPackages {
            id
            packageName
            basePrice
            currency
            adType
            placement
            format
            durationDays
            impressionLimit
            dimensions {
              desktop {
                width
                height
              }
              mobile {
                width
                height
              }
            }
            mediaRequirements
          }
        }
      `;
      const packagesData = await makeGraphQLCall(packagesQuery, {}, user?.token);
      setPackages(packagesData.activeAdPackages || []);
    } catch (err) {
      console.error('Failed to fetch clients/packages:', err);
      setError('فشل في تحميل البيانات');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form using Zod
    const errors = validateEditAdCampaignForm(formData);
    setValidationErrors(errors);

    if (hasValidationErrors(errors)) {
      console.log('❌ Ad Campaign validation failed:', errors);
      setError('يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
      return; // STOP - do not submit
    }

    // Validate discount reason if discount is applied
    if (discountPercentage > 0 && !discountReason.trim()) {
      setError('يرجى إدخال سبب الخصم عند تطبيق خصم');
      return;
    }

    console.log('✅ Ad Campaign validation passed, submitting...');

    try {
      // Build packageBreakdown from current packages (same as Create modal)
      const hasPackages = campaignPackages.length > 0;
      const isCustomPackage = campaignPackages.length > 1 || formData.isCustomPackage;

      const packageBreakdown = hasPackages ? {
        packages: campaignPackages.map(pkg => ({
          packageId: pkg.packageId,
          packageData: pkg.packageData,     // Keep nested structure for backend
          startDate: pkg.startDate,
          endDate: pkg.endDate,
          isAsap: pkg.isAsap,
          desktopMediaUrl: pkg.desktopMediaUrl,
          mobileMediaUrl: pkg.mobileMediaUrl,
          clickUrl: pkg.clickUrl,
          openInNewTab: pkg.openInNewTab,
          customPrice: pkg.customPrice,
        })),
        discountPercentage: discountPercentage,  // Campaign-level discount
        discountReason: discountReason,          // Campaign-level discount reason
        totalBeforeDiscount: calculateTotalBeforeDiscount(),
        totalAfterDiscount: calculateTotalPrice(),
      } : undefined;

      // Calculate total price from packages
      const totalPrice = calculateTotalPrice();

      // Get packageId from first package
      const packageId = campaignPackages.length > 0
        ? campaignPackages[0].packageId
        : formData.packageId;

      // Exclude paymentLink from update (not allowed in UpdateAdCampaignInput)
      const { paymentLink, ...updateFields } = formData;

      const submissionData = {
        ...updateFields,
        packageId,
        isCustomPackage,
        totalPrice,
        packageBreakdown,
      };

      console.log('📦 Full edit submission data:', submissionData);

      await onSubmit(submissionData);

      // Show success toast
      addNotification({
        type: 'success',
        title: 'نجح',
        message: 'تم تحديث الحملة الإعلانية بنجاح',
        duration: 5000,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحديث الحملة الإعلانية');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCopyReportLink = async () => {
    if (!initialData?.publicReportToken) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'لا يوجد رابط تقرير عام متاح',
        duration: 3000
      });
      return;
    }

    const reportLink = `${window.location.origin}/public/campaign-report/${initialData.publicReportToken}`;

    try {
      await navigator.clipboard.writeText(reportLink);
      addNotification({
        type: 'success',
        title: 'تم النسخ',
        message: 'تم نسخ رابط التقرير العام بنجاح',
        duration: 3000
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'فشل في نسخ الرابط',
        duration: 3000
      });
    }
  };

  const handleRegenerateToken = async () => {
    if (!initialData?.id) return;

    setRegeneratingToken(true);
    try {
      await regeneratePublicReportToken(initialData.id);
      addNotification({
        type: 'success',
        title: 'تم إعادة إنشاء الرابط',
        message: 'تم إعادة إنشاء رابط التقرير العام بنجاح',
        duration: 3000
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'فشل في إعادة إنشاء الرابط',
        duration: 3000
      });
    } finally {
      setRegeneratingToken(false);
    }
  };

  const handleSendPaymentLink = async () => {
    if (!initialData?.id) return;

    setSendingPaymentLink(true);
    try {
      // Call backend to send payment link email
      const mutation = `
        mutation SendPaymentLinkEmail($campaignId: String!) {
          sendPaymentLinkEmail(campaignId: $campaignId)
        }
      `;

      await makeGraphQLCall(mutation, { campaignId: initialData.id }, user?.token);

      addNotification({
        type: 'success',
        title: 'تم الإرسال',
        message: 'تم إرسال رابط الدفع بنجاح إلى العميل',
        duration: 5000
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: err instanceof Error ? err.message : 'فشل في إرسال رابط الدفع',
        duration: 5000
      });
    } finally {
      setSendingPaymentLink(false);
    }
  };

  // Package management handlers
  const handleAddPackage = (pkg: CampaignPackage) => {
    if (editingPackageIndex !== null) {
      // Update existing package
      const updated = [...campaignPackages];
      updated[editingPackageIndex] = pkg;
      setCampaignPackages(updated);
      setEditingPackageIndex(null);
    } else {
      // Add new package
      setCampaignPackages([...campaignPackages, pkg]);
    }
    setShowAddPackageModal(false);
  };

  const handleEditPackage = (index: number) => {
    setEditingPackageIndex(index);
    setShowAddPackageModal(true);
  };

  const handleDeletePackage = async (index: number) => {
    const packageToDelete = campaignPackages[index];

    // Delete media from Cloudflare before removing from state
    if (packageToDelete) {
      const deletePromises = [];

      if (packageToDelete.desktopMediaUrl) {
        console.log(`🗑️ Deleting desktop media: ${packageToDelete.desktopMediaUrl}`);
        deletePromises.push(
          deleteFromCloudflare(packageToDelete.desktopMediaUrl).catch(err =>
            console.error('Failed to delete desktop media:', err)
          )
        );
      }

      if (packageToDelete.mobileMediaUrl) {
        console.log(`🗑️ Deleting mobile media: ${packageToDelete.mobileMediaUrl}`);
        deletePromises.push(
          deleteFromCloudflare(packageToDelete.mobileMediaUrl).catch(err =>
            console.error('Failed to delete mobile media:', err)
          )
        );
      }

      // Wait for deletions (non-blocking)
      await Promise.all(deletePromises);
    }

    const updated = campaignPackages.filter((_, i) => i !== index);
    setCampaignPackages(updated);
  };

  // Calculate total price from all packages (uses base price only)
  // Calculate total before discount
  const calculateTotalBeforeDiscount = (): number => {
    if (campaignPackages.length === 0) return 0;
    return campaignPackages.reduce((sum, pkg) => sum + pkg.packageData.basePrice, 0);
  };

  // Calculate total after discount
  const calculateTotalPrice = (): number => {
    const totalBefore = calculateTotalBeforeDiscount();
    return totalBefore * (1 - discountPercentage / 100);
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="تعديل الحملة الإعلانية"
      description="قم بتحديث معلومات الحملة الإعلانية"
      maxWidth="xl"
    >
      <Form onSubmit={handleSubmit} error={error || undefined} className={styles.form}>
        {/* Campaign Information */}
        <div className={styles.section}>
          <Text variant="h4">معلومات الحملة</Text>
          <div className={styles.formGrid}>
            <Input
              label="اسم الحملة"
              type="text"
              value={formData.campaignName}
              onChange={(e) => handleChange('campaignName', e.target.value)}
              placeholder="حملة صيف 2025"
              required
            />
          </div>
          <Input
            label="الوصف (اختياري)"
            type="textarea"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="وصف مختصر للحملة..."
            rows={3}
          />
        </div>

        {/* Client Selection */}
        <div className={styles.section}>
          <Text variant="h4">العميل</Text>
          <div className={styles.formGrid}>
            <Input
              type="select"
              label="العميل"
              value={formData.clientId}
              onChange={(e) => handleChange('clientId', e.target.value)}
              options={clientOptions}
              required
              disabled={loadingData}
              placeholder="اختر العميل"
            />
          </div>
        </div>

        {/* Custom Package Toggle */}
        <div className={styles.section}>
          <Input
            label="حزمة مخصصة (متعددة)"
            type="checkbox"
            checked={formData.isCustomPackage}
            onChange={(e) => {
              const target = e.target as HTMLInputElement;
              handleChange('isCustomPackage', target.checked);
              // Reset packages when switching modes
              if (!target.checked && campaignPackages.length > 1) {
                setCampaignPackages([campaignPackages[0]]);
              }
            }}
          />
          <Text variant="small" color="secondary" className={styles.description}>
            {formData.isCustomPackage
              ? 'يمكنك إضافة عدة حزم في حملة واحدة'
              : 'يمكنك إضافة حزمة واحدة فقط'}
          </Text>
        </div>

        {/* Package Section */}
        {(
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Text variant="h4">الحزم المضافة</Text>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Plus size={16} />}
                onClick={() => setShowAddPackageModal(true)}
                disabled={!formData.isCustomPackage && campaignPackages.length >= 1}
              >
                إضافة حزمة
              </Button>
            </div>

            {campaignPackages.length > 0 ? (
              <div className={styles.packagesTable}>
                <table>
                  <thead>
                    <tr>
                      <th>اسم الحزمة</th>
                      <th>صورة سطح المكتب</th>
                      <th>صورة الموبايل</th>
                      <th>رابط التوجيه</th>
                      <th>السعر</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignPackages.map((pkg, index) => (
                      <tr key={index}>
                        <td>{pkg.packageData.packageName}</td>
                        <td>
                          {pkg.desktopMediaUrl ? (
                            <Image
                              src={pkg.desktopMediaUrl}
                              alt="Desktop"
                              width={80}
                              height={50}
                              className={styles.packageImage}
                              showSkeleton={false}
                              variant="public"
                            />
                          ) : (
                            <Text variant="small" color="secondary">لم يتم الرفع</Text>
                          )}
                        </td>
                        <td>
                          {pkg.mobileMediaUrl ? (
                            <Image
                              src={pkg.mobileMediaUrl}
                              alt="Mobile"
                              width={80}
                              height={50}
                              className={styles.packageImage}
                              showSkeleton={false}
                              variant="public"
                            />
                          ) : (
                            <Text variant="small" color="secondary">لم يتم الرفع</Text>
                          )}
                        </td>
                        <td>
                          <Text variant="small">{pkg.clickUrl || '-'}</Text>
                        </td>
                        <td>${pkg.packageData.basePrice}</td>
                        <td>
                          <div className={styles.tableActions}>
                            <button
                              type="button"
                              onClick={() => handleEditPackage(index)}
                              className={styles.iconButton}
                              title="تعديل"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePackage(index)}
                              className={styles.iconButton}
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Unified Pricing Summary */}
                <div className={styles.pricingSummary}>
                  <div className={styles.pricingRow}>
                    <Text variant="paragraph">الإجمالي قبل الخصم</Text>
                    <Text variant="paragraph">{formatAdPrice(calculateTotalBeforeDiscount(), 'USD')}</Text>
                  </div>

                  {/* Discount Toggle */}
                  <div className={styles.discountToggle}>
                    <Input
                      type="switch"
                      label="تطبيق خصم على الحملة"
                      checked={discountPercentage > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDiscountPercentage(10); // Default 10%
                        } else {
                          setDiscountPercentage(0);
                          setDiscountReason('');
                        }
                      }}
                    />
                  </div>

                  {discountPercentage > 0 && (
                    <div className={styles.discountInputs}>
                      <Input
                        label="نسبة الخصم (%)"
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={discountPercentage}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setDiscountPercentage(Math.max(0, Math.min(100, value)));
                        }}
                        placeholder="10"
                        required
                      />
                      <Input
                        label="سبب الخصم"
                        type="textarea"
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        placeholder="عميل دائم / عرض خاص / حملة متعددة / شراكة استراتيجية..."
                        required
                        rows={2}
                      />
                    </div>
                  )}

                  {/* Show discount row if applied */}
                  {discountPercentage > 0 && (
                    <>
                      <div className={styles.pricingDivider} />
                      <div className={styles.pricingRow}>
                        <Text variant="small" color="secondary">الخصم ({discountPercentage}%)</Text>
                        <Text variant="small" color="error">- {formatAdPrice(calculateTotalBeforeDiscount() * (discountPercentage / 100), 'USD')}</Text>
                      </div>
                    </>
                  )}

                  {/* Final total */}
                  <div className={styles.pricingDivider} />
                  <div className={styles.pricingRow}>
                    <Text variant="h4">المبلغ الإجمالي</Text>
                    <Text variant="h3" color="primary">{formatAdPrice(calculateTotalPrice(), 'USD')}</Text>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Text variant="paragraph" color="secondary">
                  لم يتم إضافة أي حزم بعد. اضغط على "إضافة حزمة" للبدء.
                </Text>
              </div>
            )}
          </div>
        )}


        {/* Payment Link */}
        <div className={styles.section}>
          <Input
            label="رابط الدفع (اختياري)"
            type="text"
            value={formData.paymentLink}
            onChange={(e) => handleChange('paymentLink', e.target.value)}
            placeholder="https://stripe.com/payment/..."
          />
        </div>

        {/* Public Report Link */}
        {initialData?.publicReportToken && (
          <div className={styles.section}>
            <Text variant="h4">رابط التقرير العام</Text>
            <Text variant="small" color="secondary" className={styles.description}>
              يمكن للعميل الوصول إلى تقرير الأداء عبر هذا الرابط بدون تسجيل دخول
            </Text>
            <div className={styles.reportLinkActions}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Copy size={16} />}
                onClick={handleCopyReportLink}
              >
                نسخ رابط التقرير
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<RefreshCw size={16} />}
                onClick={handleRegenerateToken}
                loading={regeneratingToken}
              >
                إعادة إنشاء الرابط
              </Button>
            </div>
          </div>
        )}

        {/* Payment Actions */}
        <div className={styles.section}>
          <Text variant="h4">إرسال رابط الدفع</Text>
          <Text variant="small" color="secondary" className={styles.description}>
            إرسال رابط الدفع يدوياً للعميل في حالة عدم وصول البريد الإلكتروني التلقائي
          </Text>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Mail size={16} />}
            onClick={handleSendPaymentLink}
            loading={sendingPaymentLink}
          >
            إرسال رابط الدفع
          </Button>
        </div>

        {/* Notes */}
        <div className={styles.section}>
          <Input
            label="ملاحظات (اختياري)"
            type="textarea"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="ملاحظات داخلية للفريق..."
            rows={3}
          />
        </div>

        {/* Submit Buttons */}
        <div className={styles.modalActions}>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading || loadingData}
          >
            حفظ التغييرات
          </Button>
        </div>
      </Form>

      {/* Add Package Modal */}
      <AddPackageModal
        isVisible={showAddPackageModal}
        onClose={() => {
          setShowAddPackageModal(false);
          setEditingPackageIndex(null);
        }}
        onAdd={handleAddPackage}
        availablePackages={packages}
        editingPackage={editingPackageIndex !== null ? campaignPackages[editingPackageIndex] : undefined}
      />
    </Modal>
  );
};
