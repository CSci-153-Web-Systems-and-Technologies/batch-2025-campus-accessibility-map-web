"use client";

import { usePathname } from "next/navigation";
import { MapLayout } from "@/components/map/MapLayout";
import { Sidebar } from "@/components/sidebar";

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/login") || 
                      pathname.startsWith("/sign-up") || 
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
