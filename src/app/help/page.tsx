import { Metadata } from 'next';
import HelpPageClient from './HelpPageClient';

export const metadata: Metadata = {
  title: 'Help & Support - BootHop',
  description: 'Everything you need to know about sending and carrying items on BootHop. Get answers to common questions about our compliance-first same-day and cross-border logistics network.',
};

export default function HelpPage() {
  return <HelpPageClient />;
}
