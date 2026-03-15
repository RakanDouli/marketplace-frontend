"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { MessageCircle, Heart, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

import { Spacer, Button } from "@/components/slices";
import { Logo } from "@/components/Logo";
import { UserMenu } from "@/components/UserMenu";
import { ListingLimitModal } from "@/components/ListingLimitModal";
import { useChatStore } from "@/stores/chatStore";
import { useUserAuthStore } from "@/stores/userAuthStore";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useNotificationStore } from "@/stores/notificationStore";
import styles from "./Header.module.scss";
import { Container } from "../slices";
import { Preheader } from "../Preheader";

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [showPreheader, setShowPreheader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const { user, userPackage, openAuthModal } = useUserAuthStore();
  const { unreadCount, fetchUnreadCount, fetchMyThreads, subscribeGlobal, unsubscribeGlobal } = useChatStore();
  const { loadMyWishlist } = useWishlistStore();
  const { addNotification } = useNotificationStore();

  // Check if user is suspended or banned
  const isSuspended = user?.status === 'SUSPENDED' || user?.status === 'suspended';
  const isBanned = user?.status === 'BANNED' || user?.status === 'banned';
  const isBlocked = isSuspended || isBanned;

  // Listing limit check
  const maxListings = userPackage?.userSubscription?.maxListings || 0;
  const currentListingsCount = userPackage?.currentListings || 0;
  const isAtLimit = maxListings > 0 && currentListingsCount >= maxListings;

  // Fetch unread count, wishlist, and subscribe to realtime when user is logged in
  useEffect(() => {
    if (user?.id) {
      loadMyWishlist();
      // Fetch threads first, then subscribe to realtime for instant updates
      fetchMyThreads().then(() => {
        fetchUnreadCount();
        subscribeGlobal(user.id);
      });

      return () => {
        unsubscribeGlobal();
      };
    }
  }, [user?.id, loadMyWishlist]);

  // Handle scroll behavior - hide when scrolling down, show when scrolling up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show/hide preheader only when at very top
      setShowPreheader(currentScrollY < 10);

      // Show header when at top or scrolling up
      if (currentScrollY < 10 || currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      // Hide header when scrolling down
      else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Handle message icon click - check auth first
  const handleMessagesClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      openAuthModal('login');
      return;
    }

    // Refresh threads and navigate
    fetchMyThreads();
    router.push('/messages');
  };

  // Handle wishlist icon click - check auth first
  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      openAuthModal('login');
      return;
    }

    // Refresh wishlist and navigate
    loadMyWishlist();
    router.push('/dashboard/wishlist');
  };

  // Handle create listing button click - check auth, suspension, and limit
  const handleCreateListingClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      openAuthModal('login');
      return;
    }

    // Check if user is suspended or banned
    if (isBlocked) {
      const bannedUntilDate = user.bannedUntil
        ? new Date(user.bannedUntil).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : '';

      addNotification({
        type: 'error',
        title: isBanned ? 'حسابك محظور' : 'حسابك موقوف مؤقتاً',
        message: isBanned
          ? 'تم حظر حسابك نهائياً. لا يمكنك إضافة إعلانات جديدة.'
          : `حسابك موقوف مؤقتاً حتى ${bannedUntilDate}. لا يمكنك إضافة إعلانات جديدة.`,
        duration: 10000,
      });
      return;
    }

    // Check if user is at listing limit
    if (isAtLimit) {
      setShowLimitModal(true);
      return;
    }

    router.push('/dashboard/listings/create');
  };

  return (
    <>
      <Spacer />

      <header
        className={`${styles.header} ${isVisible ? styles.visible : styles.hidden} ${showPreheader ? styles.withPreheader : styles.compact}`}
      >
        {/* Preheader - always rendered, positioned at top */}
        <Preheader />

        {/* Main header content */}
        <Container paddingY="none">
          <div className={styles.container}>
            {/* Logo */}
            <Logo />

            {/* Desktop Navigation */}
            <nav className={styles.nav}>
              <Link
                href="/about"
                className={`${styles.navLink} ${pathname === '/about' ? styles.active : ''}`}
              >
                من نحن
              </Link>
              <Link
                href="/contact"
                className={`${styles.navLink} ${pathname === '/contact' ? styles.active : ''}`}
              >
                اتصل بنا
              </Link>
            </nav>

            {/* Desktop Actions */}
            <div className={styles.actions}>
              {/* Wishlist Icon - shows for all users, auth check on click */}
              <button
                onClick={handleWishlistClick}
                className={styles.messagesIcon}
                aria-label="المفضلة"
              >
                <Heart size={20} />
              </button>

              {/* Messages Icon - shows for all users, auth check on click */}
              <button
                onClick={handleMessagesClick}
                className={styles.messagesIcon}
                aria-label="الرسائل"
              >
                <MessageCircle size={20} />
                {user && unreadCount > 0 && (
                  <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>

              {/* Create Listing Button - shows for all users, auth check on click */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateListingClick}
                icon={<Plus size={16} />}
              >
                أضف إعلانك
              </Button>

              <UserMenu />
            </div>
          </div>
        </Container>
      </header>

      {/* Listing Limit Modal */}
      <ListingLimitModal
        isVisible={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        currentCount={currentListingsCount}
        maxListings={maxListings}
      />
    </>
  );
};

export default Header;
