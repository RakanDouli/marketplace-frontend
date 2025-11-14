'use client';

import React from 'react';
import { Phone, Mail, MessageCircle, Copy } from 'lucide-react';
import { Text, Button, Modal } from '@/components/slices';
import { useNotificationStore } from '@/stores/notificationStore';
import type { AdPackage } from '@/stores/adPackagesStore/types';
import styles from './ContactAdModal.module.scss';

interface ContactAdModalProps {
  package: AdPackage | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContactAdModal: React.FC<ContactAdModalProps> = ({
  package: selectedPackage,
  isOpen,
  onClose,
}) => {
  const { addNotification } = useNotificationStore();

  if (!selectedPackage) return null;

  const CONTACT_PHONE = '+1-555-ADS-TEAM';
  const CONTACT_EMAIL = 'ads@marketplace.com';
  const WHATSAPP_NUMBER = '1555ADSTEAM';

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(CONTACT_PHONE);
    addNotification({
      type: 'success',
      title: 'تم النسخ',
      message: 'تم نسخ رقم الهاتف',
    });
  };

  const handleEmailClick = () => {
    const subject = encodeURIComponent(`استفسار: ${selectedPackage.packageName}`);
    const body = encodeURIComponent(`
مرحباً،

أرغب في الاستفسار عن حزمة الإعلانات التالية:

- الحزمة: ${selectedPackage.packageName}
- السعر: $${selectedPackage.basePrice} / ${selectedPackage.durationDays} يوم
- الموضع: ${selectedPackage.placement}
- عدد الظهور: ${selectedPackage.impressionLimit.toLocaleString()}

الرجاء التواصل معي لإتمام الحجز.

شكراً
    `);

    window.open(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleWhatsAppClick = () => {
    const text = encodeURIComponent(
      `مرحباً، أرغب في الاستفسار عن: ${selectedPackage.packageName} ($${selectedPackage.basePrice} / ${selectedPackage.durationDays} يوم)`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  return (
    <Modal isVisible={isOpen} onClose={onClose}>
      <div className={styles.modal}>
        <Text variant="h2">تواصل معنا بخصوص الإعلانات</Text>

        {/* Selected Package Info */}
        <div className={styles.packageInfo}>
          <Text variant="h4">{selectedPackage.packageName}</Text>
          <Text variant="paragraph" color="secondary">
            {selectedPackage.description}
          </Text>
          <div className={styles.price}>
            <Text variant="h3">${selectedPackage.basePrice}</Text>
            <Text variant="paragraph" color="secondary">
              / {selectedPackage.durationDays} يوم
            </Text>
          </div>
        </div>

        <div className={styles.divider}></div>

        <Text variant="h4">اختر طريقة التواصل:</Text>

        <div className={styles.contactOptions}>
          {/* Phone */}
          <div className={styles.contactOption}>
            <div className={styles.optionHeader}>
              <Phone size={20} />
              <Text variant="h4">اتصال مباشر</Text>
            </div>
            <Text variant="paragraph" color="secondary">
              {CONTACT_PHONE}
            </Text>
            <Button
              variant="outline"
              onClick={handleCopyPhone}

            >
              <Copy size={16} />
              انسخ الرقم
            </Button>
          </div>

          {/* Email */}
          <div className={styles.contactOption}>
            <div className={styles.optionHeader}>
              <Mail size={20} />
              <Text variant="h4">إرسال بريد إلكتروني</Text>
            </div>
            <Text variant="paragraph" color="secondary">
              {CONTACT_EMAIL}
            </Text>
            <Button
              variant="outline"
              onClick={handleEmailClick}
            >
              <Mail size={16} />
              فتح البريد
            </Button>
          </div>

          {/* WhatsApp */}
          <div className={styles.contactOption}>
            <div className={styles.optionHeader}>
              <MessageCircle size={20} />
              <Text variant="h4">واتساب</Text>
            </div>
            <Text variant="paragraph" color="secondary">
              {CONTACT_PHONE}
            </Text>
            <Button
              variant="primary"
              onClick={handleWhatsAppClick}

            >
              <MessageCircle size={16} />
              فتح واتساب
            </Button>
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} >
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
};
