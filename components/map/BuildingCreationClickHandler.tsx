'use client'

import { useMapEvents } from 'react-leaflet'
import type { LatLng } from '@/types/map'

interface BuildingCreationClickHandlerProps {
  enabled: boolean
  onMapClick: (coordinates: LatLng) => void
}

export function BuildingCreationClickHandler({ enabled, onMapClick }: BuildingCreationClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      if (enabled) {
        const { lat, lng } = e.latlng
        onMapClick([lat, lng])
      }
    },
  })

  return null
}

