'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text, Button } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { ACCOUNT_TYPE_LABELS } from '@/constants/metadata-labels';
import { getInitials, getAvatarColor } from '@/utils/avatar-utils';
import styles from './Account.module.scss';

export default function AccountPage() {
  const router = useRouter();
  const { user, userPackage } = useUserAuthStore();
  const [cancelingSubscription, setCancelingSubscription] = useState(false);

  if (!user) return null;

  const handleCancelSubscription = async () => {
    if (!userPackage || userPackage.userSubscription.billingCycle === 'free') {
      return;
    }

    const confirmed = window.confirm(
      'هل أنت متأكد من إلغاء الاشتراك؟ سيتم تحويلك إلى الخطة المجانية.'
    );

    if (!confirmed) return;

    setCancelingSubscription(true);

    try {
      const token = user.token;
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          query: `
            mutation CancelMySubscription {
              cancelMySubscription
            }
          `,
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      alert('تم إلغاء الاشتراك بنجاح');
      window.location.reload(); // Refresh to get updated package
    } catch (error) {
      console.error('Cancel subscription error:', error);
      alert('حدث خطأ أثناء إلغاء الاشتراك');
    } finally {
      setCancelingSubscription(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/subscriptions');
  };

  return (
    <div className={styles.account}>
      <Text variant="h2">معلومات الحساب</Text>

      <div className={styles.section}>
        <Text variant="h3">المعلومات الشخصية</Text>
        <div className={styles.userInfo}>
          <div
            className={styles.avatar}
            style={{
              backgroundColor: user.avatar ? 'transparent' : getAvatarColor(user.name, user.email)
            }}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name || ''} />
            ) : (
              <span className={styles.initials}>
                {getInitials(user.name, user.email)}
              </span>
            )}
          </div>
        </div>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Text variant="small">
              الاسم
            </Text>
            <Text variant="paragraph">{user.name || 'غير محدد'}</Text>
          </div>

          <div className={styles.infoItem}>
            <Text variant="small">
              البريد الإلكتروني
            </Text>
            <Text variant="paragraph">{user.email}</Text>
          </div>

          <div className={styles.infoItem}>
            <Text variant="small">
              رقم الهاتف
            </Text>
            <Text variant="paragraph">{user.phone || 'غير محدد'}</Text>
          </div>

          <div className={styles.infoItem}>
            <Text variant="small">
              نوع الحساب
            </Text>
            <Text variant="paragraph">
              {ACCOUNT_TYPE_LABELS[user.accountType] || user.accountType}
            </Text>
          </div>

          {user.companyName && (
            <div className={styles.infoItem}>
              <Text variant="small">
                اسم الشركة
              </Text>
              <Text variant="paragraph">{user.companyName}</Text>
            </div>
          )}

          {user.website && (
            <div className={styles.infoItem}>
              <Text variant="small">
                الموقع الإلكتروني
              </Text>
              <Text variant="paragraph">
                <a href={user.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                  {user.website}
                </a>
              </Text>
            </div>
          )}

          {user.kvkNumber && (
            <div className={styles.infoItem}>
              <Text variant="small">
                رقم التسجيل التجاري
              </Text>
              <Text variant="paragraph">{user.kvkNumber}</Text>
            </div>
          )}

          {user.contactPhone && (
            <div className={styles.infoItem}>
              <Text variant="small">
                هاتف العمل
              </Text>
              <Text variant="paragraph">{user.contactPhone}</Text>
            </div>
          )}
        </div>

        <Button variant="primary">تعديل المعلومات</Button>
      </div>

      {/* Subscription info */}
      {userPackage && (
        <div className={styles.section}>
          <Text variant="h3">الاشتراك</Text>

          <div className={styles.subscriptionCard}>
            <div className={styles.subscriptionHeader}>
              <Text variant="h4">{userPackage.userSubscription.title}</Text>
              {userPackage.userSubscription.billingCycle !== 'free' && (
                <Text variant="h3" className={styles.price}>
                  ${userPackage.userSubscription.price}
                  <Text variant="small" as="span"> / شهري</Text>
                </Text>
              )}
            </div>

            {userPackage.userSubscription.description && (
              <Text variant="paragraph" className={styles.description}>
                {userPackage.userSubscription.description}
              </Text>
            )}

            {/* Features */}
            <div className={styles.features}>
              <div className={styles.feature}>
                <Text variant="small">الإعلانات:</Text>
                <Text variant="paragraph">
                  {userPackage.userSubscription.maxListings === 0
                    ? 'غير محدود'
                    : `${userPackage.currentListings} / ${userPackage.userSubscription.maxListings}`}
                </Text>
              </div>

              <div className={styles.feature}>
                <Text variant="small">الصور لكل إعلان:</Text>
                <Text variant="paragraph">
                  {userPackage.userSubscription.maxImagesPerListing} صورة
                </Text>
              </div>

              {userPackage.userSubscription.videoAllowed && (
                <div className={styles.feature}>
                  <Text variant="small">الفيديو:</Text>
                  <Text variant="paragraph">✓ مسموح</Text>
                </div>
              )}

              {userPackage.userSubscription.priorityPlacement && (
                <div className={styles.feature}>
                  <Text variant="small">الأولوية في البحث:</Text>
                  <Text variant="paragraph">✓ نعم</Text>
                </div>
              )}

              {userPackage.userSubscription.customBranding && (
                <div className={styles.feature}>
                  <Text variant="small">العلامة التجارية المخصصة:</Text>
                  <Text variant="paragraph">✓ نعم</Text>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={styles.subscriptionActions}>
              {userPackage.userSubscription.billingCycle === 'free' ? (
                <Button variant="primary" onClick={handleUpgrade}>
                  ترقية الاشتراك
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleUpgrade}>
                    ترقية الاشتراك
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancelSubscription}
                    disabled={cancelingSubscription}
                  >
                    {cancelingSubscription ? 'جاري الإلغاء...' : 'إلغاء الاشتراك'}
                  </Button>
                </>
              )}
            </div>

            {userPackage.endDate && (
              <Text variant="small" className={styles.renewalDate}>
                تاريخ التجديد: {new Date(userPackage.endDate).toLocaleDateString('ar-SA')}
              </Text>
            )}
          </div>
        </div>
      )}

      {/* Email verification */}
      {!user.isEmailConfirmed && (
        <div className={styles.warning}>
          <Text variant="paragraph">
            ⚠️ يرجى تأكيد بريدك الإلكتروني لتفعيل جميع المزايا
          </Text>
          <Button variant="outline" size="sm">
            إعادة إرسال رابط التأكيد
          </Button>
        </div>
      )}
    </div>
  );
}
