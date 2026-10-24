import type { Metadata } from "next";
import { AnalyticsBootstrap } from "@/components/AnalyticsBootstrap";
import { siteBaseUrl } from "@/lib/day-routes";
import { PREVIEW_BACKGROUND_URL } from "@/lib/site-branding";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteBaseUrl()),
  title: "studio daze · beatober",
  description: "Daily beats and Strudel patterns — October 2026",
  icons: {
    icon: [{ url: PREVIEW_BACKGROUND_URL, type: "image/png" }],
    apple: [{ url: PREVIEW_BACKGROUND_URL, type: "image/png" }],
    shortcut: [PREVIEW_BACKGROUND_URL],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="beatober-body">
        <AnalyticsBootstrap />
        {children}
      </body>
    </html>
  );
}
