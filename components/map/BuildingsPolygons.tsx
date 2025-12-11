'use client'

import { useEffect, useState, useCallback, type ReactElement } from 'react'
import { Polygon } from 'react-leaflet'
import type { Building } from '@/types/map'
import { useBuildingModal } from './BuildingModalContext'
import { useBuildingCreation } from './BuildingCreationContext'
import { useMarkerCreation } from './MarkerCreationContext'
import { DraggableBuildingPolygonEditor } from './DraggableBuildingPolygonEditor'
import { safeFetch } from '@/lib/fetch-utils'
import type { Building as DBBuilding } from '@/types/database'
import { transformApiBuildingToMapBuilding } from '@/lib/utils/building-transform'
import { DEFAULT_FETCH_LIMIT } from '@/lib/constants'

interface BuildingsPolygonsProps {
  newBuilding?: Building | null
  onBuildingClick?: (building: Building, event?: { latlng?: { lat: number, lng: number }, screenPoint?: { x: number, y: number } }) => void
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

import { createClient } from '@/lib/supabase/client'

export function BuildingsPolygons({ newBuilding, onBuildingClick }: BuildingsPolygonsProps) {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { selectedBuilding } = useBuildingModal()
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

  const addOrUpdateBuilding = useCallback((item: Building) => {
    setBuildings(prev => {
      const idx = prev.findIndex(b => b.id === item.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = item
        return next
      }
      return [...prev, item]
    })
  }, [])

  const removeBuilding = useCallback((buildingId: string) => {
    setBuildings(prev => prev.filter(b => b.id !== buildingId))
  }, [])

  useEffect(() => {
    const abortController = new AbortController()

    async function fetchBuildings() {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await safeFetch<DBBuilding[]>(
        `/api/buildings?limit=${DEFAULT_FETCH_LIMIT}`,
        { signal: abortController.signal }
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
        const buildingsData: Building[] = data.map(transformApiBuildingToMapBuilding)
        setBuildings(buildingsData)
      }

      setIsLoading(false)
    }

    fetchBuildings()

    return () => {
      abortController.abort()
    }
  }, [])

  useEffect(() => {
    if (newBuilding) {
      addOrUpdateBuilding(newBuilding)
    }
  }, [newBuilding, addOrUpdateBuilding])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('buildings_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'buildings' }, async (payload) => {
        const { data } = await safeFetch<DBBuilding>(`/api/buildings/${payload.new.id}`)
        if (data) addOrUpdateBuilding(transformApiBuildingToMapBuilding(data))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'buildings' }, async (payload) => {
        const { data } = await safeFetch<DBBuilding>(`/api/buildings/${payload.new.id}`)
        if (data) addOrUpdateBuilding(transformApiBuildingToMapBuilding(data))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'buildings' }, (payload) => {
        removeBuilding(payload.old.id as string)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [addOrUpdateBuilding, removeBuilding])

  if (isLoading || error) {
    return null
  }

  const handlePolygonClick = (building: Building, clickLat: number, clickLng: number, screenPoint?: { x: number, y: number }) => {
    if (isCreatingMarker) {
      setSelectedBuildingId(building.id)
      setMarkerCoordinates([clickLat, clickLng])
      openMarkerModal()
    } else if (onBuildingClick) {
      onBuildingClick(building, { latlng: { lat: clickLat, lng: clickLng }, screenPoint })
    }
  }

  const polygons: ReactElement[] = []

  buildings.forEach((building) => {
    const isSelected = selectedBuilding?.id === building.id
    const polygonCoords = building.polygon_coordinates && building.polygon_coordinates.length > 0
      ? (building.polygon_coordinates as [number, number][])
      : createBuildingPolygon(building.coordinates[0], building.coordinates[1])

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
            const containerPoint = (e.target as any)._map.containerPointToLayerPoint(e.latlng)
            handlePolygonClick(building, lat, lng, { x: containerPoint.x, y: containerPoint.y })
          },
        }}
        interactive={true}
        bubblingMouseEvents={false}
      >
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
