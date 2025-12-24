"use client";

import React from "react";
import Link from "next/link";
import { Container, Text } from "@/components/slices";
import { Phone, Mail, MapPin } from "lucide-react";
import styles from "./Footer.module.scss";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: "/", label: "الرئيسية" },
    { href: "/user-subscriptions", label: "باقات الاشتراك" },
    { href: "/advertise", label: "أعلن معنا" },
    { href: "/contact", label: "اتصل بنا" },
  ];

  const legalLinks = [
    { href: "/terms", label: "الشروط والأحكام" },
    { href: "/privacy", label: "سياسة الخصوصية" },
  ];

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.content}>
          {/* Brand Section */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoIcon}>🚗</span>
              <span className={styles.logoText}>Syrian Marketplace</span>
            </Link>
            <Text variant="small" color="secondary">
              سوق السيارات السوري - منصتك الأولى لبيع وشراء السيارات
            </Text>
          </div>

          {/* Quick Links */}
          <div className={styles.linksSection}>
            <Text variant="h4" className={styles.sectionTitle}>روابط سريعة</Text>
            <nav className={styles.links}>
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className={styles.link}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div className={styles.contactSection}>
            <Text variant="h4" className={styles.sectionTitle}>تواصل معنا</Text>
            <div className={styles.contactInfo}>
              <a href="tel:+963123456789" className={styles.contactItem}>
                <Phone size={16} />
                <span>+963 123 456 789</span>
              </a>
              <a href="mailto:info@syrianmarketplace.com" className={styles.contactItem}>
                <Mail size={16} />
                <span>info@syrianmarketplace.com</span>
              </a>
              <div className={styles.contactItem}>
                <MapPin size={16} />
                <span>دمشق، سوريا</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottom}>
          <Text variant="small" color="secondary">
            © {currentYear} Syrian Marketplace. جميع الحقوق محفوظة.
          </Text>
          <nav className={styles.legalLinks}>
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.legalLink}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
