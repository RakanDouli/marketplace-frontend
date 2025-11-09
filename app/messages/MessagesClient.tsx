'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Send, UserCircle, MoreVertical, Trash2, Ban, AlertTriangle, Edit2, ArrowBigDown, ChevronDown, ChevronRight, Paperclip, X } from 'lucide-react';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { useChatStore } from '@/stores/chatStore';
import { useListingsStore } from '@/stores/listingsStore';
import { Text, Button, Image, Dropdown, DropdownMenuItem } from '@/components/slices';
import { formatPrice } from '@/utils/formatPrice';
import { createThumbnail, optimizeListingImage } from '@/utils/cloudflare-images';
import { uploadToCloudflare, validateImageFile } from '@/utils/cloudflare-upload';
import { ReportThreadModal, BlockUserModal, DeleteThreadModal, DeleteMessageModal } from './ChatModals';
import type { Listing } from '@/stores/types';
import styles from './Messages.module.scss';

interface ThreadWithListing {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string | null;
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
    fetchMyThreads,
    fetchThreadMessages,
    sendMessage,
    setActiveThread,
    deleteThread,
    deleteMessage,
    editMessage,
    reportThread,
    blockUser,
    fetchBlockedUsers,
    isUserBlocked,
  } = useChatStore();
  const { fetchListingById } = useListingsStore();

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

  // Image attachment state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

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
          console.log(`⛔ Skipping thread with blocked user ${otherUserId}`);
          continue;
        }

        try {
          await fetchListingById(thread.listingId);
          const listing = useListingsStore.getState().currentListing;
          threadsWithData.push({ ...thread, listing });
        } catch (error) {
          // Listing might be deleted/archived - skip this thread
          console.log(`⚠️ Skipping thread for listing ${thread.listingId} (not found)`);
        }
      }

      // Only update state if component is still mounted
      if (isMounted) {
        console.log('📬 Threads with listings loaded:', threadsWithData);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const errorMessage = validateImageFile(file);
    if (errorMessage) {
      setImageError(errorMessage);
      return;
    }

    setImageError(null);
    setSelectedImage(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThreadId || isSending) return;
    if (!messageText.trim() && !selectedImage) return;

    // Check if the other user is blocked
    const activeThread = threadsWithListings.find(t => t.id === activeThreadId);
    if (activeThread && user) {
      const otherUserId = user.id === activeThread.buyerId ? activeThread.sellerId : activeThread.buyerId;
      if (isUserBlocked(otherUserId)) {
        console.log('⛔ Cannot send message to blocked user');
        return;
      }
    }

    setIsSending(true);
    setIsUploadingImage(true);

    try {
      let imageKey: string | undefined;

      // Upload image if selected (using unified utility)
      if (selectedImage) {
        imageKey = await uploadToCloudflare(selectedImage, 'image');
      }

      // Send message with optional image
      await sendMessage(activeThreadId, messageText.trim() || undefined, imageKey);

      // Clear input
      setMessageText('');
      handleRemoveImage();
    } catch (error) {
      console.error('Failed to send message:', error);
      setImageError('فشل في إرسال الرسالة');
    } finally {
      setIsSending(false);
      setIsUploadingImage(false);
    }
  };

  const handleSelectThread = (threadId: string) => {
    setActiveThread(threadId);
    // Clear image when changing threads
    handleRemoveImage();
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
              const thumbnailUrl = firstImageKey ? createThumbnail(firstImageKey) : null;

              // Determine the other party's name based on whether current user is buyer or seller
              const isCurrentUserBuyer = user?.id === thread.buyerId;
              // Use companyName first (for dealers/businesses), fallback to name
              const sellerName = listing?.user?.companyName || listing?.user?.name || 'البائع';

              // Check if listing is inactive (sold or removed)
              const isInactive = listing?.status && listing.status !== 'ACTIVE';

              return (
                <button
                  key={thread.id}
                  className={`${styles.threadItem} ${activeThreadId === thread.id ? styles.active : ''}`}
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
                        {new Date(thread.lastMessageAt).toLocaleString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                        })}
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
              const thumbnailUrl = firstImageKey ? createThumbnail(firstImageKey) : null;

              return (
                <div className={styles.chatHeader}>
                  {isMobile && (
                    <button className={styles.backButton} onClick={() => setActiveThread(null)}>
                      <ChevronRight size={20} />
                    </button>
                  )}

                  {listing && (
                    <div className={styles.listingInfo}>
                      {thumbnailUrl && (
                        <div className={styles.listingImage}>
                          <Image
                            src={thumbnailUrl}
                            alt={listing.title}
                            aspectRatio="1/1"
                          />
                        </div>
                      )}
                      <div className={styles.listingDetails}>
                        <Text variant="paragraph" className={styles.listingTitle}>
                          {listing.title}
                        </Text>
                        {listing.prices && listing.prices.length > 0 && (
                          <Text variant="small" color="secondary">
                            {formatPrice(listing.priceMinor, listing.prices[0].currency)}
                          </Text>
                        )}
                      </div>
                    </div>
                  )}

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
                    align="left"
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
                                    console.error('Failed to edit message:', error);
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
                            <span className={styles.messageArea}>
                              {/* Display image if exists */}
                              {message.imageKey && (
                                <div className={styles.messageImage}>
                                  <Image
                                    src={optimizeListingImage(message.imageKey, 'large')}
                                    alt="صورة مرفقة"
                                    aspectRatio="4/3"
                                  />
                                </div>
                              )}

                              {message.text && (
                                <Text variant="paragraph">{message.text}</Text>
                              )}
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
                                    const dayName = messageDate.toLocaleDateString('ar-EG', { weekday: 'long' });
                                    return `${dayName} ${time}`;
                                  } else {
                                    // Older - show full date
                                    return messageDate.toLocaleDateString('ar-EG', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    });
                                  }
                                })()}
                              </Text>
                            </span>


                            {/* Message Actions Dropdown - Only for sent messages */}
                            {isSentByMe && (
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
                                {!message.imageKey && (
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
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={styles.chatInputWrapper}>
              {/* Image Preview */}
              {imagePreviewUrl && (
                <div className={styles.imagePreview}>
                  <img src={imagePreviewUrl} alt="معاينة" />
                  <button
                    type="button"
                    className={styles.removeImageButton}
                    onClick={handleRemoveImage}
                    disabled={isSending}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Error Message */}
              {imageError && (
                <div className={styles.imageError}>
                  <Text variant="small" color="secondary">{imageError}</Text>
                </div>
              )}

              <form className={styles.chatInputForm} onSubmit={handleSendMessage}>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleImageSelect}
                />

                {/* Attach button */}
                <Button
                  // type="button"
                  variant='outline'
                  className={styles.attachButton}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending || isUploadingImage}
                >
                  <Paperclip size={20} />
                </Button>

                <input
                  type="text"
                  placeholder="اكتب رسالتك..."
                  className={styles.input}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={isSending}
                />

                <Button
                  type="submit"
                  variant="primary"
                  disabled={(!messageText.trim() && !selectedImage) || isSending}
                  className={styles.sendButton}
                >
                  {isSending ? 'جاري الإرسال...' : <Send size={20} />}
                </Button>
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
      <ReportThreadModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onConfirm={async (reason, details) => {
          if (!activeThreadId) return;

          // Find the other user in the thread (not the current user)
          const activeThread = threadsWithListings.find(t => t.id === activeThreadId);
          if (!activeThread || !user) return;

          const reportedUserId = user.id === activeThread.buyerId
            ? activeThread.sellerId
            : activeThread.buyerId;

          await reportThread(reportedUserId, activeThreadId, reason, details);
        }}
        threadId={activeThreadId || ''}
      />

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
    </div>
  );
};
