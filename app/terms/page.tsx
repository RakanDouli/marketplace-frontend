import React from "react";
import { Container, Text } from "@/components/slices";
import styles from "./Terms.module.scss";

export default function TermsPage() {
  return (
    <div className={styles.termsPage}>
      <Container paddingY="xl">
        <div className={styles.header}>
          <Text variant="h1">الشروط والأحكام</Text>
          <Text variant="small" color="secondary">
            آخر تحديث: ديسمبر 2024
          </Text>
        </div>

        <div className={styles.content}>
          {/* Introduction */}
          <section className={styles.section}>
            <Text variant="h2">1. مقدمة</Text>
            <Text variant="paragraph">
              مرحباً بك في عقاركار. باستخدامك لموقعنا وخدماتنا، فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل استخدام الموقع.
            </Text>
            <Text variant="paragraph">
              عقاركار هو منصة إلكترونية تتيح للمستخدمين نشر إعلانات لبيع وشراء السيارات والعقارات والمنتجات الأخرى. نحن نوفر فقط المنصة للتواصل بين البائعين والمشترين.
            </Text>
          </section>

          {/* Platform Role */}
          <section className={styles.section}>
            <Text variant="h2">2. دور المنصة</Text>
            <Text variant="paragraph">
              عقاركار هي منصة وسيطة فقط وليست طرفاً في أي معاملة تتم بين المستخدمين. نحن:
            </Text>
            <ul className={styles.list}>
              <li>لا نملك أو نبيع أي من المنتجات المعروضة</li>
              <li>لا نضمن جودة أو حالة أو صحة المنتجات المعلنة</li>
              <li>لا نتحقق من هوية البائعين أو المشترين</li>
              <li>لا نتدخل في المفاوضات أو الأسعار بين الأطراف</li>
              <li>لا نتحمل مسؤولية أي نزاعات تنشأ بين المستخدمين</li>
            </ul>
          </section>

          {/* User Responsibilities */}
          <section className={styles.section}>
            <Text variant="h2">3. مسؤوليات المستخدم</Text>
            <Text variant="paragraph">
              بتسجيلك في الموقع، فإنك تتعهد بما يلي:
            </Text>
            <ul className={styles.list}>
              <li>تقديم معلومات صحيحة ودقيقة عند التسجيل</li>
              <li>الحفاظ على سرية بيانات حسابك وكلمة المرور</li>
              <li>نشر إعلانات صادقة ودقيقة تصف المنتج بشكل حقيقي</li>
              <li>عدم نشر محتوى مخالف للقانون أو الآداب العامة</li>
              <li>عدم استخدام الموقع لأغراض احتيالية أو غير قانونية</li>
              <li>التعامل باحترام مع المستخدمين الآخرين</li>
              <li>الإبلاغ عن أي محتوى مخالف أو سلوك مشبوه</li>
            </ul>
          </section>

          {/* Prohibited Content */}
          <section className={styles.section}>
            <Text variant="h2">4. المحتوى المحظور</Text>
            <Text variant="paragraph">
              يُمنع نشر الإعلانات التالية على المنصة:
            </Text>
            <ul className={styles.list}>
              <li>المنتجات المسروقة أو غير القانونية</li>
              <li>الأسلحة والذخيرة والمتفجرات</li>
              <li>المخدرات والمواد المحظورة</li>
              <li>المنتجات المقلدة أو المزيفة</li>
              <li>المحتوى الإباحي أو غير اللائق</li>
              <li>خدمات أو منتجات تنتهك حقوق الملكية الفكرية</li>
              <li>إعلانات تتضمن معلومات كاذبة أو مضللة</li>
            </ul>
          </section>

          {/* Transaction Safety */}
          <section className={styles.section}>
            <Text variant="h2">5. سلامة المعاملات</Text>
            <Text variant="paragraph">
              لحماية نفسك أثناء التعامل، ننصحك بما يلي:
            </Text>
            <ul className={styles.list}>
              <li>قم بمعاينة المنتج شخصياً قبل الشراء</li>
              <li>تجنب إرسال أموال مقدماً قبل استلام المنتج</li>
              <li>استخدم طرق دفع آمنة وموثوقة</li>
              <li>احتفظ بسجلات المحادثات والاتفاقيات</li>
              <li>قابل البائع في مكان عام وآمن</li>
              <li>لا تشارك معلوماتك البنكية أو الشخصية الحساسة</li>
            </ul>
          </section>

          {/* Account Suspension */}
          <section className={styles.section}>
            <Text variant="h2">6. تعليق وإنهاء الحسابات</Text>
            <Text variant="paragraph">
              نحتفظ بالحق في تعليق أو إنهاء حسابك في الحالات التالية:
            </Text>
            <ul className={styles.list}>
              <li>انتهاك أي من شروط الاستخدام</li>
              <li>نشر محتوى محظور أو مخالف</li>
              <li>تلقي شكاوى متعددة من مستخدمين آخرين</li>
              <li>الاشتباه في نشاط احتيالي</li>
              <li>عدم النشاط لفترة طويلة</li>
            </ul>
            <Text variant="paragraph">
              نطبق نظام التحذيرات التالي: التحذير الأول ينتج عنه تنبيه، التحذير الثاني يؤدي لإيقاف الحساب 7 أيام، والتحذير الثالث يؤدي لحظر دائم.
            </Text>
          </section>

          {/* Liability Disclaimer */}
          <section className={styles.section}>
            <Text variant="h2">7. إخلاء المسؤولية</Text>
            <Text variant="paragraph">
              عقاركار غير مسؤولة عن:
            </Text>
            <ul className={styles.list}>
              <li>أي خسائر مالية ناتجة عن التعامل مع مستخدمين آخرين</li>
              <li>جودة أو حالة أو صحة المنتجات المعروضة</li>
              <li>أي نزاعات بين البائعين والمشترين</li>
              <li>المعلومات الخاطئة في الإعلانات</li>
              <li>أي أضرار ناتجة عن استخدام الموقع</li>
              <li>أي انقطاع في الخدمة أو أخطاء تقنية</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className={styles.section}>
            <Text variant="h2">8. حقوق الملكية الفكرية</Text>
            <Text variant="paragraph">
              جميع المحتويات الموجودة على الموقع، بما في ذلك التصميم والشعارات والنصوص والصور، هي ملكية خاصة لعقاركار ومحمية بموجب قوانين حقوق الملكية الفكرية.
            </Text>
            <Text variant="paragraph">
              يُمنع نسخ أو إعادة إنتاج أو توزيع أي محتوى من الموقع دون إذن كتابي مسبق منا.
            </Text>
          </section>

          {/* Modifications */}
          <section className={styles.section}>
            <Text variant="h2">9. التعديلات على الشروط</Text>
            <Text variant="paragraph">
              نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم نشر أي تغييرات على هذه الصفحة مع تحديث تاريخ "آخر تحديث". استمرارك في استخدام الموقع بعد نشر التغييرات يعني موافقتك على الشروط المعدلة.
            </Text>
          </section>

          {/* Contact */}
          <section className={styles.section}>
            <Text variant="h2">10. الاتصال بنا</Text>
            <Text variant="paragraph">
              إذا كان لديك أي أسئلة حول هذه الشروط والأحكام، يمكنك التواصل معنا عبر صفحة الاتصال أو البريد الإلكتروني.
            </Text>
          </section>
        </div>
      </Container>
    </div>
  );
}
