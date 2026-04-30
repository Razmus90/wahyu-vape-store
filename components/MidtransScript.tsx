'use client';

import { useEffect, useRef } from 'react';

export default function MidtransScript() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    fetch('/api/midtrans-settings/public')
      .then((r) => r.json())
      .then((data) => {
        if (!data.success || !data.data) return;

        const isProd = data.data.is_production;
        const clientKey = data.data.client_key || '';
        if (!clientKey) return;

        const src = isProd
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js';

        const existing = document.querySelector(`script[data-client-key="${clientKey}"]`);
        if (existing) return;

        const script = document.createElement('script');
        script.src = src;
        script.setAttribute('data-client-key', clientKey);
        script.setAttribute('strategy', 'afterInteractive');
        document.head.appendChild(script);
      })
      .catch(() => {});
  }, []);

  return null;
}
