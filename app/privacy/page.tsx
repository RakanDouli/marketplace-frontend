import React from "react";
import { Container, Text, TextSection } from "@/components/slices";
import styles from "./Privacy.module.scss";

export default function PrivacyPage() {
  return (
    <div className={styles.privacyPage}>
      <TextSection
        title="سياسة الخصوصية"
        subtitle="آخر تحديث: ديسمبر 2024"
        align="center"
        nostyle
      />

      <Container paddingY="lg">
        <div className={styles.content}>
          {/* Introduction */}
          <section className={styles.section}>
            <Text variant="h3">1. مقدمة</Text>
            <Text variant="paragraph" color="secondary">
              نحن في شمباي نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك عند استخدام موقعنا وخدماتنا.
            </Text>
          </section>

          {/* Information We Collect */}
          <section className={styles.section}>
            <Text variant="h3">2. المعلومات التي نجمعها</Text>
            <Text variant="paragraph" color="secondary">
              نجمع الأنواع التالية من المعلومات:
            </Text>

            <Text variant="h4">معلومات التسجيل:</Text>
            <ul className={styles.list}>
              <li>الاسم الكامل</li>
              <li>البريد الإلكتروني</li>
              <li>رقم الهاتف</li>
              <li>الموقع الجغرافي (المحافظة/المدينة)</li>
            </ul>

            <Text variant="h4">معلومات الإعلانات:</Text>
            <ul className={styles.list}>
              <li>تفاصيل المنتجات المعروضة</li>
              <li>الصور المرفقة</li>
              <li>معلومات التسعير</li>
            </ul>

            <Text variant="h4">معلومات الاستخدام:</Text>
            <ul className={styles.list}>
              <li>سجل التصفح داخل الموقع</li>
              <li>الإعلانات التي تمت مشاهدتها</li>
              <li>عنوان IP وبيانات الجهاز</li>
            </ul>
          </section>

          {/* How We Use Information */}
          <section className={styles.section}>
            <Text variant="h3">3. كيف نستخدم معلوماتك</Text>
            <Text variant="paragraph" color="secondary">
              نستخدم المعلومات المجمعة للأغراض التالية:
            </Text>
            <ul className={styles.list}>
              <li>تقديم وتحسين خدماتنا</li>
              <li>التواصل معك بشأن حسابك وإعلاناتك</li>
              <li>إرسال إشعارات مهمة عن الموقع</li>
              <li>تحسين تجربة المستخدم</li>
              <li>منع الاحتيال والأنشطة المشبوهة</li>
              <li>الامتثال للمتطلبات القانونية</li>
            </ul>
          </section>

          {/* Message Privacy */}
          <section className={styles.section}>
            <Text variant="h3">4. خصوصية الرسائل</Text>
            <div className={styles.warningBox}>
              <Text variant="h4">تحذير مهم:</Text>
              <Text variant="paragraph" color="secondary">
                الرسائل المتبادلة عبر نظام المحادثات في الموقع مخزنة على خوادمنا. ننصحك بشدة بما يلي:
              </Text>
              <ul className={styles.list}>
                <li><strong>لا تشارك معلومات بطاقتك البنكية</strong> أو أرقام الحسابات المصرفية</li>
                <li><strong>لا ترسل كلمات مرور</strong> أو رموز تحقق</li>
                <li><strong>لا تشارك معلومات شخصية حساسة</strong> كالهوية أو جواز السفر</li>
                <li><strong>لا توافق على طلبات تحويل أموال</strong> قبل معاينة المنتج</li>
              </ul>
              <Text variant="paragraph" color="secondary">
                أي معلومات تشاركها في المحادثات هي مسؤوليتك الشخصية. نحن غير مسؤولين عن أي سوء استخدام لهذه المعلومات.
              </Text>
            </div>
          </section>

          {/* Data Sharing */}
          <section className={styles.section}>
            <Text variant="h3">5. مشاركة البيانات</Text>
            <Text variant="paragraph" color="secondary">
              نحن لا نبيع بياناتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك في الحالات التالية فقط:
            </Text>
            <ul className={styles.list}>
              <li>مع المستخدمين الآخرين عند التواصل بشأن إعلان (رقم الهاتف إذا اخترت إظهاره)</li>
              <li>مع مزودي الخدمات الذين يساعدوننا في تشغيل الموقع</li>
              <li>عند الطلب من جهات قانونية مختصة</li>
              <li>لحماية حقوقنا ومنع الاحتيال</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className={styles.section}>
            <Text variant="h3">6. أمان البيانات</Text>
            <Text variant="paragraph" color="secondary">
              نتخذ إجراءات أمنية لحماية بياناتك:
            </Text>
            <ul className={styles.list}>
              <li>تشفير البيانات أثناء النقل (SSL/TLS)</li>
              <li>تخزين كلمات المرور بشكل مشفر</li>
              <li>مراقبة دورية للأنشطة المشبوهة</li>
              <li>تحديثات أمنية منتظمة للنظام</li>
            </ul>
            <Text variant="paragraph" color="secondary">
              رغم جهودنا، لا يمكن ضمان أمان 100% لأي نظام على الإنترنت. أنت مسؤول عن حماية بيانات تسجيل الدخول الخاصة بك.
            </Text>
          </section>

          {/* Cookies */}
          <section className={styles.section}>
            <Text variant="h3">7. ملفات تعريف الارتباط (Cookies)</Text>
            <Text variant="paragraph" color="secondary">
              نستخدم ملفات تعريف الارتباط لـ:
            </Text>
            <ul className={styles.list}>
              <li>تذكر تسجيل دخولك</li>
              <li>حفظ تفضيلاتك (مثل اللغة والمظهر)</li>
              <li>تحليل استخدام الموقع لتحسين الخدمة</li>
              <li>عرض إعلانات مخصصة (إذا كانت مفعلة)</li>
            </ul>
            <Text variant="paragraph" color="secondary">
              يمكنك تعطيل ملفات تعريف الارتباط من إعدادات متصفحك، لكن قد يؤثر ذلك على بعض وظائف الموقع.
            </Text>
          </section>

          {/* User Rights */}
          <section className={styles.section}>
            <Text variant="h3">8. حقوقك</Text>
            <Text variant="paragraph" color="secondary">
              لديك الحقوق التالية بشأن بياناتك:
            </Text>
            <ul className={styles.list}>
              <li><strong>حق التصحيح:</strong> يمكنك تحديث معلوماتك من إعدادات الحساب</li>
              <li><strong>حق الحذف:</strong> يمكنك طلب حذف حسابك وبياناتك</li>
              <li><strong>حق الاعتراض:</strong> يمكنك إلغاء الاشتراك من الرسائل التسويقية</li>
            </ul>
            <Text variant="paragraph" color="secondary">
              لممارسة أي من هذه الحقوق، تواصل معنا عبر صفحة الاتصال.
            </Text>
          </section>

          {/* Data Retention */}
          <section className={styles.section}>
            <Text variant="h3">9. الاحتفاظ بالبيانات</Text>
            <Text variant="paragraph" color="secondary">
              نحتفظ ببياناتك طالما حسابك نشط أو حسب الحاجة لتقديم خدماتنا. عند حذف الحساب، يتم حذف البيانات الشخصية فوراً. قد نحتفظ ببعض البيانات للأغراض القانونية إذا لزم الأمر.
            </Text>
          </section>

          {/* Minors */}
          <section className={styles.section}>
            <Text variant="h3">10. القاصرين</Text>
            <Text variant="paragraph" color="secondary">
              يمكن للأشخاص من جميع الأعمار تصفح الموقع. ومع ذلك، لإتمام عمليات البيع والشراء والتوقيع على العقود، يجب أن يكون عمر المستخدم 18 عاماً على الأقل أو أن يكون تحت إشراف ولي الأمر.
            </Text>
            <Text variant="paragraph" color="secondary">
              نحن نستخدم نظام فحص آلي للمحتوى لضمان خلو الموقع من المحتوى غير اللائق أو المخالف.
            </Text>
          </section>

          {/* Changes */}
          <section className={styles.section}>
            <Text variant="h3">11. التغييرات على السياسة</Text>
            <Text variant="paragraph" color="secondary">
              قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سنُعلمك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على الموقع. ننصحك بمراجعة هذه الصفحة بشكل دوري.
            </Text>
          </section>

          {/* Contact */}
          <section className={styles.section}>
            <Text variant="h3">12. الاتصال بنا</Text>
            <Text variant="paragraph" color="secondary">
              إذا كان لديك أي أسئلة أو مخاوف بشأن سياسة الخصوصية أو كيفية معالجة بياناتك، يمكنك التواصل معنا عبر صفحة الاتصال.
            </Text>
          </section>
        </div>
      </Container>
    </div>
  );
}
