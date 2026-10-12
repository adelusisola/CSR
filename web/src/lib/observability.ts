// Sentry (errors) + PostHog (analytics) bootstrap. Keys come from env; the
// client bundle never contains service secrets (Section 4.4).
import * as Sentry from "@sentry/react";
import posthog from "posthog-js";

export function initObservability(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (dsn) {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
    });
  }

  const phKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  const phHost = import.meta.env.VITE_POSTHOG_HOST as string | undefined;
  if (phKey) {
    posthog.init(phKey, { api_host: phHost ?? "https://us.i.posthog.com" });
  }
}
