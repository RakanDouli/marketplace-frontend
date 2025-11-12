"use client";

import React from "react";
import { useNotificationStore } from "@/stores";
import { useTranslation } from "@/hooks/useTranslation";
import styles from "./NotificationToast.module.scss";
import Button from "../Button";
import { Info, LaptopMinimalCheck, MessageCircleWarning, OctagonX } from "lucide-react";
import Text from "../Text/Text";

const icons = {
  success: (
    <LaptopMinimalCheck />
  ),
  error: (
    <OctagonX />

  ),
  warning: (
    <MessageCircleWarning />
  ),
  info: (
    <Info />
  ),
};

const closeIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
  </svg>
);

export const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useNotificationStore();
  const { t } = useTranslation();

  if (notifications.length === 0) return null;

  return (
    <div className={styles.container}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${styles.toast} ${styles[notification.type]}`}
        >
          <div className={`${styles.icon} ${styles[notification.type]}`}>
            {icons[notification.type]}
          </div>

          <div className={styles.content}>
            {/* <div className={styles.title}>{notification.title}</div> */}
            {notification.message && (
              <Text variant='small' className={styles.message}>{notification.message}</Text>
            )}
            {notification.action && (
              <Button
                variant="link"
                className={styles.actionButton}
                onClick={notification.action.onClick}
              >
                {notification.action.label}
              </Button>
            )}

          </div>

          <div className={styles.actions}>

            <Button
              variant="outline"
              className={styles.closeButton}
              onClick={() => removeNotification(notification.id)}
              aria-label={t("notifications.close")}
            >
              {closeIcon}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
