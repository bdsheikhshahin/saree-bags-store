'use client';

import { useState } from 'react';

// Consent Mode v2: "denied" by default (see Gtm.tsx). Accepting flips
// analytics_storage to "granted" for this browser.
export default function ConsentBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('cookie-consent') === null;
  });
  if (!visible) return null;
  const choose = (granted: boolean) => {
    window.localStorage.setItem('cookie-consent', granted ? 'granted' : 'denied');
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ event: 'consent_update', analytics_storage: granted ? 'granted' : 'denied' });
    setVisible(false);
  };
  return (
    <div style={{ position: 'fixed', bottom: 16, left: 16, right: 16, background: '#111', color: '#fff', padding: 16, borderRadius: 8, zIndex: 50 }}>
      <p>We use cookies for analytics (GA4 via Google Tag Manager). Accept to enable analytics.</p>
      <button onClick={() => choose(true)} style={{ marginRight: 8 }}>Accept</button>
      <button onClick={() => choose(false)}>Decline</button>
    </div>
  );
}
