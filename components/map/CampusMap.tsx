'use client'

import { MapContainer, TileLayer } from 'react-leaflet'
import { useEffect, useState } from 'react'
import { VSU_CAMPUS_CONFIG } from '@/types/map'
import { configureLeafletIcons } from '@/lib/leaflet/icon-config'

export default function CampusMap() {
  const [isMounted, setIsMounted] = useState(false)

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
    </MapContainer>
  )
}

