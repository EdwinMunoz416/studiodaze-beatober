import type { AnalyticsEventName, AnalyticsProps } from "@/lib/analytics-events";

export type IngestPayload = {
  eventName: AnalyticsEventName;
  day?: number;
  props?: AnalyticsProps;
  path: string;
  referrerBucket?: string;
  referrerSource?: string;
};

/** Collection is off. The season is archived, so this does not send events. */
export function postAnalyticsPayload(payload: IngestPayload): void {
  void payload;
}
