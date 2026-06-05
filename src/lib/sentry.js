import * as Sentry from "@sentry/react";

const DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!DSN) return; // silently skip in dev when DSN is not set

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE, // "development" | "production"
    // Send 100% of errors in production; tune down if volume is high
    sampleRate: 1.0,
    // Basic session-replay and performance tracing are opt-in — omitted for now
  });

  // Catch unhandled promise rejections that escape try/catch blocks
  window.addEventListener("unhandledrejection", (event) => {
    Sentry.captureException(event.reason ?? new Error("Unhandled promise rejection"));
  });
}

/**
 * Report a handled error: logs to the console and forwards to Sentry with a
 * context tag. Use this inside catch blocks instead of swallowing errors
 * silently (`catch { // non-fatal }`) so production failures are visible.
 *
 * @param {string} context - where it happened, e.g. "MagnetReview.submit"
 * @param {unknown} err    - the caught error
 * @param {object} [extra] - optional extra data to attach
 */
export function reportError(context, err, extra = {}) {
  console.error(`[${context}]`, err);
  try {
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: { context },
      extra,
    });
  } catch { /* Sentry not initialised (dev) — console.error already ran */ }
}
