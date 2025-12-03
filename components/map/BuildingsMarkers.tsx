'use client'

import { useEffect, useState, useMemo } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import { FaBuilding } from 'react-icons/fa'
import { createReactIconMarker } from '@/lib/leaflet/react-icon-marker'
import type { Building } from '@/types/map'

interface BuildingsMarkersProps {
  refreshTrigger?: number
  visible?: boolean
  onBuildingClick?: (building: Building) => void
}

function getBuildingIcon() {
  return createReactIconMarker(FaBuilding, {
    size: 20,
    backgroundColor: '#f59e0b',
    borderColor: '#92400e',
    color: 'white',
  })
}

export function BuildingsMarkers({ refreshTrigger, visible = true, onBuildingClick }: BuildingsMarkersProps) {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const map = useMap()

  const buildingIcon = useMemo(() => getBuildingIcon(), [])

  useEffect(() => {
    if (!visible) return

    async function fetchBuildings() {
      setIsLoading(true)
      setError(null)

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
        setError(err instanceof Error ? err.message : 'Failed to load building markers')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBuildings()
  }, [refreshTrigger, visible])

  if (!visible) {
    return null
  }

  if (isLoading) {
    return null
  }

  if (error) {
    console.error('Error loading building markers:', error)
    return null
  }

  const handleMarkerClick = (building: Building) => {
    if (onBuildingClick) {
      onBuildingClick(building)
    }
  }

  return (
    <>
      {buildings.map((building) => (
        <Marker
          key={building.id}
          position={building.coordinates}
          icon={buildingIcon}
          eventHandlers={{
            click: () => handleMarkerClick(building),
          }}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-lg mb-1">{building.name}</h3>
              {building.description && (
                <p className="text-sm text-muted-foreground mb-2">{building.description}</p>
              )}
              {onBuildingClick && (
                <button
                  onClick={() => handleMarkerClick(building)}
                  className="text-sm text-primary hover:underline mt-2"
                >
                  View Features
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

