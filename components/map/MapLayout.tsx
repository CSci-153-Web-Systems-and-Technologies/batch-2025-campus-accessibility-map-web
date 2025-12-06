'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { AddMarkerButton } from './AddMarkerButton'
import { AddBuildingButton } from './AddBuildingButton'
import { MarkerCreationProvider, useMarkerCreation } from './MarkerCreationContext'
import { BuildingCreationProvider, useBuildingCreation } from './BuildingCreationContext'
import { BuildingProvider, useBuilding } from './BuildingContext'
import { CreationModeOverlay } from './CreationModeOverlay'
import { BuildingCreationOverlay } from './BuildingCreationOverlay'
import { MarkerCreationModal } from './MarkerCreationModal'
import { BuildingCreationModal } from './BuildingCreationModal'
import { BuildingFeaturesWindow } from './BuildingFeaturesWindow'
import { CampusMapWrapper } from './CampusMapWrapper'
import { BuildingSearch } from './BuildingSearch'
import { FiltersDrawer } from './FiltersDrawer'
import { MapFiltersProvider } from './MapFiltersContext'
import { MapControlProvider } from './MapControlContext'
import { FeatureModalProvider } from './FeatureModalContext'
import { FeatureModal } from './FeatureModal'

function MapLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const hasOverlay = pathname === "/profile" || pathname === "/settings"
  const { isCreating, isModalOpen, clickedCoordinates, closeModal } = useMarkerCreation()
  const { isCreating: isCreatingBuilding, isModalOpen: isBuildingModalOpen, clickedCoordinates: buildingCoordinates, closeModal: closeBuildingModal, openModal: openBuildingModal } = useBuildingCreation()
  const { isWindowOpen, selectedBuilding, closeWindow } = useBuilding()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 relative">
        <div className="absolute inset-0 z-0">
          <CampusMapWrapper />
          {!hasOverlay && (
            <>
              <BuildingSearch />
              <FiltersDrawer />
              <AddMarkerButton />
              <AddBuildingButton />
            </>
          )}
          {isCreating && <CreationModeOverlay onCancel={closeModal} />}
          {isCreatingBuilding && (
            <BuildingCreationOverlay 
              onCancel={closeBuildingModal}
              onContinue={openBuildingModal}
            />
          )}
          {isModalOpen && clickedCoordinates && (
            <MarkerCreationModal
              isOpen={isModalOpen}
              onClose={closeModal}
              initialLat={clickedCoordinates[0]}
              initialLng={clickedCoordinates[1]}
            />
          )}
          {isBuildingModalOpen && buildingCoordinates && (
            <BuildingCreationModal
              isOpen={isBuildingModalOpen}
              onClose={closeBuildingModal}
              initialLat={buildingCoordinates[0]}
              initialLng={buildingCoordinates[1]}
            />
          )}
          {isWindowOpen && selectedBuilding && (
            <BuildingFeaturesWindow
              building={selectedBuilding}
              onClose={closeWindow}
            />
          )}
          <FeatureModal />
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
      <BuildingCreationProvider>
        <BuildingProvider>
          <FeatureModalProvider>
            <MapFiltersProvider>
              <MapControlProvider>
                <MapLayoutContent>{children}</MapLayoutContent>
              </MapControlProvider>
            </MapFiltersProvider>
          </FeatureModalProvider>
        </BuildingProvider>
      </BuildingCreationProvider>
    </MarkerCreationProvider>
  )
}
