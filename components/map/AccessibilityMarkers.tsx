'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Marker, useMap } from 'react-leaflet'
import type { LeafletMouseEvent } from 'leaflet'
import { HiLocationMarker } from 'react-icons/hi'
import { createReactIconMarker } from '@/lib/leaflet/react-icon-marker'
import type { AccessibilityFeature, Building } from '@/types/map'
import { FeatureType } from '@/types/database'
import { safeFetch } from '@/lib/fetch-utils'
import type { ApiFeatureWithPhotos } from '@/types/database'
import type { Building as DBBuilding } from '@/types/database'
import { transformApiFeatureToMapFeature } from '@/lib/utils/feature-transform'
import { transformApiBuildingToMapBuilding } from '@/lib/utils/building-transform'
import { DEFAULT_FETCH_LIMIT } from '@/lib/constants'
import { useMapFilters } from './MapFiltersContext'
import { useFeatureModal } from './FeatureModalContext'
import { useBuildingModal } from './BuildingModalContext'
import { getFeatureColor } from '@/lib/utils/feature-colors'

interface AccessibilityMarkersProps {
  newFeature?: AccessibilityFeature | null
}

function getMarkerIcon(featureType: FeatureType) {
  const color = getFeatureColor(featureType)

  return createReactIconMarker(HiLocationMarker, {
    size: 20,
    backgroundColor: color,
    borderColor: '#1f2937',
    color: 'white',
  })
}

import { createClient } from '@/lib/supabase/client'

export function AccessibilityMarkers({ newFeature }: AccessibilityMarkersProps) {
  const [features, setFeatures] = useState<AccessibilityFeature[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isFeatureTypeEnabled } = useMapFilters()
  const { openModal } = useFeatureModal()
  const { selectedBuilding } = useBuildingModal()
  const map = useMap()

  const iconCache = useMemo(() => {
    const cache = new Map<FeatureType, ReturnType<typeof createReactIconMarker>>()
    Object.values(FeatureType).forEach((type) => {
      cache.set(type, getMarkerIcon(type))
    })
    return cache
  }, [])

  const addOrUpdateFeature = useCallback((newItem: AccessibilityFeature) => {
    setFeatures(prev => {
      const idx = prev.findIndex(f => f.id === newItem.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = newItem
        return next
      }
      return [...prev, newItem]
    })
  }, [])

  const removeFeature = useCallback((featureId: string) => {
    setFeatures(prev => prev.filter(f => f.id !== featureId))
  }, [])

  useEffect(() => {
    const abortController = new AbortController()

    async function fetchData() {
      setIsLoading(true)
      setError(null)

      const [featuresResult, buildingsResult] = await Promise.all([
        safeFetch<ApiFeatureWithPhotos[]>(
          `/api/features?limit=${DEFAULT_FETCH_LIMIT}`,
          { signal: abortController.signal }
        ),
        safeFetch<DBBuilding[]>(
          `/api/buildings?limit=${DEFAULT_FETCH_LIMIT}`,
          { signal: abortController.signal }
        )
      ])

      if (featuresResult.error && featuresResult.error.name !== 'AbortError') {
        console.error('Error fetching features:', featuresResult.error)
        setError(featuresResult.error.message)
        setIsLoading(false)
        return
      }

      if (featuresResult.data) {
        const featuresData: AccessibilityFeature[] = featuresResult.data.map(transformApiFeatureToMapFeature)
        setFeatures(featuresData)
      }

      if (buildingsResult.data) {
        const buildingsData: Building[] = buildingsResult.data.map(transformApiBuildingToMapBuilding)
        setBuildings(buildingsData)
      }

      setIsLoading(false)
    }

    fetchData()

    return () => {
      abortController.abort()
    }
  }, [])

  useEffect(() => {
    if (newFeature) {
      addOrUpdateFeature(newFeature)
    }
  }, [newFeature, addOrUpdateFeature])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('accessibility_features_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'accessibility_features' }, async (payload) => {
        try {
          const { data, error } = await safeFetch<ApiFeatureWithPhotos>(`/api/features/${payload.new.id}`)
          if (!error && data) {
            addOrUpdateFeature(transformApiFeatureToMapFeature(data))
          }
        } catch {}
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'accessibility_features' }, async (payload) => {
        try {
          const { data, error } = await safeFetch<ApiFeatureWithPhotos>(`/api/features/${payload.new.id}`)
          if (!error && data) {
            addOrUpdateFeature(transformApiFeatureToMapFeature(data))
          }
        } catch {}
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'accessibility_features' }, (payload) => {
        removeFeature(payload.old.id as string)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [addOrUpdateFeature, removeFeature])

  const visibleFeatures = useMemo(() => {
    return features.filter(feature => isFeatureTypeEnabled(feature.feature_type))
  }, [features, isFeatureTypeEnabled])
  
  const buildingMap = useMemo(() => {
    const map = new Map<string, Building>()
    buildings.forEach(building => {
      map.set(building.id, building)
    })
    return map
  }, [buildings])

  const featuresByBuilding = useMemo(() => {
    const map = new Map<string, AccessibilityFeature[]>()
    visibleFeatures.forEach(feature => {
      if (feature.building_id) {
        const buildingFeatures = map.get(feature.building_id) || []
        buildingFeatures.push(feature)
        map.set(feature.building_id, buildingFeatures)
      }
    })
    return map
  }, [visibleFeatures])

  if (isLoading) {
    return null
  }

  if (error) {
    console.error('Error loading markers:', error)
    return null
  }

  const standaloneFeatures = visibleFeatures.filter(feature => !feature.building_id)

  const getStackedPosition = (buildingCenter: [number, number], index: number, total: number): [number, number] => {
    const offsetDistance = 0.00002
    const angle = (index / total) * 2 * Math.PI
    const offsetLat = Math.cos(angle) * offsetDistance
    const offsetLng = Math.sin(angle) * offsetDistance
    return [
      buildingCenter[0] + offsetLat,
      buildingCenter[1] + offsetLng,
    ]
  }

  return (
    <>
      {standaloneFeatures.map((feature) => {
        const icon = iconCache.get(feature.feature_type) || iconCache.get(FeatureType.RAMP)
        if (!icon) return null
        
        return (
          <Marker
            key={feature.id}
            position={feature.coordinates}
            icon={icon}
            eventHandlers={{
              click: (e: LeafletMouseEvent) => {
                const containerPoint = map.latLngToContainerPoint(e.latlng)
                const mapContainer = map.getContainer()
                const rect = mapContainer.getBoundingClientRect()
                
                openModal(feature, {
                  x: rect.left + containerPoint.x,
                  y: rect.top + containerPoint.y,
                })
              },
            }}
          />
        )
      })}
      {Array.from(featuresByBuilding.entries()).map(([buildingId, buildingFeatures]) => {
        const building = buildingMap.get(buildingId)
        if (!building) return null

        const featuresToShow = buildingFeatures.slice(0, 5)
        const buildingCenter: [number, number] = building.coordinates

        return featuresToShow.map((feature, index) => {
          const stackedPosition = getStackedPosition(buildingCenter, index, featuresToShow.length)
          const icon = iconCache.get(feature.feature_type) || iconCache.get(FeatureType.RAMP)
          if (!icon) return null
          
          return (
            <Marker
              key={feature.id}
              position={stackedPosition}
              icon={icon}
              interactive={false}
              zIndexOffset={selectedBuilding?.id === buildingId ? 500 : 0}
            />
          )
        })
      })}
    </>
  )
}

