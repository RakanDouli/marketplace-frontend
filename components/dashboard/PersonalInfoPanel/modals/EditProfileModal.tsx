import React, { useState } from 'react';
import { Modal, Input, Button, Text, Form } from '@/components/slices';
import { useNotificationStore } from '@/stores/notificationStore';
import { AccountType } from '@/common/enums';
import {
  validateProfileForm,
  createProfileFieldValidator,
  hasValidationErrors,
  type ValidationErrors,
} from '@/lib/validation/profileValidation';
import styles from './DashboardModals.module.scss';

interface EditProfileModalProps {
  user: {
    name: string | null;
    email: string;
    phone?: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
    accountType: string;
    companyName?: string | null;
    website?: string | null;
    companyRegistrationNumber?: string | null;
    contactPhone?: string | null; // renamed from contactPhone
    phoneIsWhatsApp?: boolean;
    showPhone?: boolean;
    showContactPhone?: boolean;
    token?: string;
  };
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onSendPasswordReset: () => Promise<void>;
  onChangeEmailClick: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  onClose,
  onSave,
  onSendPasswordReset,
  onChangeEmailClick,
}) => {
  const { addNotification } = useNotificationStore();

  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    gender: user.gender || '',
    dateOfBirth: user.dateOfBirth || '',
    companyName: user.companyName || '',
    website: user.website || '',
    companyRegistrationNumber: user.companyRegistrationNumber || '',
    contactPhone: user.contactPhone || '',
    phoneIsWhatsApp: user.phoneIsWhatsApp ?? false,
    showPhone: user.showPhone ?? true,
    showContactPhone: user.showContactPhone ?? true,
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form using Zod
    const errors = validateProfileForm(formData);
    setValidationErrors(errors);

    if (hasValidationErrors(errors)) {
      console.log('❌ Profile validation failed:', errors);
      return; // STOP - do not submit
    }

    console.log('✅ Profile validation passed, submitting...');

    setIsSaving(true);

    try {
      // Prepare update data - phone is for ALL users
      const updateData: any = {
        name: formData.name,
        phone: formData.phone || null,
        gender: formData.gender ? formData.gender.toUpperCase() : null, // Convert to uppercase for GraphQL enum
        dateOfBirth: formData.dateOfBirth || null,
      };

      // Add phone preferences (all users)
      updateData.phoneIsWhatsApp = formData.phoneIsWhatsApp;
      updateData.showPhone = formData.showPhone;
      updateData.showContactPhone = formData.showContactPhone;

      // Add business fields for DEALER and BUSINESS
      const accountTypeLower = user.accountType.toLowerCase();
      if (accountTypeLower === AccountType.DEALER || accountTypeLower === AccountType.BUSINESS) {
        updateData.companyName = formData.companyName || null;
        updateData.website = formData.website || null;
        updateData.contactPhone = formData.contactPhone || null;

        if (accountTypeLower === AccountType.BUSINESS) {
          updateData.companyRegistrationNumber = formData.companyRegistrationNumber || null;
        }
      }

      await onSave(updateData);
      // Show success toast
      addNotification({
        type: 'success',
        title: 'نجح',
        message: 'تم تحديث الملف الشخصي بنجاح',
        duration: 5000,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    setIsResettingPassword(true);
    try {
      await onSendPasswordReset();
      addNotification({
        type: 'success',
        title: 'تم إرسال الرابط',
        message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
        duration: 5000
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'فشل في إرسال الرابط. حاول مرة أخرى.',
        duration: 5000
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const genderOptions = [
    { value: '', label: 'غير محدد' },
    { value: 'male', label: 'ذكر' },
    { value: 'female', label: 'أنثى' },
  ];

  return (
    <Modal isVisible={true} onClose={onClose} maxWidth="lg" title="تعديل الملف الشخصي">
      <Form onSubmit={handleSubmit} error={error || undefined}>
        <div className={styles.formContainer}>
          {/* Personal Information Section */}
          <div className={styles.section}>
            <Text variant="h4" className={styles.sectionTitle}>
              المعلومات الشخصية
            </Text>

            <Input
              type="text"
              label="الاسم الكامل *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              validate={createProfileFieldValidator('name')}
              error={validationErrors.name}
              required
              placeholder="أدخل اسمك الكامل"
            />

            <Input
              type="tel"
              label="رقم الجوال"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              validate={createProfileFieldValidator('phone')}
              error={validationErrors.phone}
              placeholder="+963944123456"
            />

            <Input
              type="switch"
              label="هذا الرقم يدعم واتساب"
              checked={formData.phoneIsWhatsApp}
              onChange={(e) => setFormData({ ...formData, phoneIsWhatsApp: (e.target as HTMLInputElement).checked })}
            />

            <Input
              type="switch"
              label="إظهار رقم الجوال في الإعلانات"
              checked={formData.showPhone}
              onChange={(e) => setFormData({ ...formData, showPhone: (e.target as HTMLInputElement).checked })}
            />

            <Input
              type="select"
              label="الجنس"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              validate={createProfileFieldValidator('gender')}
              error={validationErrors.gender}
              options={genderOptions}
            />

            <Input
              type="date"
              label="تاريخ الميلاد"
              value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              error={validationErrors.dateOfBirth}
            />
          </div>

          {/* Business Information Section - Only for DEALER and BUSINESS */}
          {(user.accountType.toLowerCase() === AccountType.DEALER || user.accountType.toLowerCase() === AccountType.BUSINESS) && (
            <div className={styles.section}>
              <Text variant="h4" className={styles.sectionTitle}>
                معلومات العمل
              </Text>

              <Input
                type="text"
                label="اسم الشركة"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                validate={createProfileFieldValidator('companyName')}
                error={validationErrors.companyName}
                placeholder="اسم شركتك أو متجرك"
              />

              <Input
                type="tel"
                label="هاتف المكتب"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                validate={createProfileFieldValidator('contactPhone')}
                error={validationErrors.contactPhone}
                placeholder="+963112345678"
              />

              <Input
                type="switch"
                label="إظهار هاتف المكتب"
                checked={formData.showContactPhone}
                onChange={(e) => setFormData({ ...formData, showContactPhone: (e.target as HTMLInputElement).checked })}
              />

              <Input
                type="url"
                label="الموقع الإلكتروني"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                validate={createProfileFieldValidator('website')}
                error={validationErrors.website}
                placeholder="https://example.com"
              />

              {user.accountType.toLowerCase() === AccountType.BUSINESS && (
                <Input
                  type="text"
                  label="رقم التسجيل التجاري (KVK)"
                  value={formData.companyRegistrationNumber}
                  onChange={(e) => setFormData({ ...formData, companyRegistrationNumber: e.target.value })}
                  validate={createProfileFieldValidator('companyRegistrationNumber')}
                  error={validationErrors.companyRegistrationNumber}
                  placeholder="12345678"
                />
              )}
            </div>
          )}

          {/* Security Section */}
          <div className={styles.section}>
            <Text variant="h4" className={styles.sectionTitle}>
              الأمان
            </Text>

            {/* Email Change */}
            <div className={styles.fieldGroup}>
              <Text variant="small" className={styles.fieldLabel}>البريد الإلكتروني</Text>
              <div className={styles.fieldActions}>
                <Text variant="paragraph">{user.email}</Text>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onChangeEmailClick}
                  type="button"
                >
                  تغيير
                </Button>
              </div>
              <Text variant="small" className={styles.fieldHint}>
                لتغيير البريد الإلكتروني، يجب تأكيد كلمة المرور
              </Text>
            </div>

            {/* Password Reset */}
            <div className={styles.fieldGroup}>
              <Text variant="small" className={styles.fieldLabel}>كلمة المرور</Text>
              <div className={styles.fieldActions}>
                <Text variant="paragraph">••••••••</Text>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePasswordReset}
                  disabled={isResettingPassword}
                  type="button"
                >
                  {isResettingPassword ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
                </Button>
              </div>
              <Text variant="small" className={styles.fieldHint}>
                سيتم إرسال رابط آمن إلى: {user.email}
              </Text>
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <Button variant="outline" onClick={onClose} disabled={isSaving} type="button">
            إلغاء
          </Button>
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
