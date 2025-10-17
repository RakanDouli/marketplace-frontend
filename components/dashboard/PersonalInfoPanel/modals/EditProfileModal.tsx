import React, { useState } from 'react';
import { Modal, Input, Button, Text } from '@/components/slices';
import { useNotificationStore } from '@/stores/notificationStore';
import { User } from 'lucide-react';

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
    kvkNumber?: string | null;
    contactPhone?: string | null;
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
    kvkNumber: user.kvkNumber || '',
    contactPhone: user.contactPhone || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      // Prepare update data - phone is for ALL users
      const updateData: any = {
        name: formData.name,
        phone: formData.phone || null,
        gender: formData.gender || null,
        dateOfBirth: formData.dateOfBirth || null,
      };

      // Add business fields for DEALER and BUSINESS
      if (user.accountType === 'DEALER' || user.accountType === 'BUSINESS') {
        updateData.companyName = formData.companyName || null;
        updateData.website = formData.website || null;
        updateData.contactPhone = formData.contactPhone || null;

        if (user.accountType === 'BUSINESS') {
          updateData.kvkNumber = formData.kvkNumber || null;
        }
      }

      await onSave(updateData);
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
    <Modal isVisible={true} onClose={onClose} maxWidth="md">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <User size={24} />
        <Text variant="h3">تعديل الملف الشخصي</Text>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
        {/* Personal Information Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Text variant="h4" style={{ color: 'var(--primary)', marginBottom: '4px' }}>
            المعلومات الشخصية
          </Text>

          <Input
            type="text"
            label="الاسم الكامل *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="أدخل اسمك الكامل"
          />

          <Input
            type="tel"
            label="رقم الجوال"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+31612345678"
            helpText="رقم الجوال الشخصي للتواصل عبر واتساب"
          />

          <Input
            type="select"
            label="الجنس"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            options={genderOptions}
          />

          <Input
            type="date"
            label="تاريخ الميلاد"
            value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
        </div>

        {/* Business Information Section - Only for DEALER and BUSINESS */}
        {(user.accountType === 'DEALER' || user.accountType === 'BUSINESS') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <Text variant="h4" style={{ color: 'var(--primary)', marginBottom: '4px' }}>
              معلومات العمل
            </Text>

            <Input
              type="text"
              label="اسم الشركة"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="اسم شركتك أو متجرك"
            />

            <Input
              type="tel"
              label="هاتف الشركة"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder="+31612345678"
              helpText="رقم هاتف الشركة أو المعرض (إضافي)"
            />

            <Input
              type="url"
              label="الموقع الإلكتروني"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
              helpText="رابط موقعك الإلكتروني"
            />

            {user.accountType === 'BUSINESS' && (
              <Input
                type="text"
                label="رقم التسجيل التجاري (KVK)"
                value={formData.kvkNumber}
                onChange={(e) => setFormData({ ...formData, kvkNumber: e.target.value })}
                placeholder="12345678"
                helpText="رقم التسجيل التجاري في هولندا"
              />
            )}
          </div>
        )}

        {/* Security Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <Text variant="h4" style={{ color: 'var(--primary)', marginBottom: '4px' }}>
            الأمان
          </Text>

          {/* Email Change */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text variant="small" style={{ fontWeight: 600 }}>البريد الإلكتروني</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Text variant="paragraph">{user.email}</Text>
              <Button
                variant="outline"
                size="sm"
                onClick={onChangeEmailClick}
                type="button"
                style={{ alignSelf: 'flex-start' }}
              >
                تغيير
              </Button>
            </div>
            <Text variant="small" style={{ color: 'var(--text-secondary)' }}>
              لتغيير البريد الإلكتروني، يجب تأكيد كلمة المرور
            </Text>
          </div>

          {/* Password Reset */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text variant="small" style={{ fontWeight: 600 }}>كلمة المرور</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Text variant="paragraph">••••••••</Text>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePasswordReset}
                disabled={isResettingPassword}
                type="button"
                style={{ alignSelf: 'flex-start' }}
              >
                {isResettingPassword ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
              </Button>
            </div>
            <Text variant="small" style={{ color: 'var(--text-secondary)' }}>
              سيتم إرسال رابط آمن إلى: {user.email}
            </Text>
          </div>
        </div>

        {error && (
          <div style={{
            color: 'var(--error)',
            fontSize: '14px',
            padding: '12px',
            backgroundColor: 'rgba(var(--error-rgb), 0.1)',
            borderRadius: '8px',
            border: '1px solid var(--error)'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)', position: 'sticky', bottom: 0, background: 'var(--bg)' }}>
          <Button variant="outline" onClick={onClose} disabled={isSaving} type="button">
            إلغاء
          </Button>
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
