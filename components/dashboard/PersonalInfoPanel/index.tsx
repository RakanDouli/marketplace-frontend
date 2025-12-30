'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Text, Button, Image, Container, Grid } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { ACCOUNT_TYPE_LABELS } from '@/constants/metadata-labels';
import { AccountType } from '@/common/enums';
import { getInitials, getAvatarColor } from '@/utils/avatar-utils';
import { optimizeListingImage } from '@/utils/cloudflare-images';
import { Upload, Trash2 } from 'lucide-react';
import { EditProfileModal, DeleteAccountModal, DeactivateAccountModal, ChangeEmailModal } from './modals';
import styles from '../SharedDashboardPanel.module.scss';

export const PersonalInfoPanel: React.FC = () => {
  const router = useRouter();
  const { user, userPackage, logout, refreshUserData } = useUserAuthStore();
  const { updateProfile, deleteAccount, deactivateAccount, sendPasswordResetEmail, changeEmail, uploadAvatar, deleteAvatar } = useUserProfileStore();
  const { addNotification } = useNotificationStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleSaveProfile = async (data: any) => {
    if (!user.token) throw new Error('No authentication token');

    await updateProfile(user.token, data);
    await refreshUserData();
    setShowEditModal(false);
  };

  const handleDeleteAccount = async () => {
    if (!user.token) throw new Error('No authentication token');

    await deleteAccount(user.token);
    logout();
    router.push('/');
  };

  const handleDeactivateAccount = async () => {
    if (!user.token) throw new Error('No authentication token');

    await deactivateAccount(user.token);
    logout();
    router.push('/');
  };

  const handleSendPasswordReset = async () => {
    if (!user.token || !user.email) throw new Error('No token or email');
    await sendPasswordResetEmail(user.token, user.email);
  };

  const handleChangeEmail = async (newEmail: string, password: string) => {
    if (!user.token) throw new Error('No authentication token');

    await changeEmail(user.token, newEmail);
    await refreshUserData();
    setShowEmailModal(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user.token) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت',
        duration: 5000
      });
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP',
        duration: 5000
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(user.token, file);
      await refreshUserData();
      addNotification({
        type: 'success',
        title: 'تم رفع الصورة',
        message: 'تم تحديث صورة الملف الشخصي بنجاح',
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: error instanceof Error ? error.message : 'فشل رفع الصورة',
        duration: 5000
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAvatarDelete = async () => {
    if (!user.token || !user.avatar) return;

    setIsUploadingAvatar(true);
    try {
      await deleteAvatar(user.token);
      await refreshUserData();
      addNotification({
        type: 'success',
        title: 'تم الحذف',
        message: 'تم حذف صورة الملف الشخصي بنجاح',
        duration: 3000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'فشل حذف الصورة',
        duration: 5000
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const hasCustomBranding = userPackage?.userSubscription?.customBranding === true;

  const getAvatarUrl = (avatar: string | null, variant: 'small' | 'card' | 'thumbnail' = 'small') => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return optimizeListingImage(avatar, variant);
  };

  return (
    <div className={styles.panel}>
      {/* Profile Header Section */}
      <Container paddingX="none" paddingY="none" background="bg" innerPadding="lg" innerBorder>
        <div className={styles.profileHeader}>
          <div className={styles.avatarSection}>
            <div
              className={styles.avatar}
              style={{
                backgroundColor: user.avatar
                  ? 'transparent'
                  : getAvatarColor(user.name, user.email),
              }}
            >
              {user.avatar ? (
                <Image
                  src={getAvatarUrl(user.avatar, 'card') || ''}
                  alt={user.name || ''}
                  aspectRatio="1/1"
                  containerStyle={{ width: '100%', height: '100%' }}
                />
              ) : (
                <span className={styles.initials}>
                  {getInitials(user.name, user.email)}
                </span>
              )}
            </div>

            {hasCustomBranding && (
              <div className={styles.avatarActions}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  icon={<Upload size={16} />}
                >
                  {isUploadingAvatar ? 'جاري الرفع...' : user.avatar ? 'تغيير الصورة' : 'رفع صورة'}
                </Button>

                {user.avatar && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAvatarDelete}
                    disabled={isUploadingAvatar}
                    icon={<Trash2 size={16} />}
                  >
                    حذف الصورة
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className={styles.profileInfo}>
            <Text variant="h2">{user.name || 'مستخدم'}</Text>
            <Text variant="paragraph" color="secondary">
              {userPackage?.userSubscription?.title || ACCOUNT_TYPE_LABELS[user.accountType.toLowerCase()] || user.accountType}
            </Text>
            {user.companyName && (
              <Text variant="small" color="secondary">
                {user.companyName}
              </Text>
            )}
          </div>
        </div>
      </Container>

      {/* Email Verification Warning */}
      {!user.isEmailConfirmed && (
        <Container paddingX="none" paddingY="none">
          <div className={styles.warningCard}>
            <div className={styles.warningContent}>
              <Text variant="paragraph" style={{ fontWeight: 600 }}>
                تأكيد البريد الإلكتروني
              </Text>
              <Text variant="small" color="secondary">
                يرجى تأكيد بريدك الإلكتروني لتفعيل جميع المزايا
              </Text>
            </div>
            <Button variant="outline" size="sm">
              إعادة الإرسال
            </Button>
          </div>
        </Container>
      )}

      {/* Account Information Section */}
      <Container paddingX="none" paddingY="none" background="bg" innerPadding="lg" innerBorder>
        <div className={styles.sectionHeader}>
          <Text variant="h3">معلومات الحساب</Text>
          <Button variant="primary" size="sm" onClick={() => setShowEditModal(true)}>
            تعديل
          </Button>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Text variant="small" color="secondary">الاسم</Text>
            <Text variant="paragraph">{user.name || 'غير محدد'}</Text>
          </div>

          <div className={styles.infoItem}>
            <Text variant="small" color="secondary">البريد الإلكتروني</Text>
            <Text variant="paragraph">{user.email}</Text>
          </div>

          {user.phone && (
            <div className={styles.infoItem}>
              <Text variant="small" color="secondary">
                رقم الجوال {user.phoneIsWhatsApp && '(واتساب)'}
              </Text>
              <Text variant="paragraph" dir="ltr" style={{ textAlign: 'right' }}>
                {user.phone}
              </Text>
            </div>
          )}

          {(user.accountType.toLowerCase() === AccountType.DEALER || user.accountType.toLowerCase() === AccountType.BUSINESS) && user.contactPhone && (
            <div className={styles.infoItem}>
              <Text variant="small" color="secondary">هاتف المكتب</Text>
              <Text variant="paragraph" dir="ltr" style={{ textAlign: 'right' }}>
                {user.contactPhone}
              </Text>
            </div>
          )}

          {user.website && (
            <div className={styles.infoItem}>
              <Text variant="small" color="secondary">الموقع الإلكتروني</Text>
              <Text variant="paragraph">
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  {user.website}
                </a>
              </Text>
            </div>
          )}

          {user.companyRegistrationNumber && (
            <div className={styles.infoItem}>
              <Text variant="small" color="secondary">رقم التسجيل التجاري</Text>
              <Text variant="paragraph">{user.companyRegistrationNumber}</Text>
            </div>
          )}
        </div>
      </Container>

      {/* Account Settings Section */}
      <Container paddingX="none" paddingY="none" background="bg" innerPadding="lg" innerBorder>
        <Text variant="h3" style={{ marginBottom: 'var(--space-md)' }}>إعدادات الحساب</Text>

        <div className={styles.settingsGrid}>
          <div className={styles.settingCard}>
            <div className={styles.settingContent}>
              <Text variant="paragraph" style={{ fontWeight: 600 }}>
                إيقاف الحساب مؤقتاً
              </Text>
              <Text variant="small" color="secondary">
                يمكنك إخفاء حسابك وإعلاناتك مؤقتاً وإعادة تفعيلها لاحقاً
              </Text>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowDeactivateModal(true)}>
              إيقاف مؤقت
            </Button>
          </div>

          <div className={styles.settingCard}>
            <div className={styles.settingContent}>
              <Text variant="paragraph" style={{ fontWeight: 600 }}>
                حذف الحساب نهائياً
              </Text>
              <Text variant="small" color="secondary">
                سيتم حذف جميع بياناتك بشكل نهائي ولا يمكن استرجاعها
              </Text>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(true)}>
              حذف الحساب
            </Button>
          </div>
        </div>
      </Container>

      {/* Modals */}
      {showEditModal && (
        <EditProfileModal
          user={{...user, token: user.token}}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveProfile}
          onSendPasswordReset={handleSendPasswordReset}
          onChangeEmailClick={() => setShowEmailModal(true)}
        />
      )}

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
        />
      )}

      {showDeactivateModal && (
        <DeactivateAccountModal
          onClose={() => setShowDeactivateModal(false)}
          onConfirm={handleDeactivateAccount}
        />
      )}

      {showEmailModal && (
        <ChangeEmailModal
          currentEmail={user.email}
          onClose={() => setShowEmailModal(false)}
          onConfirm={handleChangeEmail}
        />
      )}
    </div>
  );
};
