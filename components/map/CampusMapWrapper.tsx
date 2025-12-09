'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type L from 'leaflet'

const CampusMap = dynamic(() => import('./CampusMap'), {
  ssr: false,
})

interface CampusMapWrapperProps {
  isSettingLocation?: boolean;
  onLocationSet?: (latlng: L.LatLng) => void;
  targetNodeId?: string | null;
  targetLocation?: { lat: number; lng: number } | null;
  onRouteCalculated?: (distance?: number, hasStairs?: boolean) => void;
}

export function CampusMapWrapper({ 
  isSettingLocation, 
  onLocationSet, 
  targetNodeId,
  targetLocation,
  onRouteCalculated 
}: CampusMapWrapperProps) {
  return (
    <Suspense fallback={
      <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    }>
      <CampusMap 
        isSettingLocation={isSettingLocation}
        onLocationSet={onLocationSet}
        targetNodeId={targetNodeId}
        targetLocation={targetLocation}
        onRouteCalculated={onRouteCalculated}
      />
    </Suspense>
  )
}

