import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProfileSetupModal } from "@/components/ProfileSetupModal";
import "./globals.css";
import 'leaflet/dist/leaflet.css';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Campus Accessibility Map",
  description: "Interactive map showing accessibility features and buildings",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <DashboardShell>{children}</DashboardShell>
        <Suspense fallback={null}>
          <ProfileSetupModal />
        </Suspense>
      </body>
    </html>
  );
}
