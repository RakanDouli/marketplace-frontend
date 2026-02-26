export interface ThreadListing {
  id: string;
  title: string;
  priceMinor: number;
  currency: string;
  images: string[];
}

export interface ThreadLastMessage {
  text: string | null;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string | null;
  unreadCount?: number; // ✅ Added: Per-thread unread count
  listing?: ThreadListing | null;
  lastMessage?: ThreadLastMessage | null;
}

import { MessageStatus } from '@/common/enums';

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  text: string | null;
  imageKeys: string[] | null;
  messageType?: 'text' | 'review_request'; // Special message types
  status: MessageStatus;
  createdAt: string;
}

export interface ThreadWithDetails extends ChatThread {
  listing?: {
    id: string;
    title: string;
    images: string[];
    priceMinor: number;
    currency: string;
  };
  otherUser?: {
    id: string;
    fullName: string;
    avatar: string | null;
  };
  lastMessage?: {
    text: string | null;
    createdAt: string;
  };
  unreadCount?: number;
}
