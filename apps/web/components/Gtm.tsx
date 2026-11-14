import Script from 'next/script';
import { GTM_ID, consentDefault, isGtmConfigured } from '@/lib/analytics';

// GTM only — no direct gtag. Loads after interaction; consent defaults to
// "denied" until the user accepts cookies (see ConsentBanner).
export default function Gtm() {
  if (!isGtmConfigured()) return null;
  return (
    <>
      <Script id="gtm-consent" strategy="beforeInteractive">
        {`window.dataLayer = window.dataLayer || []; window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'}); window.dataLayer.push({event: 'consent_default', analytics_storage: '${consentDefault}'});`}
      </Script>
      <Script id="gtm" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`} />
      <noscript>
        <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
      </noscript>
    </>
  );
}
