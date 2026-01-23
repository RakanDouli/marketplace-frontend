import type { Metadata } from "next";
import { Container, Text, TextSection, Grid, FeatureCard, FAQ, ContactForm } from "@/components/slices";
import { Phone, Mail, MapPin, Clock, Building2 } from "lucide-react";
import styles from "./Contact.module.scss";

// SEO Metadata (Server-side)
export const metadata: Metadata = {
  title: "اتصل بنا | شام باي",
  description: "تواصل معنا للاستفسارات والدعم الفني. نحن هنا لمساعدتك في البيع والشراء على شام باي.",
  keywords: ["اتصل بنا", "تواصل", "دعم", "شام باي", "سوريا"],
  openGraph: {
    title: "اتصل بنا | شام باي",
    description: "تواصل معنا للاستفسارات والدعم الفني",
    type: "website",
    locale: "ar_SY",
  },
};

// Static contact info
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
    value: "info@shambay.com",
    href: "mailto:info@shambay.com",
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

// Static FAQ items
const faqItems = [
  { question: "كيف يمكنني نشر إعلان؟", answer: "لنشر إعلان، قم بتسجيل الدخول إلى حسابك، ثم اضغط على \"أضف إعلان\" واتبع الخطوات لإضافة تفاصيل إعلانك والصور." },
  { question: "هل الموقع مجاني؟", answer: "نعم، يمكنك التسجيل وتصفح الإعلانات مجاناً. نوفر أيضاً باقات اشتراك متميزة للبائعين المحترفين." },
  { question: "كيف أتواصل مع البائع؟", answer: "يمكنك التواصل مع البائع مباشرة عبر نظام المراسلة في الموقع بعد تسجيل الدخول." },
  { question: "كم يستغرق الرد على استفساراتي؟", answer: "نسعى للرد على جميع الاستفسارات خلال 24 ساعة في أيام العمل." },
  { question: "هل يمكنني تعديل إعلاني بعد النشر؟", answer: "نعم، يمكنك تعديل إعلانك في أي وقت من لوحة التحكم الخاصة بك." },
];

// Server Component - renders static content, ContactForm is Client Component
export default function ContactPage() {
  return (
    <div className={styles.ContactPage}>
      <TextSection
        title="اتصل بنا - نحن هنا لمساعدتك"
        subtitle="لديك سؤال أو استفسار؟ تواصل معنا وسنرد عليك في أقرب وقت"
        align="center"
        nostyle
      />

      {/* Contact Cards */}
      <Grid title="تواصل معنا" columns={4} mobileColumns={1} paddingY="lg" className={styles.contactCards}>
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
      <Container paddingY="lg">
        <div className={styles.mainContent}>
          {/* Contact Form - Client Component */}
          <ContactForm />

          {/* Business Info */}
          <div className={styles.infoSection}>
            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <Building2 size={24} />
                <Text variant="h3">معلومات الشركة</Text>
              </div>
              <div className={styles.infoContent}>
                <Text variant="paragraph" color="secondary">
                  شام باي هو منصتك الأولى للبيع والشراء في سوريا. نوفر لك تجربة سهلة وآمنة للتواصل مع البائعين والمشترين.
                </Text>
                <Text variant="paragraph" color="secondary">
                  نحن ملتزمون بتقديم أفضل خدمة لعملائنا ومساعدتهم في العثور على ما يبحثون عنه أو بيع منتجاتهم بأفضل سعر.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* FAQ Section */}
      <FAQ title="الأسئلة الشائعة" items={faqItems} />
    </div>
  );
}
