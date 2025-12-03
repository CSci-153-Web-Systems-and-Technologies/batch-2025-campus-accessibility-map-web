'use client'

import { useEffect, useState } from 'react'
import { Polygon, Popup, useMap } from 'react-leaflet'
import type { Building } from '@/types/map'
import { useBuilding } from './BuildingContext'
import { useBuildingCreation } from './BuildingCreationContext'
import { useMarkerCreation } from './MarkerCreationContext'
import { DraggableBuildingPolygonEditor } from './DraggableBuildingPolygonEditor'

interface BuildingsPolygonsProps {
  refreshTrigger?: number
  onBuildingClick?: (building: Building) => void
}

function createBuildingPolygon(centerLat: number, centerLng: number, size: number = 0.0003): [number, number][] {
  const offset = size / 2
  
  return [
    [centerLat - offset, centerLng - offset],
    [centerLat - offset, centerLng + offset],
    [centerLat + offset, centerLng + offset],
    [centerLat + offset, centerLng - offset],
  ]
}

export function BuildingsPolygons({ refreshTrigger, onBuildingClick }: BuildingsPolygonsProps) {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const map = useMap()
  const { selectedBuilding } = useBuilding()
  const { 
    clickedCoordinates: creatingCoordinates, 
    isCreating, 
    setPolygonCoordinates 
  } = useBuildingCreation()
  const { 
    isCreating: isCreatingMarker, 
    setClickedCoordinates: setMarkerCoordinates,
    setSelectedBuildingId,
    openModal: openMarkerModal 
  } = useMarkerCreation()

  useEffect(() => {
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
        setError(err instanceof Error ? err.message : 'Failed to load buildings')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBuildings()
  }, [refreshTrigger])

  if (isLoading || error) {
    return null
  }

  const handlePolygonClick = (building: Building, clickLat: number, clickLng: number) => {
    if (isCreatingMarker) {
      setSelectedBuildingId(building.id)
      setMarkerCoordinates([clickLat, clickLng])
      openMarkerModal()
    } else if (onBuildingClick) {
      onBuildingClick(building)
    }
  }

  const polygons: JSX.Element[] = []

  buildings.forEach((building) => {
    const isSelected = selectedBuilding?.id === building.id
    const polygonCoords = building.polygon_coordinates && building.polygon_coordinates.length > 0
      ? (building.polygon_coordinates as [number, number][])
      : createBuildingPolygon(building.latitude, building.longitude)

    polygons.push(
      <Polygon
        key={building.id}
        positions={polygonCoords}
        pathOptions={{
          fillColor: isSelected ? '#f59e0b' : '#000000',
          fillOpacity: isSelected ? 0.4 : 0.01,
          color: isSelected ? '#92400e' : '#000000',
          weight: isSelected ? 3 : 0,
          opacity: isSelected ? 0.8 : 0,
        }}
        eventHandlers={{
          click: (e) => {
            e.originalEvent.stopPropagation()
            const { lat, lng } = e.latlng
            handlePolygonClick(building, lat, lng)
          },
        }}
        interactive={true}
        bubblingMouseEvents={false}
        zIndexOffset={isCreatingMarker ? 1000 : 0}
      >
        {isSelected && (
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-lg mb-1">{building.name}</h3>
              {building.description && (
                <p className="text-sm text-muted-foreground mb-2">{building.description}</p>
              )}
              {onBuildingClick && (
                <button
                  onClick={() => handlePolygonClick(building, building.latitude, building.longitude)}
                  className="text-sm text-primary hover:underline mt-2"
                >
                  View Features
                </button>
              )}
            </div>
          </Popup>
        )}
      </Polygon>
    )
  })

  if (isCreating && creatingCoordinates) {
    polygons.push(
      <DraggableBuildingPolygonEditor
        key="creating-building"
        center={creatingCoordinates}
        onPolygonChange={setPolygonCoordinates}
        onRemove={() => {}}
      />
    )
  }

  return <>{polygons}</>
}
