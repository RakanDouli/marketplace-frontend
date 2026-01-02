'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaWhatsapp } from 'react-icons/fa';
import { Phone, Globe, MessageCircle } from 'lucide-react';
import { Text, Button, ShareButton, FavoriteButton, ClientPrice } from '@/components/slices';

import { useUserAuthStore } from '@/stores/userAuthStore';
import { useChatStore } from '@/stores/chatStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useListingsStore } from '@/stores/listingsStore';
import { formatDate } from '@/utils/formatDate';
import { ListingStatus } from '@/common/enums';
import styles from './ListingInfoCard.module.scss';
import { OwnerCard } from '@/components/ListingOwnerInfo';

interface ListingInfoCardProps {
  onContactClick: () => void;
}

export const ListingInfoCard: React.FC<ListingInfoCardProps> = ({
  onContactClick,
}) => {
  const router = useRouter();
  const { user: currentUser, openAuthModal } = useUserAuthStore();
  const { isUserBlocked, fetchBlockedUsers } = useChatStore();
  const { addNotification } = useNotificationStore();
  const { currentListing } = useListingsStore();

  // Fetch blocked users when user is logged in
  useEffect(() => {
    if (currentUser) {
      fetchBlockedUsers();
    }
  }, [currentUser, fetchBlockedUsers]);

  // Guard: No listing data - must be AFTER all hooks
  if (!currentListing) {
    return null;
  }

  const {
    id: listingId,
    title,
    description,
    imageKeys,
    status,
    priceMinor,
    user,
    location,
    createdAt,
  } = currentListing;

  const handleContactClick = () => {
    // Check if user is logged in - open auth modal if not
    if (!currentUser) {
      openAuthModal('login');
      return;
    }

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
            price: priceMinor?.toString(),
            currency: 'USD',
            availability: status === ListingStatus.ACTIVE ? 'in stock' : 'out of stock',
          }}
        />
        <FavoriteButton
          listingId={listingId}
          listingUserId={user?.id}
        />
      </div>

      {/* Price */}
      <div className={styles.priceBox}>
        <Text variant="h3" className={styles.title}>
          {title}
        </Text>
        <Text variant="h3" className={styles.price}>
          {priceMinor ? (
            <ClientPrice price={priceMinor} fallback="السعر غير محدد" />
          ) : (
            'السعر غير محدد'
          )}
        </Text>
      </div>
      {/* Owner Info Component - Hidden on mobile (shown in main content) */}
      {user?.id && (
        <div className={styles.ownerSection}>
          <OwnerCard userId={user.id} listingId={listingId} />
        </div>
      )}

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

      {/* Location & Published Date Info */}      <div className={styles.infoCard}>
        {/* Location */}
        {/* {location?.province && (
          <div className={styles.infoRow}>
            <span className={styles.label}>الموقع</span>
            <span className={styles.value}>
              {location.city ? `${location.city}, ${location.province}` : location.province}
            </span>
          </div>
        )} */}

        {/* Published Date */}
        {createdAt && (
          <div className={styles.infoRow}>
            <span className={styles.label}>تاريخ النشر</span>
            <span className={styles.value}>
              {formatDate(createdAt)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
