'use client';

import React, { useState } from 'react';
import { Button } from '@/components/slices';
import { Modal } from '@/components/slices';
import { Key, Eye, EyeOff } from 'lucide-react';
import styles from './PasswordResetModal.module.scss';

interface PasswordResetModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<void>;
  userEmail: string;
  isLoading?: boolean;
}

export function PasswordResetModal({
  isVisible,
  onClose,
  onSubmit,
  userEmail,
  isLoading = false
}: PasswordResetModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!newPassword.trim()) {
      newErrors.newPassword = 'كلمة المرور الجديدة مطلوبة';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'كلمة المرور غير متطابقة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Password reset error:', error);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={handleClose}
      title="إعادة تعيين كلمة المرور"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.userInfo}>
          <Key size={20} />
          <div>
            <p className={styles.userEmail}>البريد الإلكتروني: {userEmail}</p>
            <p className={styles.description}>
              سيتم إرسال كلمة المرور الجديدة إلى المستخدم
            </p>
          </div>
        </div>

        {/* New Password Field */}
        <div className={styles.field}>
          <label className={styles.label}>كلمة المرور الجديدة</label>
          <div className={styles.passwordField}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword) {
                  setErrors(prev => ({ ...prev, newPassword: '' }));
                }
              }}
              className={`${styles.input} ${errors.newPassword ? styles.error : ''}`}
              placeholder="أدخل كلمة المرور الجديدة"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.passwordToggle}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.newPassword && (
            <span className={styles.errorText}>{errors.newPassword}</span>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className={styles.field}>
          <label className={styles.label}>تأكيد كلمة المرور</label>
          <div className={styles.passwordField}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) {
                  setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }
              }}
              className={`${styles.input} ${errors.confirmPassword ? styles.error : ''}`}
              placeholder="أكد كلمة المرور الجديدة"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={styles.passwordToggle}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className={styles.errorText}>{errors.confirmPassword}</span>
          )}
        </div>

        <div className={styles.warning}>
          <p>⚠️ تحذير: سيتم إرسال كلمة المرور الجديدة إلى البريد الإلكتروني للمستخدم</p>
        </div>

        {/* Form Actions */}
        <div className={styles.actions}>
          <Button
            type="button"
            onClick={handleClose}
            variant="secondary"
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={isLoading}
          >
            {isLoading ? 'جاري إعادة التعيين...' : 'إعادة تعيين كلمة المرور'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default PasswordResetModal;