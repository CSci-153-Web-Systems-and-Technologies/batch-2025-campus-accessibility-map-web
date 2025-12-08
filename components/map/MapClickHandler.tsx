'use client'

import { useEffect } from 'react'
import { useMapEvents } from 'react-leaflet'
import type { LatLng } from '@/types/map'

interface MapClickHandlerProps {
  enabled: boolean
  onMapClick: (coordinates: LatLng) => void
}

export function MapClickHandler({ enabled, onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      if (enabled) {
        onMapClick([e.latlng.lat, e.latlng.lng])
      }
    },
  })

  return null
}

