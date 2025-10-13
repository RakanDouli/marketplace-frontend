'use client';

import React from 'react';
import { Modal, Text } from '@/components/slices';
import { useUserAuthStore } from '@/stores/userAuthStore';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { MagicLinkForm } from './MagicLinkForm';
import styles from './AuthModal.module.scss';

export const AuthModal: React.FC = () => {
  const { showAuthModal, authModalView, closeAuthModal, switchAuthView } = useUserAuthStore();

  return (
    <Modal isVisible={showAuthModal} onClose={closeAuthModal} className={styles.authModal}>
      <div className={styles.modalContent}>
        {/* Header with tabs */}
        <div className={styles.header}>
          <button
            className={`${styles.tab} ${authModalView === 'login' ? styles.active : ''}`}
            onClick={() => switchAuthView('login')}
          >
            <Text variant="h4">تسجيل الدخول</Text>
          </button>
          <button
            className={`${styles.tab} ${authModalView === 'signup' ? styles.active : ''}`}
            onClick={() => switchAuthView('signup')}
          >
            <Text variant="h4">إنشاء حساب</Text>
          </button>
        </div>

        {/* Forms */}
        <div className={styles.formContainer}>
          {authModalView === 'login' && <LoginForm />}
          {authModalView === 'signup' && <SignupForm />}
          {authModalView === 'magic-link' && <MagicLinkForm />}
        </div>
      </div>
    </Modal>
  );
};

export default AuthModal;
