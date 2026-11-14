import SiteHeader, { SiteFooter } from '@/components/SiteHeader';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>{children}</main>
      <SiteFooter />
    </>
  );
}
