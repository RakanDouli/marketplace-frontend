import { Metadata } from 'next';
import { MessagesClient } from './MessagesClient';

export const metadata: Metadata = {
  title: 'الرسائل | Syrian Marketplace',
  description: 'رسائلك ومحادثاتك',
};

export default function MessagesPage() {
  return <MessagesClient />;
}
