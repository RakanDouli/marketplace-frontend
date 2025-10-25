'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/slices/Modal/Modal';
import { Button, Text, Form } from '@/components/slices';
import { Input } from '@/components/slices/Input/Input';
import styles from './AdClientModals.module.scss';

interface CreateAdClientModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export const CreateAdClientModal: React.FC<CreateAdClientModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    description: '',
    industry: '',
    status: 'ACTIVE',
    notes: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      contactPhone: formData.contactPhone || undefined,
      website: formData.website || undefined,
      description: formData.description || undefined,
      industry: formData.industry || undefined,
      notes: formData.notes || undefined,
    });
    // Reset form
    setFormData({
      companyName: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      website: '',
      description: '',
      industry: '',
      status: 'ACTIVE',
      notes: '',
    });
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="إضافة عميل إعلاني جديد"
      description="قم بإضافة عميل إعلاني جديد"
    >
      <Form onSubmit={handleSubmit} className={styles.form}>
        {/* Basic Information */}
        <div className={styles.section}>
          <Text variant="h3">المعلومات الأساسية</Text>

          <div className={styles.formGrid}>
            <Input
              label="اسم الشركة"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="مثال: شركة الإعلانات المتقدمة"
              required
            />

            <Input
              label="الصناعة"
              value={formData.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              placeholder="مثال: التكنولوجيا، التجارة، الخدمات"
            />
          </div>

          <Input
            type="textarea"
            label="وصف الشركة"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="وصف مختصر عن الشركة وأنشطتها..."
          />
        </div>

        {/* Contact Information */}
        <div className={styles.section}>
          <Text variant="h3">معلومات الاتصال</Text>

          <div className={styles.formGrid}>
            <Input
              label="اسم جهة الاتصال"
              value={formData.contactName}
              onChange={(e) => handleChange('contactName', e.target.value)}
              placeholder="مثال: أحمد محمد"
              required
            />

            <Input
              label="البريد الإلكتروني"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              placeholder="example@company.com"
              required
            />
          </div>

          <div className={styles.formGrid}>
            <Input
              label="رقم الهاتف"
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              placeholder="+963 XXX XXX XXX"
            />

            <Input
              label="الموقع الإلكتروني"
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>

        {/* Status & Notes */}
        <div className={styles.section}>
          <Text variant="h3">الحالة والملاحظات</Text>

          <div>
            <label className={styles.label}>حالة العميل</label>
            <select
              className={styles.select}
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
              <option value="blacklisted">محظور</option>
            </select>
          </div>

          <Input
            type="textarea"
            label="ملاحظات داخلية"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="ملاحظات خاصة بالفريق الإداري..."
          />
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'جاري الحفظ...' : 'حفظ العميل'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
