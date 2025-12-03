'use client'

import { useEffect, useState } from 'react'
import { Polygon, Popup } from 'react-leaflet'
import type { Building } from '@/types/map'
import { useBuilding } from './BuildingContext'
import { useBuildingCreation } from './BuildingCreationContext'
import { useMarkerCreation } from './MarkerCreationContext'
import { DraggableBuildingPolygonEditor } from './DraggableBuildingPolygonEditor'
import { safeFetch } from '@/lib/fetch-utils'
import type { Building } from '@/types/database'

interface BuildingsPolygonsProps {
  refreshTrigger?: number
  onBuildingClick?: (building: Building) => void
}

const DEFAULT_POLYGON_STYLE = {
  fillColor: '#000000',
  fillOpacity: 0.01,
  color: '#000000',
  weight: 0,
  opacity: 0,
} as const

const SELECTED_POLYGON_STYLE = {
  fillColor: '#f59e0b',
  fillOpacity: 0.4,
  color: '#92400e',
  weight: 3,
  opacity: 0.8,
} as const

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
    const abortController = new AbortController()

    async function fetchBuildings() {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await safeFetch<Building[]>(
        '/api/buildings?limit=100',
        abortController.signal
      )

      if (fetchError) {
        if (fetchError.name !== 'AbortError') {
          console.error('Error fetching buildings:', fetchError)
          setError(fetchError.message)
        }
        setIsLoading(false)
        return
      }

      if (data) {
        const buildingsData: Building[] = data.map((building) => ({
          ...building,
          coordinates: [building.latitude, building.longitude] as [number, number],
        }))
        setBuildings(buildingsData)
      }

      setIsLoading(false)
    }

    fetchBuildings()

    return () => {
      abortController.abort()
    }
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

    const pathOptions = isSelected ? SELECTED_POLYGON_STYLE : DEFAULT_POLYGON_STYLE

    polygons.push(
      <Polygon
        key={building.id}
        positions={polygonCoords}
        pathOptions={pathOptions}
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
