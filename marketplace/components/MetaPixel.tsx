"use client";

import Script from "next/script";

// Base code Meta Pixel per toko + event opsional (ViewContent/Purchase).
// event_id disamakan dengan CAPI server agar Meta men-deduplikasi.
export default function MetaPixel({
  pixelId,
  event,
  value,
  eventId,
}: {
  pixelId: string;
  event?: "ViewContent" | "Purchase";
  value?: number;
  eventId?: string;
}) {
  const eventLine = event
    ? `fbq('track', '${event}', ${JSON.stringify({ currency: "IDR", value: value ?? 0 })}${eventId ? `, {eventID: '${eventId}'}` : ""});`
    : "";

  return (
    <Script id={`fb-pixel-${pixelId}`} strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
        ${eventLine}
      `}
    </Script>
  );
}
