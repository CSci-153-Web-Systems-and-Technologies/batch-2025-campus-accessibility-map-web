'use client'

import { useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { AddMarkerButton } from './AddMarkerButton'
import { AddBuildingButton } from './AddBuildingButton'
import { EditRoutesButton } from './EditRoutesButton'
import { SetLocationButton } from './SetLocationButton'
import { MarkerCreationProvider, useMarkerCreation } from './MarkerCreationContext'
import { BuildingCreationProvider, useBuildingCreation } from './BuildingCreationContext'
import { RouteDrawingProvider } from './RouteDrawingContext'
import { RouteDrawingOverlay } from './RouteDrawingOverlay'
import { NodeTaggingModal } from './NodeTaggingModal'
import { CreationModeOverlay } from './CreationModeOverlay'
import { BuildingCreationOverlay } from './BuildingCreationOverlay'
import { MarkerCreationModal } from './MarkerCreationModal'
import { BuildingCreationModal } from './BuildingCreationModal'
import { CampusMapWrapper } from './CampusMapWrapper'
import { FiltersDrawer } from './FiltersDrawer'
import { MapFiltersProvider } from './MapFiltersContext'
import { FeatureModalProvider } from './FeatureModalContext'
import { FeatureModal } from './FeatureModal'
import { BuildingModalProvider } from './BuildingModalContext'
import { BuildingModal } from './BuildingModal'

function MapLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const hasOverlay = pathname === "/profile" || pathname === "/settings"
  const { isCreating, isModalOpen, clickedCoordinates, closeModal } = useMarkerCreation()
  const { isCreating: isCreatingBuilding, isModalOpen: isBuildingModalOpen, clickedCoordinates: buildingCoordinates, closeModal: closeBuildingModal, openModal: openBuildingModal } = useBuildingCreation()
  
  const [isSettingLocation, setIsSettingLocation] = useState(false)
  const [targetNodeId, setTargetNodeId] = useState<string | null>(null)

  const handleSetLocation = () => {
    setIsSettingLocation(!isSettingLocation)
  }

  const handleLocationSet = () => {
    setIsSettingLocation(false)
  }

  const handleRouteHere = (nodeId: string) => {
    setTargetNodeId(nodeId)
  }

  const handleRouteCalculated = () => {
    setTargetNodeId(null)
  }

  return (
    <div className="flex h-screen bg-m3-surface">
      <Sidebar />
      <main className="flex-1 relative sm:ml-16">
        <div className="absolute inset-0 z-0">
          <CampusMapWrapper 
            isSettingLocation={isSettingLocation}
            onLocationSet={handleLocationSet}
            targetNodeId={targetNodeId}
            onRouteCalculated={handleRouteCalculated}
          />
          {!hasOverlay && (
            <>
              <FiltersDrawer />
              <AddMarkerButton />
              <AddBuildingButton />
              <EditRoutesButton />
              <SetLocationButton onClick={handleSetLocation} isActive={isSettingLocation} />
              <RouteDrawingOverlay />
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
          <FeatureModal />
          <BuildingModal />
          <NodeTaggingModal onRouteHere={handleRouteHere} />
        </div>
        {hasOverlay && (
          <div className="absolute inset-0 z-10 bg-m3-surface/95 backdrop-blur-sm overflow-y-auto">
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
        <RouteDrawingProvider>
          <FeatureModalProvider>
            <BuildingModalProvider>
              <MapFiltersProvider>
                <MapLayoutContent>{children}</MapLayoutContent>
              </MapFiltersProvider>
            </BuildingModalProvider>
          </FeatureModalProvider>
        </RouteDrawingProvider>
      </BuildingCreationProvider>
    </MarkerCreationProvider>
  )
}
