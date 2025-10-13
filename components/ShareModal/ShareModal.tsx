'use client';

import React, { useState } from 'react';
import { Facebook, MessageCircle, Mail, Link as LinkIcon, Check } from 'lucide-react';
import { Modal } from '@/components/slices';
import styles from './ShareModal.module.scss';

export interface ShareMetadata {
  // Basic info
  title: string;
  description: string;
  url: string;

  // SEO/Social metadata
  image?: string;
  imageAlt?: string;
  siteName?: string;
  type?: 'website' | 'article' | 'product';

  // Twitter specific
  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string;

  // Product specific (for listings)
  price?: string;
  currency?: string;
  availability?: 'in stock' | 'out of stock';
}

interface ShareModalProps {
  isVisible: boolean;
  onClose: () => void;
  metadata: ShareMetadata;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isVisible, onClose, metadata }) => {
  const [copied, setCopied] = useState(false);

  const shareToWhatsApp = () => {
    const text = `${metadata.title}\n\n${metadata.description}\n\n${metadata.url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const shareToFacebook = () => {
    // Facebook will automatically fetch Open Graph tags from the page
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(metadata.url)}`;
    window.open(facebookUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    onClose();
  };

  const shareToMessenger = () => {
    const messengerUrl = `fb-messenger://share/?link=${encodeURIComponent(metadata.url)}`;
    // Fallback to web messenger if app not available
    const webMessengerUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(metadata.url)}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(metadata.url)}`;

    window.open(messengerUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const shareToTwitter = () => {
    // Twitter will fetch Twitter Card metadata
    const twitterParams = new URLSearchParams({
      url: metadata.url,
      text: `${metadata.title}\n\n${metadata.description}`,
    });

    const twitterUrl = `https://twitter.com/intent/tweet?${twitterParams.toString()}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    onClose();
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(metadata.title);

    // Create rich email body
    let emailBody = `${metadata.description}\n\n`;

    if (metadata.price && metadata.currency) {
      emailBody += `السعر: ${metadata.price} ${metadata.currency}\n\n`;
    }

    emailBody += `شاهد الإعلان كاملاً:\n${metadata.url}`;

    const body = encodeURIComponent(emailBody);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    onClose();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(metadata.url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title="مشاركة الإعلان"
      maxWidth="sm"
    >
      <div className={styles.shareOptions}>
        <button className={styles.shareOption} onClick={shareToWhatsApp}>
          <div className={styles.iconWrapper}>
            <MessageCircle size={28} />
          </div>
          <span>واتساب</span>
        </button>

        <button className={styles.shareOption} onClick={shareToFacebook}>
          <div className={styles.iconWrapper}>
            <Facebook size={28} />
          </div>
          <span>فيسبوك</span>
        </button>

        <button className={styles.shareOption} onClick={shareToMessenger}>
          <div className={styles.iconWrapper}>
            <MessageCircle size={28} />
          </div>
          <span>ماسنجر</span>
        </button>

        <button className={styles.shareOption} onClick={shareToTwitter}>
          <div className={styles.iconWrapper}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
          <span>X</span>
        </button>

        <button className={styles.shareOption} onClick={shareViaEmail}>
          <div className={styles.iconWrapper}>
            <Mail size={28} />
          </div>
          <span>بريد إلكتروني</span>
        </button>

        <button className={styles.shareOption} onClick={copyLink}>
          <div className={styles.iconWrapper}>
            {copied ? <Check size={28} className={styles.checkIcon} /> : <LinkIcon size={28} />}
          </div>
          <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
        </button>
      </div>
    </Modal>
  );
};

export default ShareModal;
