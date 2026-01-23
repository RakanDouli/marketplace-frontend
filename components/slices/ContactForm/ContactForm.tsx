"use client";

import React, { useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Text } from "../Text/Text";
import { Input } from "../Input/Input";
import { Button } from "../Button/Button";
import { useNotificationStore } from "@/stores/notificationStore";
import { useContactStore } from "@/stores/contactStore";
import styles from "./ContactForm.module.scss";

export interface ContactFormSubject {
  value: string;
  label: string;
}

export interface ContactFormProps {
  title?: string;
  subjects?: ContactFormSubject[];
  onSubmit?: (data: ContactFormData) => Promise<void>;
  successMessage?: {
    title: string;
    message: string;
  };
  className?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const defaultSubjects: ContactFormSubject[] = [
  { value: "general", label: "استفسار عام" },
  { value: "support", label: "دعم فني" },
  { value: "ads", label: "الإعلانات" },
  { value: "subscriptions", label: "الاشتراكات" },
  { value: "complaint", label: "شكوى" },
  { value: "suggestion", label: "اقتراح" },
];

export const ContactForm: React.FC<ContactFormProps> = ({
  title = "أرسل لنا رسالة",
  subjects = defaultSubjects,
  onSubmit,
  successMessage = {
    title: "تم إرسال رسالتك",
    message: "شكراً لتواصلك معنا، سنرد عليك في أقرب وقت ممكن",
  },
  className = "",
}) => {
  const { addNotification } = useNotificationStore();
  const { submitContactForm, isSubmitting: storeSubmitting } = useContactStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Use the contact store to submit to backend
        await submitContactForm(formData);
      }

      addNotification({
        type: "success",
        title: successMessage.title,
        message: successMessage.message,
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "خطأ",
        message: "حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className={`${styles.contactForm} ${className}`}>
      <div className={styles.header}>
        <MessageCircle size={24} />
        <Text variant="h2">{title}</Text>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <Input
            label="الاسم الكامل"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="أدخل اسمك الكامل"
            required
          />
          <Input
            label="البريد الإلكتروني"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@email.com"
            required
          />
        </div>

        <div className={styles.formGrid}>
          <Input
            label="رقم الهاتف"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+963 XXX XXX XXX"
          />
          <Input
            label="الموضوع"
            name="subject"
            type="select"
            value={formData.subject}
            onChange={handleChange}
            required
          >
            <option value="">اختر الموضوع</option>
            {subjects.map((subject) => (
              <option key={subject.value} value={subject.value}>
                {subject.label}
              </option>
            ))}
          </Input>
        </div>

        <Input
          label="الرسالة"
          name="message"
          type="textarea"
          value={formData.message}
          onChange={handleChange}
          placeholder="اكتب رسالتك هنا..."
          rows={5}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting || storeSubmitting}
          icon={<Send size={18} />}
          className={styles.submitButton}
        >
          إرسال الرسالة
        </Button>
      </form>
    </div>
  );
};

export default ContactForm;
