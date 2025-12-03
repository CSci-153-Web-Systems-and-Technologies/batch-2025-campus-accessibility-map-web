'use client'

import { useEffect, useState, useMemo } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import { HiLocationMarker } from 'react-icons/hi'
import { createReactIconMarker } from '@/lib/leaflet/react-icon-marker'
import type { AccessibilityFeature } from '@/types/map'
import { FeatureType } from '@/types/database'
import { FeaturePhoto } from './FeaturePhoto'

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

function formatFeatureType(type: FeatureType): string {
  return type
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
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
    async function fetchFeatures() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/features?limit=100')
        
        if (!response.ok) {
          throw new Error('Failed to fetch features')
        }

        const result = await response.json()
        const featuresData = (result.data || []).map((feature: any) => ({
          ...feature,
          coordinates: [feature.latitude, feature.longitude] as [number, number],
          photos: feature.photos || [],
        }))

        setFeatures(featuresData)
      } catch (err) {
        console.error('Error fetching features:', err)
        setError(err instanceof Error ? err.message : 'Failed to load markers')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeatures()
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

