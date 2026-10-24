import type { AnalyticsEventName, AnalyticsProps } from "@/lib/analytics-events";

/** Collection is off. The season is archived, so this does not send events. */
export function trackEvent(
  name: AnalyticsEventName,
  properties?: AnalyticsProps,
): void {
  void name;
  void properties;
}
