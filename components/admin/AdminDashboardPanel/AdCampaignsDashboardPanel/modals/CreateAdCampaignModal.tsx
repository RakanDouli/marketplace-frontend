'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button, Text, Form, Image } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { useAdminAuthStore } from '@/stores/admin/adminAuthStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { AddPackageModal, type CampaignPackage } from './AddPackageModal';
import { formatAdPrice } from '@/utils/formatPrice';
import styles from './AdCampaignModals.module.scss';

interface CreateAdCampaignModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
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
  durationDays: number;
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

export const CreateAdCampaignModal: React.FC<CreateAdCampaignModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [error, setError] = useState<string | null>(null);
  const { user } = useAdminAuthStore();
  const { addNotification } = useNotificationStore();
  const [clients, setClients] = useState<AdClient[]>([]);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [campaignPackages, setCampaignPackages] = useState<CampaignPackage[]>([]);
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [editingPackageIndex, setEditingPackageIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    campaignName: '',
    description: '',
    clientId: '',
    packageId: '',
    isCustomPackage: false,
    startPreference: 'SPECIFIC_DATE', // 'ASAP' or 'SPECIFIC_DATE'
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalPrice: 0,
    currency: 'USD',
    notes: '',
    pacingMode: 'EVEN',     // NEW: Pacing mode (EVEN, ASAP, MANUAL)
    priority: 3,            // NEW: Priority 1-5 (default 3)
    discountPercentage: 0,  // NEW: Campaign-level discount (0-100)
    discountReason: '',     // NEW: Why discount was applied
  });

  // Auto-calculate end date when start date, preference, or package changes
  useEffect(() => {
    // Get duration from the first selected package
    const durationDays = campaignPackages.length > 0
      ? campaignPackages[0].packageData.durationDays
      : 30; // Default 30 days if no package selected yet

    if (formData.startPreference === 'SPECIFIC_DATE' && formData.startDate) {
      const start = new Date(formData.startDate);
      const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
      setFormData(prev => ({ ...prev, endDate: end.toISOString().split('T')[0] }));
    } else if (formData.startPreference === 'ASAP') {
      // For ASAP, set placeholder dates (will be adjusted on payment)
      const now = new Date();
      const end = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
      setFormData(prev => ({
        ...prev,
        startDate: now.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      }));
    }
  }, [formData.startPreference, formData.startDate, campaignPackages]);

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

  const handleDeletePackage = (index: number) => {
    const updated = campaignPackages.filter((_, i) => i !== index);
    setCampaignPackages(updated);
  };

  // Calculate total price from all packages with campaign-level discount
  const calculateTotalBeforeDiscount = (): number => {
    if (campaignPackages.length === 0) return formData.totalPrice;
    return campaignPackages.reduce((sum, pkg) => sum + (pkg.customPrice || pkg.packageData.basePrice), 0);
  };

  const calculateTotalPrice = (): number => {
    const beforeDiscount = calculateTotalBeforeDiscount();
    const discountAmount = beforeDiscount * (formData.discountPercentage / 100);
    return beforeDiscount - discountAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Custom validation (skip Zod validation since we changed the form structure)

    // 1. Validate campaign name
    if (!formData.campaignName || formData.campaignName.trim().length < 3) {
      setError('يرجى إدخال اسم الحملة (3 أحرف على الأقل)');
      return;
    }

    // 2. Validate client selection
    if (!formData.clientId) {
      setError('يرجى اختيار العميل');
      return;
    }

    // 3. Validate packages - must have at least one package added
    if (campaignPackages.length === 0) {
      setError('يرجى إضافة حزمة واحدة على الأقل');
      return;
    }

    // 4. Validate start date for SPECIFIC_DATE preference
    if (formData.startPreference === 'SPECIFIC_DATE' && !formData.startDate) {
      setError('يرجى تحديد تاريخ البداية');
      return;
    }

    // 5. Validate discount reason if discount is applied
    if (formData.discountPercentage > 0 && !formData.discountReason.trim()) {
      setError('يرجى إدخال سبب الخصم عند تطبيق خصم');
      return;
    }

    console.log('✅ Ad Campaign validation passed, submitting...');

    try {
      // ALWAYS save packageBreakdown when packages are added (regardless of switch)
      // isCustomPackage = true when multiple packages (or when user explicitly sets it)
      const hasPackages = campaignPackages.length > 0;
      const isCustomPackage = campaignPackages.length > 1 || formData.isCustomPackage;

      const packageBreakdown = hasPackages ? {
        packages: campaignPackages.map(pkg => ({
          packageId: pkg.packageId,
          packageName: pkg.packageData.packageName,
          basePrice: pkg.packageData.basePrice,
          adType: pkg.packageData.adType,
          placement: pkg.packageData.placement,
          format: pkg.packageData.format,
          dimensions: pkg.packageData.dimensions,
          mediaRequirements: pkg.packageData.mediaRequirements,
          startDate: pkg.startDate,         // NEW: Per-package start date
          endDate: pkg.endDate,             // NEW: Per-package end date
          desktopMediaUrl: pkg.desktopMediaUrl,
          mobileMediaUrl: pkg.mobileMediaUrl,
          clickUrl: pkg.clickUrl,
          openInNewTab: pkg.openInNewTab,
          customPrice: pkg.customPrice,     // Include discount price
          discountReason: pkg.discountReason, // NEW: Discount reason
        })),
        discountPercentage: formData.discountPercentage,  // Campaign-level discount
        discountReason: formData.discountReason,          // Campaign-level discount reason
        totalBeforeDiscount: calculateTotalBeforeDiscount(),
        totalAfterDiscount: calculateTotalPrice(),
      } : undefined;

      // Calculate total price from campaign packages
      const totalPrice = calculateTotalPrice();

      // Get packageId from first campaign package (required by backend)
      const packageId = campaignPackages.length > 0
        ? campaignPackages[0].packageId
        : formData.packageId;

      // Calculate campaign-level dates as MIN/MAX from all packages
      let campaignStartDate = formData.startDate;
      let campaignEndDate = formData.endDate;

      if (campaignPackages.length > 0) {
        const allStartDates = campaignPackages.map(pkg => new Date(pkg.startDate));
        const allEndDates = campaignPackages.map(pkg => new Date(pkg.endDate));

        campaignStartDate = new Date(Math.min(...allStartDates.map(d => d.getTime()))).toISOString().split('T')[0];
        campaignEndDate = new Date(Math.max(...allEndDates.map(d => d.getTime()))).toISOString().split('T')[0];
      }

      const submissionData = {
        ...formData,
        packageId,
        isCustomPackage,
        totalPrice,
        startDate: campaignStartDate,  // Campaign-level start (min of all packages)
        endDate: campaignEndDate,      // Campaign-level end (max of all packages)
        packageBreakdown,
      };

      console.log('📦 Full campaign submission data:', submissionData);

      // Submit campaign
      await onSubmit(submissionData);

      // Show success toast
      addNotification({
        type: 'success',
        title: 'نجح',
        message: 'تم إنشاء الحملة الإعلانية بنجاح',
        duration: 5000,
      });

      // Reset form
      setFormData({
        campaignName: '',
        description: '',
        clientId: '',
        packageId: '',
        isCustomPackage: false,
        startPreference: 'SPECIFIC_DATE',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalPrice: 0,
        currency: 'USD',
        notes: '',
        pacingMode: 'EVEN',
        priority: 3,
        discountPercentage: 0,
        discountReason: '',
      });
      setCampaignPackages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إنشاء الحملة الإعلانية');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      campaignName: '',
      description: '',
      clientId: '',
      packageId: '',
      isCustomPackage: false,
      startPreference: 'SPECIFIC_DATE',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalPrice: 0,
      currency: 'USD',
      notes: '',
      pacingMode: 'EVEN',
      priority: 3,
      discountPercentage: 0,
      discountReason: '',
    });
    setCampaignPackages([]);
    setError(null);
    onClose();
  };

  // Convert clients to options format for Input select
  const clientOptions = clients.map(client => ({
    value: client.id,
    label: client.companyName
  }));

  // Start preference options
  const startPreferenceOptions = [
    { value: 'ASAP', label: 'في أقرب وقت ممكن (عند الدفع)' },
    { value: 'SPECIFIC_DATE', label: 'تاريخ محدد' }
  ];

  // Pacing mode options
  const pacingModeOptions = [
    { value: 'EVEN', label: 'توزيع متساوي (مُوصى به)' },
    { value: 'ASAP', label: 'أسرع ما يمكن' },
    { value: 'MANUAL', label: 'يدوي (تحكم الإدارة)' }
  ];

  // Priority labels for slider
  const priorityLabels: { [key: number]: string } = {
    1: 'منخفض جداً',
    2: 'منخفض',
    3: 'متوسط (افتراضي)',
    4: 'عالي',
    5: 'عالي جداً'
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={handleClose}
      title="إضافة حملة إعلانية جديدة"
      description="أنشئ حملة إعلانية جديدة لأحد العملاء"
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

        {/* Custom Package Toggle */}
        <div className={styles.section}>
          <Input
            label="حزمة مخصصة (متعددة)"
            type="switch"
            checked={formData.isCustomPackage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handleChange('isCustomPackage', e.target.checked);
              // Reset packages when switching modes
              if (!e.target.checked && campaignPackages.length > 1) {
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
                      <th>تاريخ البدء</th>
                      <th>تاريخ الانتهاء</th>
                      <th>صورة سطح المكتب</th>
                      <th>صورة الموبايل</th>
                      <th>السعر</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignPackages.map((pkg, index) => (
                      <tr key={index}>
                        <td>{pkg.packageData.packageName}</td>
                        <td>
                          <Text variant="small">{new Date(pkg.startDate).toLocaleDateString('ar-EG')}</Text>
                        </td>
                        <td>
                          <Text variant="small">{new Date(pkg.endDate).toLocaleDateString('ar-EG')}</Text>
                        </td>
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
                          <div>
                            {formatAdPrice(pkg.customPrice || pkg.packageData.basePrice, 'USD')}
                            {pkg.customPrice && (
                              <Text variant="small" color="secondary" style={{ display: 'block' }}>
                                خصم: {pkg.discountReason}
                              </Text>
                            )}
                          </div>
                        </td>
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

                {/* Pricing Breakdown */}
                <div className={styles.pricingBreakdown}>
                  <div className={styles.priceRow}>
                    <Text variant="paragraph">إجمالي الحزم:</Text>
                    <Text variant="paragraph">{formatAdPrice(calculateTotalBeforeDiscount(), 'USD')}</Text>
                  </div>

                  {formData.discountPercentage > 0 && (
                    <>
                      <div className={styles.priceRow}>
                        <Text variant="small" color="secondary">
                          خصم ({formData.discountPercentage}%):
                        </Text>
                        <Text variant="small" color="secondary">
                          -{formatAdPrice(calculateTotalBeforeDiscount() * (formData.discountPercentage / 100), 'USD')}
                        </Text>
                      </div>
                      {formData.discountReason && (
                        <div className={styles.priceRow}>
                          <Text variant="small" color="secondary" style={{ fontStyle: 'italic' }}>
                            سبب الخصم: {formData.discountReason}
                          </Text>
                        </div>
                      )}
                    </>
                  )}

                  <div className={styles.totalPrice}>
                    <Text variant="h4">السعر الإجمالي النهائي:</Text>
                    <Text variant="h3">{formatAdPrice(calculateTotalPrice(), 'USD')}</Text>
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

        {/* Campaign-Level Discount Section */}
        {campaignPackages.length > 0 && (
          <div className={styles.section}>
            <Text variant="h4">خصم على مستوى الحملة (اختياري)</Text>
            <Text variant="small" color="secondary" className={styles.description}>
              يطبق الخصم على إجمالي سعر جميع الحزم في الحملة
            </Text>

            <div className={styles.formGrid}>
              <Input
                label="نسبة الخصم (%)"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discountPercentage}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  handleChange('discountPercentage', Math.max(0, Math.min(100, value)));
                }}
                placeholder="0"
              />
            </div>

            {formData.discountPercentage > 0 && (
              <>
                <Input
                  label="سبب الخصم"
                  type="textarea"
                  value={formData.discountReason}
                  onChange={(e) => handleChange('discountReason', e.target.value)}
                  placeholder="عميل دائم / عرض خاص / حملة متعددة / شراكة استراتيجية..."
                  required
                  rows={2}
                />
                <Text variant="small" color="secondary">
                  السعر قبل الخصم: {formatAdPrice(calculateTotalBeforeDiscount(), 'USD')} |
                  مبلغ الخصم: {formatAdPrice(calculateTotalBeforeDiscount() * (formData.discountPercentage / 100), 'USD')} |
                  السعر بعد الخصم: {formatAdPrice(calculateTotalPrice(), 'USD')}
                </Text>
              </>
            )}
          </div>
        )}

        {/* Campaign Period */}
        <div className={styles.section}>
          <Text variant="h4">فترة الحملة</Text>

          {/* Start Preference */}
          <Input
            type="select"
            label="موعد البدء"
            value={formData.startPreference}
            onChange={(e) => handleChange('startPreference', e.target.value)}
            options={startPreferenceOptions}
            required
            placeholder="اختر موعد البدء"
          />

          {/* Conditional Start Date Picker */}
          {formData.startPreference === 'SPECIFIC_DATE' && (
            <div className={styles.formGrid}>
              <Input
                label="تاريخ البداية"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                required
              />
            </div>
          )}

          {/* Show selected package duration (read-only info) */}
          {campaignPackages.length > 0 && (
            <div className={styles.formGrid}>
              <Text variant="small" color="secondary">
                مدة الحملة: {campaignPackages[0].packageData.durationDays} يوم (من الحزمة المختارة)
              </Text>
            </div>
          )}
        </div>

        {/* Pacing & Priority Section */}
        <div className={styles.section}>
          <Text variant="h4">إعدادات الأداء</Text>

          {/* Pacing Mode */}
          <Input
            type="select"
            label="نظام التوزيع (Pacing)"
            value={formData.pacingMode}
            onChange={(e) => handleChange('pacingMode', e.target.value)}
            options={pacingModeOptions}
            required
          />
          <Text variant="small" color="secondary" className={styles.description}>
            {formData.pacingMode === 'EVEN' && 'يوزع مرات الظهور بالتساوي طوال فترة الحملة (مُوصى به)'}
            {formData.pacingMode === 'ASAP' && 'يعرض الإعلان بأسرع ما يمكن حتى نفاذ مرات الظهور'}
            {formData.pacingMode === 'MANUAL' && 'تحكم يدوي من الإدارة بمعدل العرض'}
          </Text>

          {/* Priority Slider */}
          <div className={styles.prioritySection}>
            <label className={styles.label}>
              الأولوية (Priority): {formData.priority} - {priorityLabels[formData.priority]}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={formData.priority}
              onChange={(e) => handleChange('priority', parseInt(e.target.value))}
              className={styles.prioritySlider}
            />
            <div className={styles.priorityMarks}>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
            <Text variant="small" color="secondary" className={styles.description}>
              الأولوية الأعلى تزيد فرص ظهور الإعلان عند وجود إعلانات متعددة
            </Text>
          </div>
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
            onClick={handleClose}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading || loadingData}
          >
            إنشاء الحملة
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
