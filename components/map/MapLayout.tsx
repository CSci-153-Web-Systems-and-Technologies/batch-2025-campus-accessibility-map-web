'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { AddMarkerButton } from './AddMarkerButton'
import { MarkerCreationProvider, useMarkerCreation } from './MarkerCreationContext'
import { CreationModeOverlay } from './CreationModeOverlay'
import { MarkerCreationModal } from './MarkerCreationModal'
import { CampusMapWrapper } from './CampusMapWrapper'

function MapLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const hasOverlay = pathname === "/profile" || pathname === "/settings"
  const { isCreating, isModalOpen, clickedCoordinates, closeModal } = useMarkerCreation()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 relative">
        <div className="absolute inset-0 z-0">
          <CampusMapWrapper />
          {!hasOverlay && <AddMarkerButton />}
          {isCreating && <CreationModeOverlay onCancel={closeModal} />}
          {isModalOpen && clickedCoordinates && (
            <MarkerCreationModal
              isOpen={isModalOpen}
              onClose={closeModal}
              initialLat={clickedCoordinates[0]}
              initialLng={clickedCoordinates[1]}
            />
          )}
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

export function MapLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MarkerCreationProvider>
      <MapLayoutContent>{children}</MapLayoutContent>
    </MarkerCreationProvider>
  )
}
