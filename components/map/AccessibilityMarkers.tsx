'use client'

import { useEffect, useState } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import type { AccessibilityFeature } from '@/types/map'
import { FeatureType } from '@/types/database'

interface AccessibilityMarkersProps {
  refreshTrigger?: number
}

function getMarkerIcon(featureType: FeatureType): Icon {
  const iconUrl = getIconUrl(featureType)
  
  return new Icon({
    iconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

function getIconUrl(featureType: FeatureType): string {
  const baseUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon'
  const iconMap: Record<FeatureType, string> = {
    [FeatureType.RAMP]: `${baseUrl}-red.png`,
    [FeatureType.ELEVATOR]: `${baseUrl}-blue.png`,
    [FeatureType.ACCESSIBLE_RESTROOM]: `${baseUrl}-green.png`,
    [FeatureType.ACCESSIBLE_PARKING]: `${baseUrl}-orange.png`,
    [FeatureType.TACTILE_PAVING]: `${baseUrl}-yellow.png`,
    [FeatureType.BRAILLE_SIGNAGE]: `${baseUrl}-violet.png`,
    [FeatureType.ACCESSIBLE_ENTRANCE]: `${baseUrl}-grey.png`,
    [FeatureType.ACCESSIBLE_PATHWAY]: `${baseUrl}-black.png`,
  }
  
  return iconMap[featureType] || `${baseUrl}-red.png`
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
          icon={getMarkerIcon(feature.feature_type)}
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
                  <img
                    src={feature.photos[0].full_url || feature.photos[0].photo_url}
                    alt={feature.title}
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
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

