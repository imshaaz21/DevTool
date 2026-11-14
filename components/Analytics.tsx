'use client';

import Script from 'next/script';
import { useConsent } from './useConsent';

const CLARITY_PROJECT_ID = 'yrarppy1x1';

/**
 * Loads product analytics only after an explicit yes.
 *
 * Rendering nothing until then is the point: no script, no cookies, no network
 * call. The server snapshot is `unset`, so a server render never loads it either.
 */
export function Analytics() {
  const consent = useConsent();

  if (consent !== 'granted') return null;

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
      `}
    </Script>
  );
}
