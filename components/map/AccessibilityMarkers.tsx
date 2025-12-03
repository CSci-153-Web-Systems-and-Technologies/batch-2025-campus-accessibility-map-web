'use client'

import { useEffect, useState, useMemo } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import { HiLocationMarker } from 'react-icons/hi'
import { createReactIconMarker } from '@/lib/leaflet/react-icon-marker'
import type { AccessibilityFeature } from '@/types/map'
import { FeatureType } from '@/types/database'
import { FeaturePhoto } from './FeaturePhoto'
import { safeFetch } from '@/lib/fetch-utils'
import type { ApiFeatureWithPhotos } from '@/types/database'
import { formatFeatureType } from '@/lib/utils/feature-utils'

interface AccessibilityMarkersProps {
  refreshTrigger?: number
}

function getMarkerIcon(featureType: FeatureType) {
  const colorMap: Record<FeatureType, string> = {
    [FeatureType.RAMP]: '#ef4444',
    [FeatureType.ELEVATOR]: '#3b82f6',
    [FeatureType.ACCESSIBLE_RESTROOM]: '#10b981',
    [FeatureType.PARKING]: '#f97316',
    [FeatureType.RESTROOM]: '#8b5cf6',
    [FeatureType.BENCH]: '#eab308',
  }

  const color = colorMap[featureType] || '#ef4444'

  return createReactIconMarker(HiLocationMarker, {
    size: 20,
    backgroundColor: color,
    borderColor: '#1f2937',
    color: 'white',
  })
}

export function AccessibilityMarkers({ refreshTrigger }: AccessibilityMarkersProps) {
  const [features, setFeatures] = useState<AccessibilityFeature[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const map = useMap()

  const iconCache = useMemo(() => {
    const cache = new Map<FeatureType, ReturnType<typeof createReactIconMarker>>()
    Object.values(FeatureType).forEach((type) => {
      cache.set(type, getMarkerIcon(type))
    })
    return cache
  }, [])

  useEffect(() => {
    const abortController = new AbortController()

    async function fetchFeatures() {
      setIsLoading(true)
      setError(null)

      const { data, error } = await safeFetch<ApiFeatureWithPhotos[]>(
        '/api/features?limit=100',
        abortController.signal
      )

      if (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching features:', error)
          setError(error.message)
        }
        setIsLoading(false)
        return
      }

      if (data) {
        const featuresData: AccessibilityFeature[] = data.map((feature) => ({
          ...feature,
          feature_type: feature.feature_type as FeatureType,
          coordinates: [feature.latitude, feature.longitude] as [number, number],
          photos: (feature.photos || []).map(photo => ({
            id: photo.id,
            feature_id: feature.id,
            photo_url: photo.photo_url,
            full_url: photo.full_url,
            uploaded_by: '',
            caption: null,
            is_primary: photo.is_primary,
            created_at: '',
            deleted_at: null,
          })),
        }))
        setFeatures(featuresData)
      }

      setIsLoading(false)
    }

    fetchFeatures()

    return () => {
      abortController.abort()
    }
  }, [refreshTrigger])

  if (isLoading) {
    return null
  }

  if (error) {
    console.error('Error loading markers:', error)
    return null
  }

  return (
    <>
      {features.map((feature) => (
        <Marker
          key={feature.id}
          position={feature.coordinates}
          icon={iconCache.get(feature.feature_type) || iconCache.get(FeatureType.RAMP)!}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {formatFeatureType(feature.feature_type)}
              </p>
              {feature.description && (
                <p className="text-sm mb-2">{feature.description}</p>
              )}
              {feature.photos && feature.photos.length > 0 && (
                <div className="mb-2">
                  <FeaturePhoto
                    photoUrl={feature.photos[0].full_url || feature.photos[0].photo_url}
                    alt={feature.title}
                    className="w-full rounded"
                    height="128px"
                    objectFit="cover"
                  />
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

