import { ReactNode } from 'react';

export interface ForceModalState {
  isVisible: boolean;
  content: ReactNode | null;
  title?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ForceModalActions {
  showForceModal: (content: ReactNode, options?: { title?: string; maxWidth?: 'sm' | 'md' | 'lg' | 'xl' }) => void;
  hideForceModal: () => void;
}
