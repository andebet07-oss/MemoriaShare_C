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
