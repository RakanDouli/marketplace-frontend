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
  listing?: ThreadListing | null;
  lastMessage?: ThreadLastMessage | null;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  text: string | null;
  imageKey: string | null;
  status: 'sent' | 'delivered' | 'read';
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
