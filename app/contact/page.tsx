"use client";

import React, { useState } from "react";
import { Container, Text, TextSection, Collapsible, Grid, FeatureCard } from "@/components/slices";
import { Input } from "@/components/slices/Input/Input";
import { Button } from "@/components/slices/Button/Button";
import { Phone, Mail, MapPin, Clock, Send, MessageCircle, Building2 } from "lucide-react";
import { useNotificationStore } from "@/stores/notificationStore";
import styles from "./Contact.module.scss";

export default function ContactPage() {
  const { addNotification } = useNotificationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    addNotification({
      type: "success",
      title: "تم إرسال رسالتك",
      message: "شكراً لتواصلك معنا، سنرد عليك في أقرب وقت ممكن",
    });

    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const contactInfo = [
    {
      icon: <Phone size={24} />,
      title: "الهاتف",
      value: "+963 123 456 789",
      href: "tel:+963123456789",
    },
    {
      icon: <Mail size={24} />,
      title: "البريد الإلكتروني",
      value: "info@syrianmarketplace.com",
      href: "mailto:info@syrianmarketplace.com",
    },
    {
      icon: <MapPin size={24} />,
      title: "العنوان",
      value: "دمشق، سوريا",
      href: null,
    },
    {
      icon: <Clock size={24} />,
      title: "ساعات العمل",
      value: "السبت - الخميس: 9 صباحاً - 6 مساءً",
      href: null,
    },
  ];

  return (
    <div className={styles.ContactPage}>
      <TextSection
        title="اتصل بنا - نحن هنا لمساعدتك"
        subtitle="لديك سؤال أو استفسار؟ تواصل معنا وسنرد عليك في أقرب وقت"
        align="center"
        nostyle
      />

      <Container>
        {/* Contact Cards */}
        <Grid columns={4} mobileColumns={1} className={styles.contactCards}>
          {contactInfo.map((info, index) => (
            <FeatureCard
              key={index}
              icon={info.icon}
              title={info.title}
              variant="card"
            >
              {info.href ? (
                <a href={info.href} className={styles.cardValue}>
                  {info.value}
                </a>
              ) : (
                <Text variant="small" color="secondary">
                  {info.value}
                </Text>
              )}
            </FeatureCard>
          ))}
        </Grid>

        {/* Main Content Grid */}
        <div className={styles.mainContent}>
          {/* Contact Form */}
          <div className={styles.formSection}>
            <div className={styles.formHeader}>
              <MessageCircle size={24} />
              <Text variant="h2">أرسل لنا رسالة</Text>
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
                  <option value="general">استفسار عام</option>
                  <option value="support">دعم فني</option>
                  <option value="ads">الإعلانات</option>
                  <option value="subscriptions">الاشتراكات</option>
                  <option value="complaint">شكوى</option>
                  <option value="suggestion">اقتراح</option>
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
                loading={isSubmitting}
                icon={<Send size={18} />}
                className={styles.submitButton}
              >
                إرسال الرسالة
              </Button>
            </form>
          </div>

          {/* Business Info */}
          <div className={styles.infoSection}>
            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <Building2 size={24} />
                <Text variant="h3">معلومات الشركة</Text>
              </div>
              <div className={styles.infoContent}>
                <Text variant="paragraph" color="secondary">
                  سوق السيارات السوري هو منصتك الأولى لبيع وشراء السيارات في سوريا. نوفر لك تجربة سهلة وآمنة للتواصل مع البائعين والمشترين.
                </Text>
                <Text variant="paragraph" color="secondary">
                  نحن ملتزمون بتقديم أفضل خدمة لعملائنا ومساعدتهم في العثور على السيارة المثالية أو بيع سيارتهم بأفضل سعر.
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className={styles.faq}>
          <Text variant="h2">الأسئلة الشائعة</Text>

          <div className={styles.faqList}>
            <Collapsible title="كيف يمكنني نشر إعلان؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                لنشر إعلان، قم بتسجيل الدخول إلى حسابك، ثم اضغط على "أضف إعلان" واتبع الخطوات لإضافة تفاصيل سيارتك والصور.
              </Text>
            </Collapsible>

            <Collapsible title="هل الموقع مجاني؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                نعم، يمكنك التسجيل وتصفح الإعلانات مجاناً. نوفر أيضاً باقات اشتراك متميزة للبائعين المحترفين.
              </Text>
            </Collapsible>

            <Collapsible title="كيف أتواصل مع البائع؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                يمكنك التواصل مع البائع مباشرة عبر نظام المراسلة في الموقع بعد تسجيل الدخول.
              </Text>
            </Collapsible>

            <Collapsible title="كم يستغرق الرد على استفساراتي؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                نسعى للرد على جميع الاستفسارات خلال 24 ساعة في أيام العمل.
              </Text>
            </Collapsible>

            <Collapsible title="هل يمكنني تعديل إعلاني بعد النشر؟" variant="bordered">
              <Text variant="paragraph" color="secondary">
                نعم، يمكنك تعديل إعلانك في أي وقت من لوحة التحكم الخاصة بك.
              </Text>
            </Collapsible>
          </div>
        </div>
      </Container>
    </div>
  );
}
