'use client'

import { MapContainer, TileLayer } from 'react-leaflet'
import { useEffect, useState } from 'react'
import { VSU_CAMPUS_CONFIG } from '@/types/map'
import { configureLeafletIcons } from '@/lib/leaflet/icon-config'
import { MapClickHandler } from './MapClickHandler'
import { useMarkerCreation } from './MarkerCreationContext'
import { AccessibilityMarkers } from './AccessibilityMarkers'

export default function CampusMap() {
  const [isMounted, setIsMounted] = useState(false)
  const { isCreating, setClickedCoordinates, openModal, markersRefreshTrigger } = useMarkerCreation()

  useEffect(() => {
    if (typeof window === 'undefined') return
    configureLeafletIcons()
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  const handleMapClick = (coordinates: [number, number]) => {
    if (isCreating) {
      setClickedCoordinates(coordinates)
      openModal()
    }
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
      <MapClickHandler enabled={isCreating} onMapClick={handleMapClick} />
      <AccessibilityMarkers refreshTrigger={markersRefreshTrigger} />
    </MapContainer>
  )
}

