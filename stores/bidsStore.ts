import { create } from 'zustand';
import { BidsState, Bid } from './types';

interface BidsActions {
  setBids: (bids: Bid[]) => void;
  addBid: (bid: Bid) => void;
  updateBid: (id: string, updates: Partial<Bid>) => void;
  removeBid: (id: string) => void;
  setMyBids: (bids: Bid[]) => void;
  setReceivedBids: (bids: Bid[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearBids: () => void;
}

type BidsStore = BidsState & BidsActions;

export const useBidsStore = create<BidsStore>((set, get) => ({
  // Initial state
  bids: [],
  myBids: [],
  receivedBids: [],
  isLoading: false,
  error: null,

  // Actions
  setBids: (bids: Bid[]) => {
    set({ bids, error: null });
  },

  addBid: (bid: Bid) => {
    const { bids } = get();
    set({ 
      bids: [bid, ...bids],
      error: null 
    });
  },

  updateBid: (id: string, updates: Partial<Bid>) => {
    const { bids, myBids, receivedBids } = get();
    
    const updateBidInArray = (bidArray: Bid[]) =>
      bidArray.map(bid => bid.id === id ? { ...bid, ...updates } : bid);
    
    set({
      bids: updateBidInArray(bids),
      myBids: updateBidInArray(myBids),
      receivedBids: updateBidInArray(receivedBids),
    });
  },

  removeBid: (id: string) => {
    const { bids, myBids, receivedBids } = get();
    
    set({
      bids: bids.filter(bid => bid.id !== id),
      myBids: myBids.filter(bid => bid.id !== id),
      receivedBids: receivedBids.filter(bid => bid.id !== id),
    });
  },

  setMyBids: (myBids: Bid[]) => {
    set({ myBids, error: null });
  },

  setReceivedBids: (receivedBids: Bid[]) => {
    set({ receivedBids, error: null });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error, isLoading: false });
  },

  clearError: () => {
    set({ error: null });
  },

  clearBids: () => {
    set({
      bids: [],
      myBids: [],
      receivedBids: [],
      error: null,
    });
  },
}));

// Selectors
export const useBids = () => useBidsStore((state) => state.bids);
export const useMyBids = () => useBidsStore((state) => state.myBids);
export const useReceivedBids = () => useBidsStore((state) => state.receivedBids);
export const useBidsLoading = () => useBidsStore((state) => state.isLoading);
export const useBidsError = () => useBidsStore((state) => state.error);