'use client'

import { useEffect, useState } from 'react'
import { Marker, useMap } from 'react-leaflet'
import { divIcon } from 'leaflet'
import type { Building } from '@/types/map'
import { useBuilding } from './BuildingContext'

interface BuildingSelectionMarkersProps {
  refreshTrigger?: number
}

function createInvisibleMarker() {
  return divIcon({
    html: '<div style="width: 40px; height: 40px; opacity: 0; cursor: pointer; background: transparent;"></div>',
    className: 'invisible-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

export function BuildingSelectionMarkers({ refreshTrigger }: BuildingSelectionMarkersProps) {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { openWindow } = useBuilding()
  const map = useMap()

  useEffect(() => {
    async function fetchBuildings() {
      setIsLoading(true)

      try {
        const response = await fetch('/api/buildings?limit=100')
        
        if (!response.ok) {
          throw new Error('Failed to fetch buildings')
        }

        const result = await response.json()
        const buildingsData = (result.data || []).map((building: any) => ({
          ...building,
          coordinates: [building.latitude, building.longitude] as [number, number],
        }))

        setBuildings(buildingsData)
      } catch (err) {
        console.error('Error fetching buildings:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBuildings()
  }, [refreshTrigger])

  if (isLoading) {
    return null
  }

  const handleMarkerClick = (building: Building) => {
    openWindow(building)
  }

  const invisibleIcon = createInvisibleMarker()

  return (
    <>
      {buildings.map((building) => (
        <Marker
          key={building.id}
          position={building.coordinates}
          icon={invisibleIcon}
          eventHandlers={{
            click: () => handleMarkerClick(building),
          }}
        />
      ))}
    </>
  )
}

