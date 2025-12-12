'use client'

import { useState, useCallback } from 'react'
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
import { RoutingProvider } from './RoutingTargetContext'
import { ActiveRouteInfo } from './ActiveRouteInfo'
import type L from 'leaflet'

interface MapLayoutContentProps {
  children: React.ReactNode;
  isSettingLocation: boolean;
  targetNodeId: string | null;
  targetLocation: { lat: number; lng: number } | null;
  activeRouteInfo: { distance: number; hasStairs: boolean } | null;
  onSetLocation: () => void;
  onLocationSet: () => void;
  onRouteHere: (nodeId: string) => void;
  onRouteCalculated: (distance?: number, hasStairs?: boolean) => void;
  onClearRoute: () => void;
}

/** Renders map with overlays and routing state */
function MapLayoutContent({
  children,
  isSettingLocation,
  targetNodeId,
  targetLocation,
  activeRouteInfo,
  onSetLocation,
  onLocationSet,
  onRouteHere,
  onRouteCalculated,
  onClearRoute,
}: MapLayoutContentProps) {
  const pathname = usePathname()
  const hasOverlay = pathname === "/profile" || pathname === "/settings"
  const { isCreating, isModalOpen, clickedCoordinates, closeModal } = useMarkerCreation()
  const { isCreating: isCreatingBuilding, isModalOpen: isBuildingModalOpen, clickedCoordinates: buildingCoordinates, closeModal: closeBuildingModal, openModal: openBuildingModal } = useBuildingCreation()
  
  return (
    <div className="flex h-screen bg-m3-surface">
      <Sidebar />
      <main className="flex-1 relative sm:ml-16">
        <div className="absolute inset-0 z-0">
          <CampusMapWrapper 
            isSettingLocation={isSettingLocation}
            onLocationSet={onLocationSet}
            targetNodeId={targetNodeId}
            targetLocation={targetLocation}
            onRouteCalculated={onRouteCalculated}
          />
          {activeRouteInfo && (
            <ActiveRouteInfo
              distance={activeRouteInfo.distance}
              hasStairs={activeRouteInfo.hasStairs}
              onClose={onClearRoute}
            />
          )}
          {!hasOverlay && (
            <>
              <FiltersDrawer />
              <div className="absolute bottom-4 right-4 z-[1000] flex flex-row-reverse gap-4">
                <AddMarkerButton />
                <AddBuildingButton />
                <EditRoutesButton />
                <SetLocationButton onClick={onSetLocation} isActive={isSettingLocation} />
              </div>
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
          <NodeTaggingModal onRouteHere={onRouteHere} />
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

interface MapLayoutProps {
  children: React.ReactNode;
}

/** Root map layout managing routing and location state */
export function MapLayout({ children }: MapLayoutProps) {
  const [isSettingLocation, setIsSettingLocation] = useState(false)
  const [targetNodeId, setTargetNodeId] = useState<string | null>(null)
  const [targetLocation, setTargetLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [activeRouteInfo, setActiveRouteInfo] = useState<{ distance: number; hasStairs: boolean } | null>(null)

  const handleRouteRequest = useCallback((location: L.LatLng): void => {
    setTargetLocation({ lat: location.lat, lng: location.lng })
    setIsSettingLocation(true)
  }, [])

  const handleRouteCalculated = useCallback((distance?: number, hasStairs?: boolean): void => {
    if (distance !== undefined && hasStairs !== undefined) {
      setActiveRouteInfo({ distance, hasStairs })
    }
  }, [])

  const handleClearRoute = useCallback((): void => {
    setTargetNodeId(null)
    setTargetLocation(null)
    setActiveRouteInfo(null)
  }, [])

  const handleLocationSet = useCallback((): void => {
    setIsSettingLocation(false)
  }, [])

  const handleSetLocation = useCallback((): void => {
    setIsSettingLocation(prev => !prev)
  }, [])

  const handleRouteHere = useCallback((nodeId: string): void => {
    setTargetNodeId(nodeId)
  }, [])

  return (
    <MarkerCreationProvider>
      <BuildingCreationProvider>
        <RouteDrawingProvider>
          <RoutingProvider onRouteRequest={handleRouteRequest}>
            <FeatureModalProvider>
              <BuildingModalProvider>
                <MapFiltersProvider>
                  <MapLayoutContent
                    isSettingLocation={isSettingLocation}
                    targetNodeId={targetNodeId}
                    targetLocation={targetLocation}
                    activeRouteInfo={activeRouteInfo}
                    onSetLocation={handleSetLocation}
                    onLocationSet={handleLocationSet}
                    onRouteHere={handleRouteHere}
                    onRouteCalculated={handleRouteCalculated}
                    onClearRoute={handleClearRoute}
                  >
                    {children}
                  </MapLayoutContent>
                </MapFiltersProvider>
              </BuildingModalProvider>
            </FeatureModalProvider>
          </RoutingProvider>
        </RouteDrawingProvider>
      </BuildingCreationProvider>
    </MarkerCreationProvider>
  )
}
