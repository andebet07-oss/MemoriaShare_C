import * as Sentry from "@sentry/react";

/**
 * Central error logger.
 * - Always writes to console.error (visible in dev tools and server logs)
 * - Reports to Sentry in production when DSN is configured
 *
 * Usage:
 *   import { logError } from "@/lib/logger";
 *   logError("[photos.upload]", err);
 *   logError("[auth.refresh]", err, { userId: user.id });
 */
export function logError(context, error, extras = {}) {
  console.error(`${context}:`, error, extras);

  Sentry.withScope((scope) => {
    scope.setTag("context", context);
    if (Object.keys(extras).length > 0) {
      scope.setExtras(extras);
    }
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
  });
}
