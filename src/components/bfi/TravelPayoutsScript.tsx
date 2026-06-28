import Script from 'next/script';

// TravelPayouts tracking pixel — loads once per page, tracks all outbound
// clicks to partner booking sites and attributes them to marker 544322.
export default function TravelPayoutsScript() {
  return (
    <Script
      id="travelpayouts-tracker"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function () {
            var script = document.createElement("script");
            script.async = 1;
            script.src = 'https://emrldtp.com/NTQ0MzIy.js?t=544322';
            document.head.appendChild(script);
          })();
        `,
      }}
    />
  );
}
