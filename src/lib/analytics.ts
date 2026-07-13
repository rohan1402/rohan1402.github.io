/**
 * analytics.ts: thin wrapper over GoatCounter's count() global.
 *
 * GoatCounter is loaded only when NEXT_PUBLIC_GOATCOUNTER_CODE is set (see
 * components/Analytics.tsx). When it is absent, window.goatcounter is undefined
 * and every track() call is a safe no-op, so local dev never needs analytics.
 */

export type AnalyticsEvent =
  | "question-asked"
  | "chip-click"
  | "resume-download"
  | "outbound-click"
  | "fallback-served";

interface GoatCounter {
  count?: (opts: { path: string; title?: string; event?: boolean }) => void;
}

declare global {
  interface Window {
    goatcounter?: GoatCounter;
  }
}

/**
 * Fire a custom GoatCounter event. `detail` narrows the recorded path, e.g.
 * track("outbound-click", "github") records the event path "outbound-click:github".
 */
export function track(event: AnalyticsEvent, detail?: string): void {
  if (typeof window === "undefined") return;
  const gc = window.goatcounter;
  if (!gc || typeof gc.count !== "function") return;
  gc.count({
    path: detail ? `${event}:${detail}` : event,
    title: event,
    event: true,
  });
}
