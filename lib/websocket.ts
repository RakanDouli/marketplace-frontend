// WebSocket utility for real-time chat and notifications

export interface WebSocketMessage {
  type: 'chat' | 'bid' | 'notification';
  data: any;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  listingId?: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface BidNotification {
  type: 'new_bid' | 'bid_accepted' | 'bid_rejected';
  bidId: string;
  listingId: string;
  amount: number;
  message?: string;
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private connect() {
    const wsEndpoint = process.env.NEXT_PUBLIC_WS_ENDPOINT || 'ws://localhost:4000/ws';
    const token = this.getAuthToken();

    try {
      this.ws = new WebSocket(`${wsEndpoint}?token=${token}`);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.scheduleReconnect();
    }
  }

  private getAuthToken(): string {
    if (typeof window === 'undefined') return '';
    
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const { state } = JSON.parse(authStorage);
        return state?.token || '';
      }
    } catch (error) {
      console.warn('Failed to get auth token for WebSocket');
    }
    
    return '';
  }

  private setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.stopHeartbeat();
      
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private startHeartbeat() {
    const heartbeatSec = parseInt(process.env.NEXT_PUBLIC_WS_HEARTBEAT_SEC || '30') * 1000;
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, heartbeatSec);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`Attempting WebSocket reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  private handleMessage(message: WebSocketMessage) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data);
    }
    
    // Emit custom event for components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ws-message', { detail: message }));
    }
  }

  // Public methods
  public onMessage(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  public offMessage(type: string) {
    this.messageHandlers.delete(type);
  }

  public sendMessage(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data, timestamp: new Date().toISOString() }));
    } else {
      console.warn('WebSocket not connected, message not sent:', { type, data });
    }
  }

  public sendChatMessage(receiverId: string, message: string, listingId?: string) {
    this.sendMessage('chat', {
      receiverId,
      message,
      listingId,
      timestamp: new Date().toISOString()
    });
  }

  public disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let wsManager: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager();
  }
  return wsManager;
}

// React hook for WebSocket
export function useWebSocket() {
  const ws = getWebSocketManager();
  
  return {
    sendMessage: ws.sendMessage.bind(ws),
    sendChatMessage: ws.sendChatMessage.bind(ws),
    onMessage: ws.onMessage.bind(ws),
    offMessage: ws.offMessage.bind(ws),
    isConnected: ws.isConnected.bind(ws),
    disconnect: ws.disconnect.bind(ws)
  };
}