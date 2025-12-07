"use client";

import { usePathname } from "next/navigation";
import { MapLayout } from "@/components/map/MapLayout";
import { Sidebar } from "@/components/sidebar";
import { useTheme } from "@/lib/hooks/use-theme";

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  useTheme();
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/login") || 
                      pathname.startsWith("/forgot-password") || 
                      pathname.startsWith("/update-password") || 
                      pathname.startsWith("/confirm") || 
                      pathname.startsWith("/error") ||
                      pathname.startsWith("/sign-up-success");
  const isMapRoute = pathname === "/" || pathname === "/profile" || pathname === "/settings";

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (isMapRoute) {
    return <MapLayout>{children}</MapLayout>;
  }

  return (
    <div className="flex h-screen bg-m3-surface">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
