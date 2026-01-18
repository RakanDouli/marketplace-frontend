'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import styles from './ListingActionBar.module.scss';

interface ListingActionBarProps {
  phone?: string | null;
  onMessageClick: () => void;
  isOwnListing?: boolean;
}

/**
 * ListingActionBar - Mobile sticky action bar
 * Syncs with BottomNav scroll behavior
 * Only visible on mobile devices
 */
export const ListingActionBar: React.FC<ListingActionBarProps> = ({
  phone,
  onMessageClick,
  isOwnListing = false,
}) => {
  const { user, openAuthModal } = useUserAuthStore();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Sync with BottomNav scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      // Show when at top or scrolling up
      if (currentScrollY < 50 || scrollDelta < -5) {
        setIsNavVisible(true);
      }
      // Hide when scrolling down
      else if (scrollDelta > 5) {
        setIsNavVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWhatsAppClick = () => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\s+/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handlePhoneClick = () => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  const handleMessageClick = () => {
    // Check if user is logged in
    if (!user) {
      openAuthModal('login');
      return;
    }
    onMessageClick();
  };

  // Don't show action bar on own listings
  if (isOwnListing) return null;

  return (
    <div className={`${styles.actionBar} ${isNavVisible ? styles.visible : styles.hidden}`}>
      <div className={styles.actionButtons}>
        {/* WhatsApp Button */}
        {phone && (
          <Button
            variant="outline"
            onClick={handleWhatsAppClick}
            className={styles.actionButton}
            aria-label="واتساب"
            icon={<FaWhatsapp size={22} />}
          />
        )}

        {/* Phone Button */}
        {phone && (
          <Button
            variant="outline"
            onClick={handlePhoneClick}
            className={styles.actionButton}
            aria-label="اتصال"
            icon={<Phone size={22} />}
          />
        )}

        {/* Message Button - Icon only */}
        <Button
          variant="primary"
          onClick={handleMessageClick}
          className={styles.actionButton}
          aria-label="أرسل رسالة"
          icon={<MessageCircle size={22} />}
        />
      </div>
    </div>
  );
};
