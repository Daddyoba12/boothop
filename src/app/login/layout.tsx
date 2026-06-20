import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In to BootHop',
  description: 'Log in to your BootHop account to manage deliveries, trips, and payments.',
  alternates: {
    canonical: 'https://www.boothop.com/login',
  },
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
