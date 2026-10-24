export function parseDayParam(raw: string): number | null {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 31) return null;
  return n;
}

export function dayPath(day: number): string {
  return `/day/${day}`;
}

const CANONICAL_SITE_URL = "https://www.studio-daze.com";

export function siteBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return CANONICAL_SITE_URL;
}
