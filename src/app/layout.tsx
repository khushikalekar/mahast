import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { DemoBanner } from "@/components/layout/demo-banner";
import { BottomNav } from "@/components/layout/bottom-nav";

export const metadata: Metadata = {
  title: "MahaST – Smart Maharashtra Bus",
  description: "Real-time bus tracking and journey planning for Maharashtra. Find buses, track routes, and plan your journey with MahaST.",
  keywords: ["MSRTC", "Maharashtra bus", "ST bus", "bus tracker", "Pune bus", "Nashik bus", "Ahmednagar bus"],
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f97316",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)", color: "var(--color-text)" }}>
            <DemoBanner />
            <Navbar />
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
            <BottomNav />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
