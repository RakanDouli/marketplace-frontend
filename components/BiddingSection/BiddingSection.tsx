'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Gavel } from 'lucide-react';
import { Text, Button, Input, Form } from '@/components/slices';
import { useBidsStore } from '@/stores/bidsStore';
import { useChatStore } from '@/stores/chatStore';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatPrice } from '@/utils/formatPrice';
import { formatDate } from '@/utils/date';
import styles from './BiddingSection.module.scss';

interface BiddingSectionProps {
  listingId: string;
  listingOwnerId: string;
  allowBidding: boolean;
  biddingStartPrice: number | null;
}

export const BiddingSection: React.FC<BiddingSectionProps> = ({
  listingId,
  listingOwnerId,
  allowBidding,
  biddingStartPrice,
}) => {
  const router = useRouter();
  const { user } = useUserAuthStore();
  const { bids, highestBid, isLoading, fetchHighestBid, fetchPublicListingBids, placeBid } = useBidsStore();
  const { getOrCreateThread, sendMessage } = useChatStore();
  const { addNotification } = useNotificationStore();

  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = user?.id === listingOwnerId;

  // Fetch highest bid and all bids on mount
  useEffect(() => {
    if (allowBidding) {
      fetchHighestBid(listingId);
      fetchPublicListingBids(listingId);
    }
  }, [listingId, allowBidding, fetchHighestBid, fetchPublicListingBids]);

  // Initialize input with highest bid or start price (in USD dollars)
  useEffect(() => {
    if (highestBid) {
      // Show highest bid + $1 increment
      const nextBid = highestBid.amount + 1; // Add $1
      setBidAmount(nextBid.toString());
    } else if (biddingStartPrice) {
      // Show start price (in dollars)
      setBidAmount(biddingStartPrice.toString());
    }
  }, [highestBid, biddingStartPrice]);

  // Get unique bidders (only show latest bid per bidder)
  const uniqueBidders = new Map<string, typeof bids[0]>();
  bids.forEach(bid => {
    const existingBid = uniqueBidders.get(bid.bidderId);
    // Keep the highest bid from each bidder
    if (!existingBid || bid.amount > existingBid.amount) {
      uniqueBidders.set(bid.bidderId, bid);
    }
  });

  // Get last 4 unique bidders
  const recentBids = Array.from(uniqueBidders.values())
    .sort((a, b) => b.amount - a.amount) // Sort by highest bid
    .slice(0, 4);

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'يجب تسجيل الدخول لتقديم عرض',
        duration: 5000,
      });
      return;
    }

    if (isOwner) {
      setError('لا يمكنك تقديم عرض على إعلانك الخاص');
      return;
    }

    // bidAmount is in USD dollars from the price input
    const amountInDollars = parseFloat(bidAmount);
    if (isNaN(amountInDollars) || amountInDollars <= 0) {
      setError('يرجى إدخال مبلغ صحيح');
      return;
    }

    setIsSubmitting(true);

    try {
      // Place bid (in USD dollars)
      await placeBid(listingId, amountInDollars);

      // Create/get chat thread with owner (auto-creates if doesn't exist)
      const threadId = await getOrCreateThread(listingId, listingOwnerId);

      // Send message with bid amount in USD
      const bidMessage = `${user?.name || 'مستخدم'} قدم عرضاً بمبلغ $${amountInDollars}`;

      await sendMessage(threadId, bidMessage);

      addNotification({
        type: 'success',
        title: 'نجح',
        message: 'تم تقديم عرضك بنجاح',
        duration: 5000,
      });

      setBidAmount('');

      // Refresh highest bid and bid list
      await fetchHighestBid(listingId);
      await fetchPublicListingBids(listingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تقديم العرض');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBidderClick = async (bidderId: string) => {
    if (!user) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'يجب تسجيل الدخول للمراسلة',
        duration: 5000,
      });
      return;
    }

    try {
      // Get or create thread with bidder
      const threadId = await getOrCreateThread(listingId, bidderId);

      // Navigate to messages page with this thread
      router.push(`/messages?threadId=${threadId}`);
    } catch (err) {
      console.error('Error opening chat with bidder:', err);
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'لا يمكن فتح المحادثة',
        duration: 3000,
      });
    }
  };

  if (!allowBidding) {
    return null;
  }

  return (
    <div className={styles.biddingSection}>
      <div className={styles.header}>
        <Gavel size={24} />
        <Text variant="h3">المزايدة</Text>
      </div>

      {!isOwner && user && (
        <Form onSubmit={handlePlaceBid} error={error || undefined}>
          <div className={styles.bidForm}>
            <Input
              type="price"
              label="قيمة العرض"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="0"
              required
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !bidAmount}
              className={styles.bidButton}
            >
              <Gavel size={18} />
              تقديم عرض
            </Button>
          </div>
        </Form>
      )}

      {!user && !isOwner && (
        <div className={styles.loginPrompt}>
          <Text variant="small" color="secondary">يجب تسجيل الدخول لتقديم عرض</Text>
        </div>
      )}

      {recentBids.length > 0 && (
        <div className={styles.bidsList}>
          <Text variant="small" color="secondary">
            العروض السابقة
          </Text>
          <div className={styles.bidsScrollContainer}>
            {recentBids.map((bid) => (
              <div key={bid.id} className={styles.bidRow}>
                <Text variant="small">{bid.bidder?.name || 'مستخدم'}</Text>
                <Text variant="small">
                  {formatPrice(bid.amount)}
                </Text>
                <Text variant="small" color="secondary">
                  {formatDate(bid.createdAt)}
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && recentBids.length === 0 && (
        <Text variant="small" color="secondary">جاري التحميل...</Text>
      )}

      {!isLoading && recentBids.length === 0 && (
        <Text variant="small" color="secondary">لا توجد عروض حتى الآن</Text>
      )}
    </div>
  );
};
