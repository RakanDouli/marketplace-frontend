'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button, Text, Form, Image } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import { useAdminAuthStore } from '@/stores/admin/adminAuthStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { AddPackageModal, type CampaignPackage } from './AddPackageModal';
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

  // Calculate total price from all packages
  const calculateTotalPrice = (): number => {
    if (campaignPackages.length === 0) return formData.totalPrice;
    return campaignPackages.reduce((sum, pkg) => sum + (pkg.customPrice || pkg.packageData.basePrice), 0);
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
          desktopMediaUrl: pkg.desktopMediaUrl,
          mobileMediaUrl: pkg.mobileMediaUrl,
          clickUrl: pkg.clickUrl,
          openInNewTab: pkg.openInNewTab,
        }))
      } : undefined;

      // Calculate total price from campaign packages
      const totalPrice = calculateTotalPrice();

      // Get packageId from first campaign package (required by backend)
      const packageId = campaignPackages.length > 0
        ? campaignPackages[0].packageId
        : formData.packageId;

      const submissionData = {
        ...formData,
        packageId,
        isCustomPackage,
        totalPrice,
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
                        <td>${pkg.customPrice || pkg.packageData.basePrice}</td>
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

                {/* Total Price */}
                <div className={styles.totalPrice}>
                  <Text variant="h4">السعر الإجمالي:</Text>
                  <Text variant="h3">${calculateTotalPrice()}</Text>
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
