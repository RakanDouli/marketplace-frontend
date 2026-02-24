'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Send, UserCircle, MoreVertical, Trash2, Ban, AlertTriangle, Edit2, ChevronDown, Paperclip, X, Check, CheckCheck, Star, ArrowLeft } from 'lucide-react';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useChatStore } from '@/stores/chatStore';
import { useListingsStore } from '@/stores/listingsStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { Text, Button, Image, Dropdown, DropdownMenuItem, ImagePreview } from '@/components/slices';
import { formatPrice } from '@/utils/formatPrice';
import { formatDateShort, formatDayName, formatDateTime } from '@/utils/formatDate';
import { createChatThumbnail, optimizeListingImage } from '@/utils/cloudflare-images';
import { validateImageFile } from '@/utils/cloudflare-upload';
import { BlockUserModal, DeleteThreadModal, DeleteMessageModal } from './ChatModals';
import { ReportModal } from '@/components/ReportButton';
import { ReviewModal } from '@/components/ReviewModal';
import { MessageStatus } from '@/common/enums';
import type { Listing } from '@/stores/types';
import type { ChatMessage } from '@/stores/chatStore/types';
import styles from './Messages.module.scss';

interface ThreadWithListing {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string | null;
  unreadCount?: number; // ✅ Added: Per-thread unread count
  listing: Listing | null;
}

export const MessagesClient: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUserAuthStore();
  const {
    threads,
    activeThreadId,
    messages,
    isLoading,
    unreadCount,
    fetchMyThreads,
    fetchThreadMessages,
    sendMessage,
    setActiveThread,
    deleteThread,
    deleteMessage,
    deleteMessageImage,
    editMessage,
    blockUser,
    fetchBlockedUsers,
    isUserBlocked,
    subscribeToThread,
    unsubscribeFromThread,
    broadcastTyping,
    typingUsers,
    markThreadRead,
  } = useChatStore();
  const { fetchListingById } = useListingsStore();
  // Subscribe to currency changes to re-render prices when user changes currency
  const { preferredCurrency } = useCurrencyStore();

  const [threadsWithListings, setThreadsWithListings] = useState<ThreadWithListing[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [threadMenuOpen, setThreadMenuOpen] = useState(false);
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);

  // Modal states
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [deleteThreadModalOpen, setDeleteThreadModalOpen] = useState(false);
  const [deleteMessageModalOpen, setDeleteMessageModalOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Edit message state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');

  // Image attachment state (for sending) - Support multiple images (max 8)
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Image preview modal state (for viewing received images)
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Review system state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewedUserId, setReviewedUserId] = useState<string | null>(null);
  const [reviewedUserName, setReviewedUserName] = useState<string>('');
  const [attachDropdownOpen, setAttachDropdownOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Fetch blocked users and threads on mount
  useEffect(() => {
    if (user) {
      fetchBlockedUsers();
      fetchMyThreads();
    }
  }, [user, fetchMyThreads, fetchBlockedUsers]);

  // Auto-refresh threads when unread count changes (indicates new message)
  useEffect(() => {
    if (!user) return;

    // When unread count increases, refresh thread list to show updated threads
    if (unreadCount > 0) {
      fetchMyThreads();
    }
  }, [unreadCount, user, fetchMyThreads]);

  // Auto-refresh threads when going back to thread list
  useEffect(() => {
    if (!user) return;

    // Refresh when activeThreadId becomes null (user closed a thread)
    if (activeThreadId === null) {
      fetchMyThreads();
    }

    // Also refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMyThreads();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, fetchMyThreads, activeThreadId]);

  // Fetch listing details for each thread and filter out blocked users
  useEffect(() => {
    if (threads.length === 0) {
      setThreadsWithListings([]);
      return;
    }

    let isMounted = true;

    const fetchListingsForThreads = async () => {
      const threadsWithData: ThreadWithListing[] = [];

      for (const thread of threads) {
        // Skip threads with blocked users
        const otherUserId = user?.id === thread.buyerId ? thread.sellerId : thread.buyerId;
        if (isUserBlocked(otherUserId)) {
          continue;
        }

        try {
          await fetchListingById(thread.listingId);
          const listing = useListingsStore.getState().currentListing;
          threadsWithData.push({ ...thread, listing });
        } catch (error) {
          // Listing might be deleted/archived - skip this thread
        }
      }

      // Only update state if component is still mounted
      if (isMounted) {
        setThreadsWithListings(threadsWithData);
      }
    };

    fetchListingsForThreads();

    return () => {
      isMounted = false;
    };
  }, [threads, fetchListingById, user]);

  // Fetch messages when thread is selected
  useEffect(() => {
    if (activeThreadId) {
      fetchThreadMessages(activeThreadId);
    }
  }, [activeThreadId, fetchThreadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeThreadId]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Subscribe to realtime updates when thread is active
  useEffect(() => {
    if (activeThreadId && user?.id) {
      subscribeToThread(activeThreadId, user.id);

      // Fetch messages for this thread
      fetchThreadMessages(activeThreadId);

      // Mark thread as read when opening it
      markThreadRead(activeThreadId);
    }

    // Cleanup: unsubscribe when thread changes or component unmounts
    return () => {
      if (activeThreadId) {
        unsubscribeFromThread();
      }
    };
  }, [activeThreadId, user?.id, subscribeToThread, unsubscribeFromThread, fetchThreadMessages, markThreadRead]);

  // Broadcast typing indicator when user types
  useEffect(() => {
    if (activeThreadId && messageText.trim() && user?.name) {
      broadcastTyping(activeThreadId, user.name);
    }
  }, [messageText, activeThreadId, user?.name, broadcastTyping]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check max limit (8 images including already selected)
    const totalImages = selectedImages.length + files.length;
    if (totalImages > 8) {
      setImageError(`يمكنك اختيار ${8 - selectedImages.length} صور فقط (الحد الأقصى 8 صور)`);
      return;
    }

    // Validate each file (max 2MB)
    const validFiles: File[] = [];
    for (const file of files) {
      const errorMessage = validateImageFile(file, 2); // 2MB limit
      if (errorMessage) {
        setImageError(errorMessage);
        return;
      }
      validFiles.push(file);
    }

    setImageError(null);

    // Add new files to existing selection
    const newSelectedImages = [...selectedImages, ...validFiles];
    setSelectedImages(newSelectedImages);

    // Create preview URLs for new files
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
  };

  const handleRemoveImage = (index: number) => {
    // Revoke the preview URL
    if (imagePreviewUrls[index]) {
      URL.revokeObjectURL(imagePreviewUrls[index]);
    }

    // Remove from arrays
    const newSelectedImages = selectedImages.filter((_, i) => i !== index);
    const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index);

    setSelectedImages(newSelectedImages);
    setImagePreviewUrls(newPreviewUrls);
    setImageError(null);

    // Reset file input if no images left
    if (newSelectedImages.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAllImages = () => {
    // Revoke all preview URLs
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));

    setSelectedImages([]);
    setImagePreviewUrls([]);
    setImageError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThreadId || isSending) return;
    if (!messageText.trim() && selectedImages.length === 0) return;

    // Check if the other user is blocked
    const activeThread = threadsWithListings.find(t => t.id === activeThreadId);
    if (activeThread && user) {
      const otherUserId = user.id === activeThread.buyerId ? activeThread.sellerId : activeThread.buyerId;
      if (isUserBlocked(otherUserId)) {
        return;
      }
    }

    setIsSending(true);
    setIsUploadingImages(true);

    try {
      let imageKeys: string[] | undefined;

      // Upload images if selected (using unified utility)
      if (selectedImages.length > 0) {
        const { uploadMultipleToCloudflare } = await import('@/utils/cloudflare-upload');
        imageKeys = await uploadMultipleToCloudflare(selectedImages, 'image');
      }

      // Send message with optional images
      await sendMessage(activeThreadId, messageText.trim() || undefined, imageKeys);

      // Clear input
      setMessageText('');
      handleClearAllImages();
    } catch (error) {
      setImageError('فشل في إرسال الرسالة');
    } finally {
      setIsSending(false);
      setIsUploadingImages(false);
    }
  };

  const handleSelectThread = (threadId: string) => {
    setActiveThread(threadId);
    // Clear images when changing threads
    handleClearAllImages();
  };

  // Review request pattern detection (frontend-only)
  const REVIEW_REQUEST_PATTERN = '🌟 طلب تقييم';

  const isReviewRequestMessage = (messageText: string | null): boolean => {
    return messageText?.includes(REVIEW_REQUEST_PATTERN) || false;
  };

  // Send review request message
  const handleSendReviewRequest = async () => {
    if (!activeThreadId || isSending) return;

    const activeThread = threadsWithListings.find(t => t.id === activeThreadId);
    if (!activeThread || !user) return;

    // Check if the other user is blocked
    const otherUserId = user.id === activeThread.buyerId ? activeThread.sellerId : activeThread.buyerId;
    if (isUserBlocked(otherUserId)) {
      return;
    }

    setIsSending(true);
    setAttachDropdownOpen(false);

    try {
      // Send message with special pattern
      await sendMessage(activeThreadId, REVIEW_REQUEST_PATTERN);
    } catch (error) {
      // Silently fail - user can retry
    } finally {
      setIsSending(false);
    }
  };

  // Open review modal for recipient
  const handleOpenReviewModal = (senderId: string) => {
    const activeThread = threadsWithListings.find(t => t.id === activeThreadId);
    if (!activeThread) return;

    // Get sender info from listing
    const listing = activeThread.listing;
    const senderName = listing?.user?.companyName || listing?.user?.name || 'المستخدم';

    setReviewedUserId(senderId);
    setReviewedUserName(senderName);
    setReviewModalOpen(true);
  };

  if (authLoading || !user) {
    return null;
  }

  const showThreadsOnMobile = isMobile && !activeThreadId;
  const showChatOnMobile = isMobile && activeThreadId;
  const threadMessages = activeThreadId ? messages[activeThreadId] || [] : [];

  return (
    <div className={styles.container}>
      {/* Threads Aside */}
      <aside className={`${styles.threadsAside} ${showThreadsOnMobile || !isMobile ? styles.visible : styles.hidden}`}>
        <div className={styles.threadsHeader}>
          <Text variant="h3">الرسائل</Text>
        </div>

        <div className={styles.threadsList}>
          {isLoading ? (
            <div className={styles.emptyState}>
              <Text variant="paragraph" color="secondary">جاري التحميل...</Text>
            </div>
          ) : threadsWithListings.length === 0 ? (
            <div className={styles.emptyState}>
              <Text variant="paragraph" color="secondary">لا توجد محادثات بعد</Text>
            </div>
          ) : (
            threadsWithListings.map((thread) => {
              const listing = thread.listing;
              const firstImageKey = listing?.imageKeys?.[0];
              const thumbnailUrl = firstImageKey ? createChatThumbnail(firstImageKey) : null;

              // Determine the other party's name based on whether current user is buyer or seller
              const isCurrentUserBuyer = user?.id === thread.buyerId;
              // Use companyName first (for dealers/businesses), fallback to name
              const sellerName = listing?.user?.companyName || listing?.user?.name || 'البائع';

              // Check if listing is inactive (sold or removed)
              const isInactive = listing?.status && listing.status !== 'ACTIVE';

              // ✅ Check if thread has unread messages
              const hasUnread = thread.unreadCount && thread.unreadCount > 0;

              return (
                <button
                  key={thread.id}
                  className={`${styles.threadItem} ${activeThreadId === thread.id ? styles.active : ''} ${hasUnread && activeThreadId !== thread.id ? styles.unread : ''}`}
                  style={{ opacity: isInactive ? 0.7 : 1 }}
                  onClick={() => handleSelectThread(thread.id)}
                >
                  {/* Listing Image */}
                  {thumbnailUrl && (
                    <div className={styles.threadImage}>
                      <Image
                        src={thumbnailUrl}
                        alt={listing?.title || 'Listing'}
                        aspectRatio="1/1"
                      />
                    </div>
                  )}

                  {/* Thread Info */}
                  <div className={styles.threadInfo}>
                    {/* Title only - removed price */}
                    <div className={styles.threadHeader}>
                      <Text variant="paragraph" className={styles.threadTitle}>
                        {listing?.title || 'محادثة'}
                      </Text>
                    </div>

                    {/* Seller Name - Show only if current user is buyer */}
                    {isCurrentUserBuyer && (
                      <div className={styles.sellerName}>
                        <UserCircle size={16} />
                        <Text variant="small" color="secondary">
                          {sellerName}
                        </Text>
                      </div>
                    )}

                    {/* Timestamp */}
                    {thread.lastMessageAt && (
                      <Text variant="small" color="secondary" className={styles.timestamp}>
                        {formatDateShort(thread.lastMessageAt)}
                      </Text>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Chat Main */}
      <main className={`${styles.chatMain} ${showChatOnMobile || !isMobile ? styles.visible : styles.hidden}`}>
        {activeThreadId ? (
          <>
            {/* Chat Header with Listing Info */}
            {(() => {
              const activeThread = threadsWithListings.find(t => t.id === activeThreadId);
              const listing = activeThread?.listing;
              const firstImageKey = listing?.imageKeys?.[0];
              const thumbnailUrl = firstImageKey ? createChatThumbnail(firstImageKey) : null;
              const typingUserName = activeThreadId ? typingUsers[activeThreadId] : null;

              return (
                <div className={styles.chatHeader}>
                  {/* Thread Actions Dropdown */}
                  <Dropdown
                    isOpen={threadMenuOpen}
                    onClose={() => setThreadMenuOpen(false)}
                    trigger={
                      <button
                        className={styles.menuButton}
                        onClick={() => setThreadMenuOpen(!threadMenuOpen)}
                      >
                        <MoreVertical size={20} />
                      </button>
                    }
                    align="right"
                  >
                    <DropdownMenuItem
                      icon={<AlertTriangle size={16} />}
                      label="إبلاغ"
                      onClick={() => {
                        setReportModalOpen(true);
                        setThreadMenuOpen(false);
                      }}
                    />
                    <DropdownMenuItem
                      icon={<Ban size={16} />}
                      label="حظر المستخدم"
                      onClick={() => {
                        setBlockModalOpen(true);
                        setThreadMenuOpen(false);
                      }}
                    />
                    <DropdownMenuItem
                      icon={<Trash2 size={16} />}
                      label="حذف المحادثة"
                      onClick={() => {
                        setDeleteThreadModalOpen(true);
                        setThreadMenuOpen(false);
                      }}
                    />
                  </Dropdown>
                  {listing && (
                    <div className={styles.listingInfo}>
                      {thumbnailUrl && (
                        <Link href={`/${listing.category?.slug || 'car'}/${listing.id}`} className={styles.listingImage}>
                          <Image
                            src={thumbnailUrl}
                            alt={listing.title}
                            aspectRatio="1/1"
                          />
                        </Link>
                      )}
                      <div className={styles.listingDetails}>
                        <Link href={`/${listing.category?.slug || 'car'}/${listing.id}`} className={styles.listingTitleLink}>
                          <Text variant="paragraph" className={styles.listingTitle}>
                            {listing.title}
                          </Text>
                        </Link>
                        {typingUserName ? (
                          <Text variant="small" className={styles.typingIndicator}>
                            {typingUserName} يكتب...
                          </Text>
                        ) : listing.prices && listing.prices.length > 0 ? (
                          <Text variant="small" color="secondary">
                            {formatPrice(listing.priceMinor)}
                          </Text>
                        ) : null}
                      </div>
                    </div>
                  )}
                  {isMobile && (
                    <button className={styles.backButton} onClick={() => setActiveThread(null)}>
                      <ArrowLeft size={24} />
                    </button>
                  )}


                </div>
              );
            })()}

            {/* Messages */}
            <div className={styles.chatContent}>
              {threadMessages.length === 0 ? (
                <div className={styles.emptyMessages}>
                  <Text variant="paragraph" color="secondary">
                    لا توجد رسائل بعد. ابدأ المحادثة!
                  </Text>
                </div>
              ) : (
                threadMessages.map((message) => {
                  const isSentByMe = message.senderId === user.id;
                  return (
                    <div
                      key={message.id}
                      className={`${styles.message} ${isSentByMe ? styles.sent : styles.received}`}
                    >
                      <div className={styles.messageBubble}>
                        {editingMessageId === message.id ? (
                          /* Edit Mode */
                          <div className={styles.editMode}>
                            <textarea
                              className={styles.editTextarea}
                              value={editedText}
                              onChange={(e) => setEditedText(e.target.value)}
                              autoFocus
                              rows={3}
                            />
                            <div className={styles.editActions}>
                              <button
                                className={styles.editButton}
                                onClick={() => {
                                  setEditingMessageId(null);
                                  setEditedText('');
                                }}
                              >
                                إلغاء
                              </button>
                              <button
                                className={`${styles.editButton} ${styles.primary}`}
                                onClick={async () => {
                                  if (!editedText.trim()) return;
                                  try {
                                    await editMessage(message.id, editedText.trim());
                                    setEditingMessageId(null);
                                    setEditedText('');
                                  } catch (error) {
                                    // Silently fail - keep edit mode open for retry
                                  }
                                }}
                                disabled={!editedText.trim()}
                              >
                                حفظ
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Display Mode */
                          <>

                            {/* Display images if exist - clickable for modal preview */}
                            {message.imageKeys && message.imageKeys.length > 0 && (
                              <div
                                className={styles.messageImagesGrid}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: message.imageKeys.length === 1 ? '1fr' :
                                    message.imageKeys.length === 2 ? 'repeat(2, 1fr)' :
                                      'repeat(2, 1fr)',
                                  gap: '8px',
                                  marginBottom: message.text ? '8px' : 0
                                }}
                              >
                                {message.imageKeys.slice(0, 4).map((imageKey, index) => (
                                  <div
                                    key={`${message.id}-${index}`}
                                    className={styles.messageImage}
                                    onClick={() => {
                                      setPreviewImages(message.imageKeys!);
                                      setIsPreviewModalOpen(true);
                                    }}
                                    style={{ cursor: 'pointer', position: 'relative' }}
                                    title="اضغط لعرض الصور"
                                  >
                                    <Image
                                      src={optimizeListingImage(imageKey, 'large')}
                                      alt={`صورة ${index + 1} من ${message.imageKeys!.length}`}
                                      aspectRatio="1/1"
                                    />
                                    {/* Show +N overlay on 4th image if there are more */}
                                    {index === 3 && message.imageKeys!.length > 4 && (
                                      <div className={styles.moreImagesOverlay}>
                                        <Text variant="h3" style={{ color: 'white' }}>
                                          +{message.imageKeys!.length - 4}
                                        </Text>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {message.text && (
                              <>
                                {isReviewRequestMessage(message.text) ? (
                                  // Special UI for review request messages
                                  <div className={styles.reviewRequestMessage}>
                                    <div className={styles.reviewRequestContent}>
                                      <Star size={24} fill="#fbbf24" color="#fbbf24" />
                                      <Text variant="paragraph" style={{ fontWeight: 500 }}>
                                        طلب تقييم
                                      </Text>
                                    </div>
                                    {!isSentByMe && (
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleOpenReviewModal(message.senderId)}
                                        style={{ marginTop: '8px', width: '100%' }}
                                      >
                                        كتابة تقييم
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <Text variant="paragraph">{message.text}</Text>
                                )}
                              </>
                            )}
                            <div className={styles.messageFooter}>
                              <Text variant="small" color="secondary" className={styles.messageTime}>
                                {(() => {
                                  const messageDate = new Date(message.createdAt);
                                  const now = new Date();
                                  const diffInDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
                                  const time = messageDate.toLocaleTimeString('ar-EG', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  });

                                  if (diffInDays === 0) {
                                    // Today - show only time
                                    return time;
                                  } else if (diffInDays === 1) {
                                    // Yesterday
                                    return `أمس ${time}`;
                                  } else if (diffInDays < 7) {
                                    // This week - show day name
                                    const dayName = formatDayName(messageDate);
                                    return `${dayName} ${time}`;
                                  } else {
                                    // Older - show full date with time
                                    return formatDateTime(messageDate);
                                  }
                                })()}
                              </Text>
                              {isSentByMe && (
                                <span className={`${styles.messageStatus} ${message.status === MessageStatus.READ ? styles.read : styles.sent}`}>
                                  {message.status === MessageStatus.READ ? (
                                    <CheckCheck size={14} />
                                  ) : (
                                    <Check size={14} />
                                  )}
                                </span>
                              )}
                            </div>
                          </>
                        )}

                      </div>
                      {/* Only show dropdown for own messages within 5 min */}
                      {isSentByMe && Date.now() - new Date(message.createdAt).getTime() < 5 * 60 * 1000 && (
                        <Dropdown
                          isOpen={messageMenuOpen === message.id}
                          onClose={() => setMessageMenuOpen(null)}
                          trigger={
                            <div
                              className={styles.messageMenuButton}
                              onClick={() => setMessageMenuOpen(messageMenuOpen === message.id ? null : message.id)}
                            >
                              <ChevronDown size={20} />
                            </div>
                          }
                          align="right"
                          className={styles.messageMenu}
                        >
                          {/* Only show Edit for text-only messages */}
                          {(!message.imageKeys || message.imageKeys.length === 0) && (
                            <DropdownMenuItem
                              icon={<Edit2 size={14} />}
                              label="تعديل"
                              onClick={() => {
                                setEditingMessageId(message.id);
                                setEditedText(message.text || '');
                                setMessageMenuOpen(null);
                              }}
                            />
                          )}
                          <DropdownMenuItem
                            icon={<Trash2 size={14} />}
                            label="حذف"
                            onClick={() => {
                              setSelectedMessageId(message.id);
                              setDeleteMessageModalOpen(true);
                              setMessageMenuOpen(null);
                            }}
                          />
                        </Dropdown>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={styles.chatInputWrapper}>
              {/* Multiple Image Previews */}
              {imagePreviewUrls.length > 0 && (
                <div className={styles.imagePreviewsGrid}>
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className={styles.imagePreviewItem}>
                      <Image src={url} alt={`معاينة ${index + 1}`} aspectRatio="1/1" />
                      <button
                        type="button"
                        className={styles.removeImageButton}
                        onClick={() => handleRemoveImage(index)}
                        disabled={isSending}
                        title="حذف الصورة"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Error Message */}
              {imageError && (
                <div className={styles.imageError}>
                  <Text variant="small" color="secondary">{imageError}</Text>
                </div>
              )}

              <form className={styles.chatInputForm} onSubmit={handleSendMessage}>
                {/* Hidden file input - support multiple selection */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleImageSelect}
                />


                <Button
                  type="submit"
                  variant="primary"
                  disabled={(!messageText.trim() && selectedImages.length === 0) || isSending}
                  className={styles.sendButton}
                >
                  {isSending ? 'جاري الإرسال...' : <Send size={20} />}
                </Button>
                <input
                  type="text"
                  placeholder="اكتب رسالتك..."
                  className={styles.input}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={isSending}
                />
                {/* Options Dropdown (Attach / Review Request) */}
                <Dropdown
                  isOpen={attachDropdownOpen}
                  onClose={() => setAttachDropdownOpen(false)}
                  align="right"
                  trigger={
                    <Button
                      type="button"
                      variant='outline'
                      className={styles.attachButton}
                      onClick={() => setAttachDropdownOpen(!attachDropdownOpen)}
                      disabled={isSending || isUploadingImages}
                      title="خيارات"
                      icon={<MoreVertical size={20} />}
                    >

                      {selectedImages.length > 0 && (
                        <span className={styles.imageCount}>{selectedImages.length}</span>
                      )}
                    </Button>
                  }
                >
                  <DropdownMenuItem
                    icon={<Paperclip size={16} />}
                    label="إرفاق صور"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setAttachDropdownOpen(false);
                    }}
                    disabled={selectedImages.length >= 8}
                  />
                  <DropdownMenuItem
                    icon={<Star size={16} />}
                    label="طلب تقييم"
                    onClick={handleSendReviewRequest}
                  />
                </Dropdown>

              </form>
            </div>
          </>
        ) : (
          <div className={styles.emptyChat}>
            <Text variant="h3" color="secondary">اختر محادثة لبدء المراسلة</Text>
          </div>
        )}
      </main>

      {/* Modals */}
      {(() => {
        // Get active thread and reported user details
        const activeThread = threadsWithListings.find(t => t.id === activeThreadId);
        if (!activeThread || !user) return null;

        const reportedUserId = user.id === activeThread.buyerId
          ? activeThread.sellerId
          : activeThread.buyerId;

        const reportedUserName = user.id === activeThread.buyerId
          ? (activeThread.listing?.user?.companyName || activeThread.listing?.user?.name || 'البائع')
          : 'المشتري';

        const threadTitle = activeThread.listing?.title || 'محادثة';

        return (
          <ReportModal
            isVisible={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            entityType="thread"
            entityId={activeThreadId || ''}
            entityTitle={threadTitle}
            reportedUserId={reportedUserId}
            reportedUserName={reportedUserName}
          />
        );
      })()}

      <BlockUserModal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        onConfirm={async () => {
          if (!activeThreadId || !user) return;

          // Find the other user in the thread (not the current user)
          const activeThread = threadsWithListings.find(t => t.id === activeThreadId);
          if (!activeThread) return;

          const blockedUserId = user.id === activeThread.buyerId
            ? activeThread.sellerId
            : activeThread.buyerId;

          await blockUser(blockedUserId);
        }}
        userName={threadsWithListings.find(t => t.id === activeThreadId)?.listing?.user?.companyName ||
          threadsWithListings.find(t => t.id === activeThreadId)?.listing?.user?.name ||
          'المستخدم'}
      />

      <DeleteThreadModal
        isOpen={deleteThreadModalOpen}
        onClose={() => setDeleteThreadModalOpen(false)}
        onConfirm={async () => {
          if (!activeThreadId) return;
          await deleteThread(activeThreadId);
        }}
      />

      <DeleteMessageModal
        isOpen={deleteMessageModalOpen}
        onClose={() => {
          setDeleteMessageModalOpen(false);
          setSelectedMessageId(null);
        }}
        onConfirm={async () => {
          if (!selectedMessageId) return;
          await deleteMessage(selectedMessageId);
        }}
      />

      {/* Image Preview */}
      {isPreviewModalOpen && previewImages.length > 0 && (
        <ImagePreview
          images={previewImages.map(imageKey => ({
            url: optimizeListingImage(imageKey, 'public'),
            id: imageKey
          }))}
          onClose={() => setIsPreviewModalOpen(false)}
          showActions={true}
          onDownload={async (imageUrl: string, index: number) => {
            try {
              const response = await fetch(imageUrl);
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `image-${index + 1}.jpg`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            } catch (error) {
              // Silently fail - user can retry download
            }
          }}
          onDelete={async (imageId: string) => {
            // Find the message that contains this image
            const threadMessages = activeThreadId ? messages[activeThreadId] || [] : [];
            const messageWithImage = threadMessages.find((msg: ChatMessage) =>
              msg.imageKeys?.includes(imageId)
            );

            if (messageWithImage) {
              // Delete only this image from the message
              await deleteMessageImage(messageWithImage.id, imageId);

              // Update preview images - remove the deleted one
              const updatedImages = previewImages.filter(key => key !== imageId);
              setPreviewImages(updatedImages);

              // Close modal if no images left
              if (updatedImages.length === 0) {
                setIsPreviewModalOpen(false);
              }
            }
          }}
        />
      )}

      {/* Review Modal */}
      {reviewModalOpen && reviewedUserId && activeThreadId && (
        <ReviewModal
          isVisible={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setReviewedUserId(null);
            setReviewedUserName('');
          }}
          reviewedUserId={reviewedUserId}
          reviewedUserName={reviewedUserName}
          threadId={activeThreadId}
          listingId={threadsWithListings.find(t => t.id === activeThreadId)?.listingId}
        />
      )}
    </div>
  );
};
