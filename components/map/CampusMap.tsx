'use client'

import { MapContainer, TileLayer } from 'react-leaflet'
import { useEffect, useState, useCallback } from 'react'
import { VSU_CAMPUS_CONFIG } from '@/types/map'
import { configureLeafletIcons } from '@/lib/leaflet/icon-config'
import { MapClickHandler } from './MapClickHandler'
import { BuildingCreationClickHandler } from './BuildingCreationClickHandler'
import { useMarkerCreation } from './MarkerCreationContext'
import { useBuildingCreation } from './BuildingCreationContext'
import { useBuilding } from './BuildingContext'
import { useBuildingModal } from './BuildingModalContext'
import { AccessibilityMarkers } from './AccessibilityMarkers'
import { BuildingsPolygons } from './BuildingsPolygons'
import { MapControlInitializer } from './MapControlInitializer'
import type { Building } from '@/types/map'

export default function CampusMap() {
  const [isMounted, setIsMounted] = useState(false)
  const { isCreating, setClickedCoordinates, openModal, markersRefreshTrigger } = useMarkerCreation()
  const { isCreating: isCreatingBuilding, setClickedCoordinates: setBuildingCoordinates, openModal: openBuildingCreationModal, buildingsRefreshTrigger } = useBuildingCreation()
  const { selectBuilding, selectedBuilding } = useBuilding()
  const { openModal: openBuildingModal, isOpen: isBuildingModalOpen } = useBuildingModal()

  const handleMapClick = useCallback((coordinates: [number, number]) => {
    if (isCreating) {
      setClickedCoordinates(coordinates)
      openModal()
    } else if (!isCreatingBuilding && selectedBuilding && !isBuildingModalOpen) {
      selectBuilding(null)
    }
  }, [isCreating, isCreatingBuilding, setClickedCoordinates, openModal, selectedBuilding, isBuildingModalOpen, selectBuilding])

  const handleBuildingMapClick = useCallback((coordinates: [number, number]) => {
    if (isCreatingBuilding) {
      setBuildingCoordinates(coordinates)
    }
  }, [isCreatingBuilding, setBuildingCoordinates])

  const handleBuildingClick = useCallback((building: Building, event?: { latlng?: { lat: number, lng: number }, screenPoint?: { x: number, y: number } }) => {
    selectBuilding(building)
    const origin = event?.screenPoint ? {
      x: event.screenPoint.x,
      y: event.screenPoint.y,
    } : undefined
    openBuildingModal(building, origin)
  }, [selectBuilding, openBuildingModal])

  useEffect(() => {
    if (typeof window === 'undefined') return
    configureLeafletIcons()
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <MapContainer
      center={VSU_CAMPUS_CONFIG.center}
      zoom={VSU_CAMPUS_CONFIG.zoom}
      minZoom={VSU_CAMPUS_CONFIG.minZoom}
      maxZoom={VSU_CAMPUS_CONFIG.maxZoom}
      bounds={VSU_CAMPUS_CONFIG.bounds}
      maxBounds={VSU_CAMPUS_CONFIG.maxBounds}
      maxBoundsViscosity={VSU_CAMPUS_CONFIG.maxBoundsViscosity}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | VSU Campus Accessibility Map'
      />
      <MapClickHandler enabled={isCreating || (!isCreatingBuilding && !!selectedBuilding)} onMapClick={handleMapClick} />
      <BuildingCreationClickHandler enabled={isCreatingBuilding} onMapClick={handleBuildingMapClick} />
      <AccessibilityMarkers refreshTrigger={markersRefreshTrigger} />
      <BuildingsPolygons refreshTrigger={buildingsRefreshTrigger} onBuildingClick={handleBuildingClick} />
      <MapControlInitializer />
    </MapContainer>
  )
}

