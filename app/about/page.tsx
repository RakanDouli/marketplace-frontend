import React from "react";
import { Container, Text, TextSection } from "@/components/slices";
import styles from "./About.module.scss";

export default function AboutPage() {
  return (
    <div className={styles.aboutPage}>
      <TextSection
        title="من نحن"
        subtitle="قصتنا ورؤيتنا"
        align="center"
        nostyle
      />

      <Container paddingY="lg">
        <div className={styles.content}>
          {/* Our Story */}
          <section className={styles.section}>
            <Text variant="h3">قصتنا</Text>
            <Text variant="paragraph" color="secondary">
              نحن فريق سوري يمتلك خبرة دولية في أوروبا وتركيا، نجمع بين الخبرة التقنية العالمية والمعرفة العميقة بالسوق السوري. نمتلك خبرة واسعة في تطوير البرمجيات وتقنيات الذكاء الاصطناعي، إضافة إلى خبرة عملية في إدارة المنصات الرقمية ووسائل التواصل الاجتماعي والقطاع العقاري.
            </Text>
            <Text variant="paragraph" color="secondary">
              أسسنا شمباي لنقدم للسوق السوري منصة إعلانات مبوبة ذكية وموثوقة، مدعومة بأحدث تقنيات الذكاء الاصطناعي لضمان تجربة آمنة وسلسة.
            </Text>
          </section>

          {/* Our Vision */}
          <section className={styles.section}>
            <Text variant="h3">رؤيتنا</Text>
            <Text variant="paragraph" color="secondary">
              نسعى لأن نكون المنصة الأولى للإعلانات المبوبة في سوريا، حيث يمكن للجميع البيع والشراء بكل سهولة وأمان. نؤمن بأن التكنولوجيا يمكنها تسهيل حياة الناس وربطهم ببعض.
            </Text>
          </section>

          {/* What Sets Us Apart */}
          <section className={styles.section}>
            <Text variant="h3">ما يميزنا</Text>
            <ul className={styles.list}>
              <li>منصة ذكية مبنية بأحدث التقنيات والذكاء الاصطناعي</li>
              <li>نظام AI متطور لفحص المحتوى وضمان جودة الإعلانات</li>
              <li>تجربة مستخدم سلسة على جميع الأجهزة</li>
              <li>دعم فني متواصل</li>
              <li>خصوصية وأمان بياناتك</li>
            </ul>
          </section>

          {/* Contact */}
          <section className={styles.section}>
            <Text variant="h3">تواصل معنا</Text>
            <Text variant="paragraph" color="secondary">
              نحن دائماً سعداء بسماع آرائكم واقتراحاتكم. يمكنكم التواصل معنا عبر صفحة الاتصال أو من خلال حساباتنا على وسائل التواصل الاجتماعي.
            </Text>
          </section>
        </div>
      </Container>
    </div>
  );
}
