import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { PwaRuntime } from "@/components/pwa-runtime";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Star Generation", template: "%s · Star Generation" },
  description: "Group class schedules, logbooks, hours and earnings for Star Generation students and tutors.",
  applicationName: "Star Generation",
  appleWebApp: { capable: true, title: "Star Gen", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#2F3F5F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>
          <PwaRuntime />
          {children}
        </Providers>
      </body>
    </html>
  );
}
