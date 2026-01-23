"use client";

import React, { useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Text } from "../Text/Text";
import { Input } from "../Input/Input";
import { Button } from "../Button/Button";
import { Form } from "../Form/Form";
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
  successMessage?: string;
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
  successMessage = "شكراً لتواصلك معنا، سنرد عليك في أقرب وقت ممكن",
  className = "",
}) => {
  const { submitContactForm, isSubmitting: storeSubmitting } = useContactStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [formSuccess, setFormSuccess] = useState<string | undefined>();
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
    setFormError(undefined);
    setFormSuccess(undefined);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        await submitContactForm(formData);
      }

      setFormSuccess(successMessage);

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setFormError("حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.");
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

      <Form
        onSubmit={handleSubmit}
        error={formError}
        success={formSuccess}
        className={styles.form}
      >
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
            options={subjects}
            required
          />
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
      </Form>
    </div>
  );
};

export default ContactForm;
