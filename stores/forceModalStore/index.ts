import { create } from 'zustand';
import type { ForceModalState, ForceModalActions } from './types';

type ForceModalStore = ForceModalState & ForceModalActions;

export const useForceModalStore = create<ForceModalStore>((set) => ({
  // Initial state
  isVisible: false,
  content: null,
  title: undefined,
  maxWidth: 'md',

  // Actions
  showForceModal: (content, options = {}) => {
    set({
      isVisible: true,
      content,
      title: options.title,
      maxWidth: options.maxWidth || 'md',
    });
  },

  hideForceModal: () => {
    set({
      isVisible: false,
      content: null,
      title: undefined,
      maxWidth: 'md',
    });
  },
}));
