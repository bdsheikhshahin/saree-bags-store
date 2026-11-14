import type { Metadata } from 'next';
import Gtm from '@/components/Gtm';
import ConsentBanner from '@/components/ConsentBanner';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Saree & Bags — Shop Saree and Bags Online in Bangladesh', template: '%s | Saree & Bags' },
  description: 'Shop saree and bags online in Bangladesh. Jamdani, silk and cotton sarees, leather and jute bags. Cash on delivery, bKash, Nagad and SSLCommerz.',
  openGraph: { type: 'website', siteName: 'Saree & Bags' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Gtm />
        {children}
        <ConsentBanner />
      </body>
    </html>
  );
}
