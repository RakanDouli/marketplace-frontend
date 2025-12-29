import { create } from 'zustand';
import { cachedGraphQLRequest } from '@/utils/graphql-cache';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  GET_OR_CREATE_THREAD_MUTATION,
  SEND_MESSAGE_MUTATION,
  MY_THREADS_QUERY,
  THREAD_MESSAGES_QUERY,
  MARK_THREAD_READ_MUTATION,
  UNREAD_COUNT_QUERY,
  DELETE_MESSAGE_MUTATION,
  DELETE_MESSAGE_IMAGE_MUTATION,
  DELETE_THREAD_MUTATION,
  BLOCK_USER_MUTATION,
  EDIT_MESSAGE_MUTATION,
  MY_BLOCKED_USERS_QUERY,
  UNBLOCK_USER_MUTATION,
  CREATE_IMAGE_UPLOAD_URL_MUTATION,
} from './chatStore.gql';
import type { ChatThread, ChatMessage } from './types';

export interface BlockedUser {
  id: string;
  blockedUserId: string;
  blockedAt: string;
  blockedUser: {
    id: string;
    name: string | null;
    companyName: string | null;
    email: string;
  };
}

interface ChatState {
  threads: ChatThread[];
  activeThreadId: string | null;
  messages: Record<string, ChatMessage[]>; // threadId -> messages
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  blockedUserIds: Set<string>; // Set of blocked user IDs for fast lookup
  blockedUsers: BlockedUser[]; // Full blocked user data
  realtimeChannel: RealtimeChannel | null; // Per-thread realtime subscription (typing, messages in active thread)
  globalRealtimeChannel: RealtimeChannel | null; // Global subscription (all messages for user)
  typingUsers: Record<string, string>; // threadId -> typing user name

  // Actions
  fetchMyThreads: () => Promise<void>;
  getOrCreateThread: (listingId: string, sellerId?: string) => Promise<string>;
  fetchThreadMessages: (threadId: string, limit?: number) => Promise<void>;
  sendMessage: (threadId: string, text?: string, imageKeys?: string[]) => Promise<void>;
  markThreadRead: (threadId: string, messageId?: string) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  deleteMessageImage: (messageId: string, imageKey: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  blockUser: (blockedUserId: string) => Promise<void>;
  unblockUser: (blockedUserId: string) => Promise<void>;
  fetchBlockedUsers: () => Promise<void>;
  isUserBlocked: (userId: string) => boolean;
  createImageUploadUrl: () => Promise<{ uploadUrl: string; assetKey: string }>;
  setActiveThread: (threadId: string | null) => void;
  clearError: () => void;
  // Realtime methods
  subscribeToThread: (threadId: string, userId: string) => void;
  unsubscribeFromThread: () => void;
  subscribeGlobal: (userId: string) => void;
  unsubscribeGlobal: () => void;
  broadcastTyping: (threadId: string, userName: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  threads: [],
  activeThreadId: null,
  messages: {},
  unreadCount: 0,
  isLoading: false,
  error: null,
  blockedUserIds: new Set<string>(),
  globalRealtimeChannel: null,
  blockedUsers: [],
  realtimeChannel: null,
  typingUsers: {},

  fetchMyThreads: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await cachedGraphQLRequest(
        MY_THREADS_QUERY,
        {},
        { ttl: 0 }
      ) as { myThreads: ChatThread[] };
      set({ threads: data.myThreads, isLoading: false });
    } catch (error) {
      console.error('Error fetching threads:', error);
      set({ error: 'فشل في تحميل المحادثات', isLoading: false });
    }
  },

  getOrCreateThread: async (listingId: string, sellerId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await cachedGraphQLRequest(
        GET_OR_CREATE_THREAD_MUTATION,
        {
          input: { listingId, sellerId },
        },
        { ttl: 0 }
      );

      const thread = data.getOrCreateThread;

      // Update threads list
      set((state) => {
        const existingIndex = state.threads.findIndex((t) => t.id === thread.id);
        const updatedThreads =
          existingIndex >= 0
            ? state.threads.map((t, i) => (i === existingIndex ? thread : t))
            : [thread, ...state.threads];

        return {
          threads: updatedThreads,
          isLoading: false,
        };
      });

      return thread.id;
    } catch (error) {
      console.error('Error creating thread:', error);
      set({ error: 'فشل في إنشاء المحادثة', isLoading: false });
      throw error;
    }
  },

  fetchThreadMessages: async (threadId: string, limit = 50) => {
    set({ isLoading: true, error: null });
    try {
      const data = await cachedGraphQLRequest(
        THREAD_MESSAGES_QUERY,
        { threadId, limit },
        { ttl: 0 }
      );

      set((state) => ({
        messages: {
          ...state.messages,
          [threadId]: data.threadMessages,
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ error: 'فشل في تحميل الرسائل', isLoading: false });
    }
  },

  sendMessage: async (threadId: string, text?: string, imageKeys?: string[]) => {
    set({ error: null });
    try {
      const data = await cachedGraphQLRequest(
        SEND_MESSAGE_MUTATION,
        {
          input: { threadId, text, imageKeys },
        },
        { ttl: 0 }
      );

      const newMessage = data.sendMessage;

      // Add message to local state
      set((state) => ({
        messages: {
          ...state.messages,
          [threadId]: [...(state.messages[threadId] || []), newMessage],
        },
      }));

      // Update thread's lastMessageAt
      set((state) => ({
        threads: state.threads.map((t) =>
          t.id === threadId ? { ...t, lastMessageAt: newMessage.createdAt } : t
        ),
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      set({ error: 'فشل في إرسال الرسالة' });
      throw error;
    }
  },

  markThreadRead: async (threadId: string, messageId?: string) => {
    try {
      await cachedGraphQLRequest(
        MARK_THREAD_READ_MUTATION,
        {
          input: { threadId, messageId },
        },
        { ttl: 0 }
      );

      // ✅ Update local threads state to reset unreadCount
      set((state) => ({
        threads: state.threads.map(thread =>
          thread.id === threadId
            ? { ...thread, unreadCount: 0 }
            : thread
        ),
      }));

      // Refresh unread count
      get().fetchUnreadCount();
    } catch (error) {
      console.error('Error marking thread as read:', error);
    }
  },

  fetchUnreadCount: async () => {
    try {
      const data = await cachedGraphQLRequest(
        UNREAD_COUNT_QUERY,
        {},
        { ttl: 0 }
      );
      set({ unreadCount: data.myUnreadCount });
    } catch (error: any) {
      // Check if error is auth-related (expired token)
      const errorMessage = error?.message || '';
      const isAuthError = errorMessage.includes('Token has expired') ||
                          errorMessage.includes('UNAUTHENTICATED') ||
                          errorMessage.includes('Unauthorized');

      if (isAuthError) {
        // Silently ignore - token monitor will handle showing auth modal
        console.debug('Chat unread count: Auth token expired, skipping');
        return;
      }

      // Log other errors
      console.error('Error fetching unread count:', error);
    }
  },

  deleteMessage: async (messageId: string) => {
    try {
      await cachedGraphQLRequest(
        DELETE_MESSAGE_MUTATION,
        {
          input: { messageId },
        },
        { ttl: 0 }
      );

      // Remove message from local state
      set((state) => {
        const newMessages = { ...state.messages };
        Object.keys(newMessages).forEach((threadId) => {
          newMessages[threadId] = newMessages[threadId].filter((m) => m.id !== messageId);
        });
        return { messages: newMessages };
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      set({ error: 'فشل في حذف الرسالة' });
      throw error;
    }
  },

  deleteMessageImage: async (messageId: string, imageKey: string) => {
    try {
      const result = await cachedGraphQLRequest(
        DELETE_MESSAGE_IMAGE_MUTATION,
        {
          messageId,
          imageKey,
        },
        { ttl: 0 }
      );

      // Update local state with the updated message (or remove if message was deleted)
      set((state) => {
        const newMessages = { ...state.messages };
        Object.keys(newMessages).forEach((threadId) => {
          const messageIndex = newMessages[threadId].findIndex((m) => m.id === messageId);
          if (messageIndex !== -1) {
            if (result.deleteMessageImage) {
              // Message still exists, update it with new imageKeys
              newMessages[threadId][messageIndex] = result.deleteMessageImage;
            } else {
              // Message was deleted (last image removed, no text)
              newMessages[threadId] = newMessages[threadId].filter((m) => m.id !== messageId);
            }
          }
        });
        return { messages: newMessages };
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      set({ error: 'فشل في حذف الصورة' });
      throw error;
    }
  },

  deleteThread: async (threadId: string) => {
    try {
      await cachedGraphQLRequest(
        DELETE_THREAD_MUTATION,
        { threadId },
        { ttl: 0 }
      );

      // Remove thread from local state
      set((state) => ({
        threads: state.threads.filter((t) => t.id !== threadId),
        activeThreadId: state.activeThreadId === threadId ? null : state.activeThreadId,
      }));

      // Remove messages
      set((state) => {
        const newMessages = { ...state.messages };
        delete newMessages[threadId];
        return { messages: newMessages };
      });
    } catch (error) {
      console.error('Error deleting thread:', error);
      set({ error: 'فشل في حذف المحادثة' });
      throw error;
    }
  },

  editMessage: async (messageId: string, newText: string) => {
    try {
      const data = await cachedGraphQLRequest(
        EDIT_MESSAGE_MUTATION,
        {
          input: { messageId, text: newText },
        },
        { ttl: 0 }
      );

      const updatedMessage = data.editMessage;

      // Update message in local state
      set((state) => {
        const newMessages = { ...state.messages };
        Object.keys(newMessages).forEach((threadId) => {
          newMessages[threadId] = newMessages[threadId].map((m) =>
            m.id === messageId ? updatedMessage : m
          );
        });
        return { messages: newMessages };
      });
    } catch (error) {
      console.error('Error editing message:', error);
      set({ error: 'فشل في تعديل الرسالة' });
      throw error;
    }
  },

  blockUser: async (blockedUserId: string) => {
    try {
      await cachedGraphQLRequest(
        BLOCK_USER_MUTATION,
        { blockedUserId },
        { ttl: 0 }
      );

      // Add to blocked users set
      set((state) => {
        const newBlockedUserIds = new Set(state.blockedUserIds);
        newBlockedUserIds.add(blockedUserId);
        return { blockedUserIds: newBlockedUserIds };
      });

      // Refresh threads to remove blocked user's threads
      get().fetchMyThreads();
    } catch (error) {
      console.error('Error blocking user:', error);
      set({ error: 'فشل في حظر المستخدم' });
      throw error;
    }
  },

  fetchBlockedUsers: async () => {
    try {
      const data = await cachedGraphQLRequest(
        MY_BLOCKED_USERS_QUERY,
        {},
        { ttl: 0 } // No cache - always fresh
      ) as { myBlockedUsers: BlockedUser[] };

      // Convert array to Set for fast lookup
      const blockedIds = new Set(data.myBlockedUsers.map((b: BlockedUser) => b.blockedUserId));
      set({
        blockedUserIds: blockedIds,
        blockedUsers: data.myBlockedUsers
      });
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      set({ error: 'فشل في تحميل قائمة المحظورين' });
    }
  },

  unblockUser: async (blockedUserId: string) => {
    try {
      await cachedGraphQLRequest(
        UNBLOCK_USER_MUTATION,
        { blockedUserId },
        { ttl: 0 }
      );

      // Remove from blocked users set
      set((state) => {
        const newBlockedUserIds = new Set(state.blockedUserIds);
        newBlockedUserIds.delete(blockedUserId);
        const newBlockedUsers = state.blockedUsers.filter(b => b.blockedUserId !== blockedUserId);
        return {
          blockedUserIds: newBlockedUserIds,
          blockedUsers: newBlockedUsers
        };
      });

      // Refresh threads to show unblocked user's threads
      get().fetchMyThreads();
    } catch (error) {
      console.error('Error unblocking user:', error);
      set({ error: 'فشل في إلغاء حظر المستخدم' });
      throw error;
    }
  },

  isUserBlocked: (userId: string): boolean => {
    return get().blockedUserIds.has(userId);
  },

  createImageUploadUrl: async () => {
    try {
      const data = await cachedGraphQLRequest(
        CREATE_IMAGE_UPLOAD_URL_MUTATION, {}, { ttl: 0 }
      ) as { createImageUploadUrl: { uploadUrl: string; assetKey: string } };

      return data.createImageUploadUrl;
    } catch (error) {
      console.error('Error creating image upload URL:', error);
      set({ error: 'فشل في إنشاء رابط رفع الصورة' });
      throw error;
    }
  },

  setActiveThread: (threadId: string | null) => {
    set({ activeThreadId: threadId });
  },

  clearError: () => {
    set({ error: null });
  },

  // Realtime Subscriptions
  subscribeToThread: (threadId: string, userId: string) => {
    const { realtimeChannel } = get();

    // Unsubscribe from previous channel if exists
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }

    // Create new channel for this thread
    const channel = supabase
      .channel(`thread:${threadId}`)
      // Listen for new messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `threadId=eq.${threadId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;

          // Add message to store if it's not from current user
          if (newMessage.senderId !== userId) {
            set((state) => ({
              messages: {
                ...state.messages,
                [threadId]: [...(state.messages[threadId] || []), newMessage],
              },
              // Update thread's lastMessageAt and increment unreadCount
              threads: state.threads.map(thread =>
                thread.id === threadId
                  ? {
                      ...thread,
                      lastMessageAt: newMessage.createdAt,
                      unreadCount: (thread.unreadCount || 0) + 1,
                    }
                  : thread
              ),
            }));

            // Auto-mark as read if thread is currently active (user is viewing it)
            const currentActiveThread = get().activeThreadId;
            if (currentActiveThread === threadId) {
              get().markThreadRead(threadId, newMessage.id);
            }

            // Refresh unread count
            get().fetchUnreadCount();
          }
        }
      )
      // Listen for message updates (status changes)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `threadId=eq.${threadId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;

          set((state) => ({
            messages: {
              ...state.messages,
              [threadId]: (state.messages[threadId] || []).map((msg) =>
                msg.id === updatedMessage.id ? updatedMessage : msg
              ),
            },
          }));

          // Refresh unread count when message status changes
          get().fetchUnreadCount();
        }
      )
      // Listen for participant updates (read status)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_participants',
          filter: `threadId=eq.${threadId}`,
        },
        (payload) => {
          // When other user reads messages, update message statuses to READ
          const participant = payload.new as any;

          if (participant.userId !== userId && participant.lastReadAt) {
            const lastReadAt = new Date(participant.lastReadAt);

            set((state) => ({
              messages: {
                ...state.messages,
                [threadId]: (state.messages[threadId] || []).map((msg) => {
                  // If message is from current user and was created before lastReadAt, mark as READ
                  if (
                    msg.senderId === userId &&
                    new Date(msg.createdAt) <= lastReadAt &&
                    msg.status !== 'read'
                  ) {
                    return { ...msg, status: 'read' as const };
                  }
                  return msg;
                }),
              },
            }));

            // Refresh unread count when participant reads messages
            get().fetchUnreadCount();
          }

          // Also refresh unread count when current user reads (participant.userId === userId)
          if (participant.userId === userId) {
            get().fetchUnreadCount();
          }
        }
      )
      // Typing indicator using Presence
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();

        // Get typing users (exclude current user)
        const typingUser = Object.values(state).find(
          (presences: any) => presences[0]?.typing && presences[0]?.userId !== userId
        );

        if (typingUser) {
          set((state) => ({
            typingUsers: {
              ...state.typingUsers,
              [threadId]: (typingUser as any)[0].userName,
            },
          }));

          // Clear typing indicator after 3 seconds
          setTimeout(() => {
            set((state) => {
              const { [threadId]: _, ...rest } = state.typingUsers;
              return { typingUsers: rest };
            });
          }, 3000);
        } else {
          set((state) => {
            const { [threadId]: _, ...rest } = state.typingUsers;
            return { typingUsers: rest };
          });
        }
      })
      .subscribe();

    set({ realtimeChannel: channel });
  },

  unsubscribeFromThread: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      set({ realtimeChannel: null, typingUsers: {} });
    }
  },

  broadcastTyping: (threadId: string, userName: string) => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      realtimeChannel.track({
        typing: true,
        userName,
        userId: userName, // Will be replaced with actual userId
      });

      // Stop broadcasting after 2 seconds
      setTimeout(() => {
        if (realtimeChannel) {
          realtimeChannel.track({ typing: false });
        }
      }, 2000);
    }
  },

  // Global realtime subscription (listens to ALL threads for this user)
  subscribeGlobal: (userId: string) => {
    const { globalRealtimeChannel, threads } = get();

    // Don't subscribe if already subscribed
    if (globalRealtimeChannel) {
      return;
    }

    // Get all thread IDs for this user
    const threadIds = threads.map(t => t.id);

    // Create global channel that listens to ALL chat messages where user is participant
    const channel = supabase
      .channel(`global:${userId}`)
      // Listen for ALL new messages in user's threads
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;

          // Only process if message is in one of user's threads
          const thread = threads.find(t => t.id === newMessage.threadId);
          if (!thread) return;

          // If message is from another user (not current user)
          if (newMessage.senderId !== userId) {
            // Update threads state: increment unreadCount and update lastMessageAt
            // ALSO add message to messages array if we have that thread loaded
            set((state) => ({
              threads: state.threads.map(t =>
                t.id === newMessage.threadId
                  ? {
                      ...t,
                      lastMessageAt: newMessage.createdAt,
                      unreadCount: (t.unreadCount || 0) + 1,
                    }
                  : t
              ),
              // ✅ Add message to local messages state
              messages: {
                ...state.messages,
                [newMessage.threadId]: [
                  ...(state.messages[newMessage.threadId] || []),
                  newMessage
                ],
              },
            }));

            // Refresh unread count badge
            get().fetchUnreadCount();
          }
        }
      )
      // Listen for ALL message updates (status changes: sent → read)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;

          // Only process if message is in one of user's threads
          const thread = threads.find(t => t.id === updatedMessage.threadId);
          if (!thread) return;

          // Update message in local state if we have it loaded
          set((state) => {
            const threadMessages = state.messages[updatedMessage.threadId];
            if (!threadMessages) return state;

            return {
              messages: {
                ...state.messages,
                [updatedMessage.threadId]: threadMessages.map((msg) =>
                  msg.id === updatedMessage.id ? updatedMessage : msg
                ),
              },
            };
          });
        }
      )
      // Listen for participant updates (read status)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_participants',
        },
        (payload) => {
          const participant = payload.new as any;

          // Only process if participant is in one of user's threads
          const thread = threads.find(t => t.id === participant.threadId);
          if (!thread) return;

          // If OTHER user read messages, update message statuses to READ
          if (participant.userId !== userId && participant.lastReadAt) {
            const lastReadAt = new Date(participant.lastReadAt);

            set((state) => {
              const threadMessages = state.messages[participant.threadId];
              if (!threadMessages) return state;

              return {
                messages: {
                  ...state.messages,
                  [participant.threadId]: threadMessages.map((msg) => {
                    if (
                      msg.senderId === userId &&
                      new Date(msg.createdAt) <= lastReadAt &&
                      msg.status !== 'read'
                    ) {
                      return { ...msg, status: 'read' as const };
                    }
                    return msg;
                  }),
                },
              };
            });
          }

          // Refresh unread count when anyone reads
          get().fetchUnreadCount();
        }
      )
      .subscribe();

    set({ globalRealtimeChannel: channel });
  },

  unsubscribeGlobal: () => {
    const { globalRealtimeChannel } = get();
    if (globalRealtimeChannel) {
      supabase.removeChannel(globalRealtimeChannel);
      set({ globalRealtimeChannel: null });
    }
  },
}));
