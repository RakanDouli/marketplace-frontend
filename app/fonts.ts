import { Rubik, Beiruti } from 'next/font/google';

// Rubik for body text - Arabic + Latin support
export const rubik = Rubik({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-rubik',
  preload: true,
});

// Beiruti for headers - Modern Arabic display font
export const beiruti = Beiruti({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-beiruti',
  preload: true,
});
