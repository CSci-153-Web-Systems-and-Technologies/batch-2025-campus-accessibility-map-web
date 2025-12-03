'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Building, AccessibilityFeature } from '@/types/map'
import { FeatureType } from '@/types/database'
import { useBuilding } from './BuildingContext'
import { FeaturePhoto } from './FeaturePhoto'

interface BuildingFeaturesWindowProps {
  building: Building
  onClose: () => void
}

function formatFeatureType(type: FeatureType): string {
  return type
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

export function BuildingFeaturesWindow({ building, onClose }: BuildingFeaturesWindowProps) {
  const [features, setFeatures] = useState<AccessibilityFeature[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFeatures() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/features?building_id=${building.id}&limit=100`)
        
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
        console.error('Error fetching building features:', err)
        setError(err instanceof Error ? err.message : 'Failed to load features')
      } finally {
        setIsLoading(false)
      }
    }

    if (building.id) {
      fetchFeatures()
    }
  }, [building.id])

  return (
    <div className="fixed bottom-4 right-4 z-[2000] w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
      <Card className="shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">{building.name}</CardTitle>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          {building.description && (
            <p className="text-sm text-muted-foreground mb-4">{building.description}</p>
          )}

          <div className="mb-4">
            <h4 className="font-semibold mb-2">
              Accessibility Features ({features.length})
            </h4>
            
            {isLoading && (
              <p className="text-sm text-muted-foreground">Loading features...</p>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {!isLoading && !error && features.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No accessibility features recorded for this building yet.
              </p>
            )}

            {!isLoading && !error && features.length > 0 && (
              <div className="space-y-3">
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm mb-1">{feature.title}</h5>
                        <p className="text-xs text-muted-foreground mb-2">
                          {formatFeatureType(feature.feature_type)}
                        </p>
                        {feature.description && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {feature.description}
                          </p>
                        )}
                        {feature.photos && feature.photos.length > 0 && (
                          <FeaturePhoto
                            photoUrl={feature.photos[0].full_url || feature.photos[0].photo_url}
                            alt={feature.title}
                            className="w-full rounded mt-2"
                            height="96px"
                            objectFit="cover"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

