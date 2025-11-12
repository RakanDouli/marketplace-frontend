'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaWhatsapp } from 'react-icons/fa';
import { Phone, Globe, MessageCircle } from 'lucide-react';
import { Text, Button, ShareButton, FavoriteButton } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useChatStore } from '@/stores/chatStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useListingsStore } from '@/stores/listingsStore';
import styles from './ListingInfoCard.module.scss';

interface ListingInfoCardProps {
  onContactClick: () => void;
}

export const ListingInfoCard: React.FC<ListingInfoCardProps> = ({
  onContactClick,
}) => {
  const router = useRouter();
  const { user: currentUser } = useUserAuthStore();
  const { isUserBlocked, fetchBlockedUsers } = useChatStore();
  const { addNotification } = useNotificationStore();
  const { currentListing } = useListingsStore();

  // Fetch blocked users when user is logged in
  useEffect(() => {
    if (currentUser) {
      fetchBlockedUsers();
    }
  }, [currentUser, fetchBlockedUsers]);

  // Guard: No listing data
  if (!currentListing) {
    return null;
  }

  const {
    id: listingId,
    title,
    description,
    imageKeys,
    status,
    prices,
    user,
    location,
    createdAt,
  } = currentListing;

  const primaryPrice = prices?.[0];

  // 🔍 DEBUG: Log user business fields
  console.log('🔍 ListingInfoCard - User Data:', {
    userId: user?.id,
    name: user?.name,
    accountType: user?.accountType,
    companyName: user?.companyName,
    website: user?.website,
    companyRegistrationNumber: user?.companyRegistrationNumber,
    phone: user?.phone,
    contactPhone: user?.contactPhone,
  });

  const handleContactClick = () => {
    const sellerId = user?.id;
    if (sellerId && isUserBlocked(sellerId)) {
      addNotification({
        type: 'error',
        title: 'لا يمكن التواصل',
        message: 'لا يمكنك التواصل مع هذا البائع (أحدكما قام بحظر الآخر). يمكنك إدارة المحظورين من صفحة لوحة التحكم.',
        duration: 7000,
        action: {
          label: 'صفحة المحظورين',
          onClick: () => router.push('/dashboard/blocked-users'),
        },
      });
      return;
    }
    onContactClick();
  };

  return (
    <div className={styles.sellerCard}>
      {/* Share and Favorite Buttons */}
      <div className={styles.actionButtons}>
        <ShareButton
          metadata={{
            title,
            description: description || '',
            url: typeof window !== 'undefined' ? window.location.href : '',
            image: imageKeys?.[0],
            siteName: 'السوق السوري للسيارات',
            type: 'product',
            price: primaryPrice?.value,
            currency: primaryPrice?.currency,
            availability: status === 'ACTIVE' ? 'in stock' : 'out of stock',
          }}
        />
        <FavoriteButton
          listingId={listingId}
          listingUserId={user?.id}
        />
      </div>

      {/* Price */}
      <div className={styles.priceBox}>
        <Text variant="h2" className={styles.title}>
          {title}
        </Text>
        <Text variant="h3" className={styles.price}>
          {primaryPrice ? `${primaryPrice.value} ${primaryPrice.currency}` : 'السعر غير محدد'}
        </Text>
      </div>

      {/* Contact Buttons */}
      <div className={styles.buttons}>
        <div className={styles.phoneButtons}>
          {/* WhatsApp Button */}
          {(user?.phone || user?.contactPhone) && (
            <Button
              variant="outline"

              onClick={() => {
                const phone = (user?.phone || user?.contactPhone)?.replace(/\s+/g, '');
                window.open(`https://wa.me/${phone}`, '_blank');
              }}
            >
              <FaWhatsapp size={24} />
            </Button>
          )}

          {/* Phone Call Button */}
          {(user?.phone || user?.contactPhone) && (
            <Button
              variant="outline"

              onClick={() => {
                const phone = user?.phone || user?.contactPhone;
                window.location.href = `tel:${phone}`;
              }}
            >
              <Phone size={24} />
            </Button>
          )}
        </div>
        {/* Message Button */}
        {currentUser?.id !== user?.id && (
          <Button
            variant="primary"

            icon={<MessageCircle size={18} />}
            onClick={handleContactClick}
          >
            أرسل رسالة
          </Button>
        )}
        {/* Website Button */}
        {user?.website && (
          <Button
            variant="outline"

            href={user.website}
            target="_blank"
          >
            <Globe size={24} />الموقع الإلكتروني
          </Button>
        )}


      </div>

      {/* Seller Info */}
      <div className={styles.infoCard}>
        {/* Seller Name */}
        <div className={styles.infoRow}>
          <span className={styles.label}>البائع</span>
          <span className={styles.value}>{user?.name || 'غير محدد'}</span>
        </div>

        {/* Company Name - show if exists */}
        {user?.companyName && (
          <div className={styles.infoRow}>
            <span className={styles.label}>الشركة</span>
            <span className={styles.value}>{user.companyName}</span>
          </div>
        )}

        {/* KVK Number - show if exists */}
        {user?.companyRegistrationNumber && (
          <div className={styles.infoRow}>
            <span className={styles.label}>رقم التسجيل التجاري</span>
            <span className={styles.value}>{user.companyRegistrationNumber}</span>
          </div>
        )}

        {/* Location */}
        {location?.province && (
          <div className={styles.infoRow}>
            <span className={styles.label}>الموقع</span>
            <span className={styles.value}>
              {location.city ? `${location.city}, ${location.province}` : location.province}
            </span>
          </div>
        )}

        {/* Published Date */}
        {createdAt && (
          <div className={styles.infoRow}>
            <span className={styles.label}>تاريخ النشر</span>
            <span className={styles.value}>
              {new Date(createdAt).toLocaleDateString('ar')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
