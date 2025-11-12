import { create } from 'zustand';
import { cachedGraphQLRequest } from '@/utils/graphql-cache';
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
  CREATE_REPORT_MUTATION,
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
  reportThread: (reportedUserId: string, threadId: string, reason: string, details?: string) => Promise<void>;
  blockUser: (blockedUserId: string) => Promise<void>;
  unblockUser: (blockedUserId: string) => Promise<void>;
  fetchBlockedUsers: () => Promise<void>;
  isUserBlocked: (userId: string) => boolean;
  createImageUploadUrl: () => Promise<{ uploadUrl: string; assetKey: string }>;
  setActiveThread: (threadId: string | null) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  threads: [],
  activeThreadId: null,
  messages: {},
  unreadCount: 0,
  isLoading: false,
  error: null,
  blockedUserIds: new Set<string>(),
  blockedUsers: [],

  fetchMyThreads: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await cachedGraphQLRequest<{ myThreads: ChatThread[] }>(
        MY_THREADS_QUERY,
        {},
        { ttl: 0 }
      );
      console.log('📬 Fetched threads:', data.myThreads);
      console.log('📬 First thread listing data:', data.myThreads[0]?.listing);
      set({ threads: data.myThreads, isLoading: false });
    } catch (error) {
      console.error('Error fetching threads:', error);
      set({ error: 'فشل في تحميل المحادثات', isLoading: false });
    }
  },

  getOrCreateThread: async (listingId: string, sellerId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await cachedGraphQLRequest<{ getOrCreateThread: ChatThread }>(
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
      const data = await cachedGraphQLRequest<{ threadMessages: ChatMessage[] }>(
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
      const data = await cachedGraphQLRequest<{ sendMessage: ChatMessage }>(
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

      // Refresh unread count
      get().fetchUnreadCount();
    } catch (error) {
      console.error('Error marking thread as read:', error);
    }
  },

  fetchUnreadCount: async () => {
    try {
      const data = await cachedGraphQLRequest<{ unreadCount: number }>(
        UNREAD_COUNT_QUERY,
        {},
        { ttl: 0 }
      );
      set({ unreadCount: data.unreadCount });
    } catch (error) {
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
      const result = await cachedGraphQLRequest<{ deleteMessageImage: ChatMessage | null }>(
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
      const data = await cachedGraphQLRequest<{ editMessage: ChatMessage }>(
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

  reportThread: async (reportedUserId: string, threadId: string, reason: string, details?: string) => {
    try {
      await cachedGraphQLRequest(
        CREATE_REPORT_MUTATION,
        {
          reportedUserId,
          entityType: 'thread',
          entityId: threadId,
          reason,
          details: details || null,
        },
        { ttl: 0 }
      );
    } catch (error) {
      console.error('Error reporting thread:', error);
      set({ error: 'فشل في إرسال البلاغ' });
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
      const data = await cachedGraphQLRequest<{ myBlockedUsers: BlockedUser[] }>(
        MY_BLOCKED_USERS_QUERY,
        {},
        { ttl: 0 } // No cache - always fresh
      );

      // Convert array to Set for fast lookup
      const blockedIds = new Set(data.myBlockedUsers.map(b => b.blockedUserId));
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
      const data = await cachedGraphQLRequest<{
        createImageUploadUrl: { uploadUrl: string; assetKey: string };
      }>(CREATE_IMAGE_UPLOAD_URL_MUTATION, {}, { ttl: 0 });

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
}));
