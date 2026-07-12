import Script from "next/script";

/**
 * Analytics: loads GoatCounter only when NEXT_PUBLIC_GOATCOUNTER_CODE is set.
 * Its count.js reads the data-goatcounter attribute for the endpoint. When the
 * env var is absent (e.g. local dev) nothing is loaded and track() is a no-op.
 */
export function Analytics() {
  const code = process.env.NEXT_PUBLIC_GOATCOUNTER_CODE;
  if (!code) return null;
  return (
    <Script
      data-goatcounter={`https://${code}.goatcounter.com/count`}
      src="https://gc.zgo.at/count.js"
      strategy="afterInteractive"
    />
  );
}
