'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Sidebar } from '@/components/sidebar'
import { Suspense } from 'react'

const CampusMap = dynamic(() => import('@/components/map/CampusMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
})

export function MapLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const hasOverlay = pathname === "/profile" || pathname === "/settings"

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 relative">
        <div className="absolute inset-0 z-0">
          <Suspense fallback={
            <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          }>
            <CampusMap />
          </Suspense>
        </div>
        {hasOverlay && (
          <div className="absolute inset-0 z-10 bg-background/95 backdrop-blur-sm overflow-y-auto">
            <div className="min-h-full p-6">
              {children}
            </div>
          </div>
        )}
        {!hasOverlay && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            {children}
          </div>
        )}
      </main>
    </div>
  )
}
