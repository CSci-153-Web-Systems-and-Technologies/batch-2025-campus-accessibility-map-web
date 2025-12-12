'use client'

import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { useEffect, useState, useCallback, useRef } from 'react'
import { VSU_CAMPUS_CONFIG } from '@/types/map'
import { configureLeafletIcons } from '@/lib/leaflet/icon-config'
import { MapClickHandler } from './MapClickHandler'
import { BuildingCreationClickHandler } from './BuildingCreationClickHandler'
import { useMarkerCreation } from './MarkerCreationContext'
import { useBuildingCreation } from './BuildingCreationContext'
import { useBuildingModal } from './BuildingModalContext'
import { AccessibilityMarkers } from './AccessibilityMarkers'
import { BuildingsPolygons } from './BuildingsPolygons'
import { BuildingSearchMapControl } from './BuildingSearch'
import { RouteDrawingControl } from './RouteDrawingControl'
import { RouteLoader } from './RouteLoader'
import { RoutingControl } from './RoutingControl'
import { RouteGraph } from '@/lib/routing/RouteGraph'
import { safeFetch } from '@/lib/fetch-utils'
import type { Building } from '@/types/map'
import type L from 'leaflet'

// Component to handle map resize and invalidate size
function MapResizeHandler() {
  const map = useMap()

  useEffect(() => {
    // Invalidate size on mount
    setTimeout(() => {
      map.invalidateSize()
    }, 100)

    // Handle window resize
    const handleResize = () => {
      setTimeout(() => {
        map.invalidateSize()
      }, 100)
    }

    // Handle sidebar toggle (listen for custom event)
    const handleSidebarToggle = () => {
      setTimeout(() => {
        map.invalidateSize()
      }, 300) // Wait for sidebar animation
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('sidebar-toggle', handleSidebarToggle)

    // Also listen for orientation change on mobile
    const handleOrientationChange = () => {
      setTimeout(() => {
        map.invalidateSize()
      }, 500)
    }

    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('sidebar-toggle', handleSidebarToggle)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [map])
  return null
}

interface CampusMapProps {
  isSettingLocation?: boolean
  onLocationSet?: (latlng: L.LatLng) => void
  targetNodeId?: string | null
  targetLocation?: { lat: number; lng: number } | null
  onRouteCalculated?: (distance?: number, hasStairs?: boolean) => void
}

export default function CampusMap({
  isSettingLocation,
  onLocationSet,
  targetNodeId,
  targetLocation,
  onRouteCalculated
}: CampusMapProps = {}) {
  const [isMounted, setIsMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const graphRef = useRef<RouteGraph | null>(new RouteGraph())
  const [routePreference, setRoutePreference] = useState<'avoid_stairs' | 'no_preference'>('avoid_stairs')
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        type ProfileResp = { profile: import('@/types/database').UserProfile | null }
        const { data, error } = await safeFetch<ProfileResp>('/api/profile')
        if (!error && mounted && data?.profile) {
          const profile = data.profile
          const asRecord = profile as unknown as Record<string, unknown>
          const rawPref = typeof asRecord.route_preference === 'string'
            ? asRecord.route_preference
            : typeof asRecord.routePreference === 'string'
            ? asRecord.routePreference
            : undefined

          if (rawPref === 'no_preference') {
            setRoutePreference('no_preference')
          } else {
            setRoutePreference('avoid_stairs')
          }
        }
      } catch (e) {
        /* ignore */
      }
    })()
    return () => { mounted = false }
  }, [])

  // Listen for profile updates dispatched elsewhere (settings page)
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent)?.detail as Record<string, unknown> | undefined
        const rawPref = detail?.route_preference ?? detail?.routePreference
        if (typeof rawPref === 'string') {
          if (rawPref === 'no_preference') setRoutePreference('no_preference')
          else setRoutePreference('avoid_stairs')
        }
      } catch (err) {
        // ignore
      }
    }

    window.addEventListener('profile-updated', handler as EventListener)
    return () => window.removeEventListener('profile-updated', handler as EventListener)
  }, [])
  const { isCreating, setClickedCoordinates, openModal, newFeature } = useMarkerCreation()
  const { isCreating: isCreatingBuilding, setClickedCoordinates: setBuildingCoordinates, openModal: openBuildingCreationModal, newBuilding } = useBuildingCreation()
  const { openModal: openBuildingModal, isOpen: isBuildingModalOpen, selectedBuilding, closeModal: closeBuildingModal } = useBuildingModal()

  const handleMapClick = useCallback((coordinates: [number, number]) => {
    if (isCreating) {
      setClickedCoordinates(coordinates)
      openModal()
    } else if (!isCreatingBuilding && selectedBuilding && !isBuildingModalOpen) {
      closeBuildingModal()
    }
  }, [isCreating, isCreatingBuilding, setClickedCoordinates, openModal, selectedBuilding, isBuildingModalOpen, closeBuildingModal])

  const handleBuildingMapClick = useCallback((coordinates: [number, number]) => {
    if (isCreatingBuilding) {
      setBuildingCoordinates(coordinates)
    }
  }, [isCreatingBuilding, setBuildingCoordinates])

  const handleBuildingClick = useCallback((building: Building, event?: { latlng?: { lat: number, lng: number }, screenPoint?: { x: number, y: number } }) => {
    const origin = event?.screenPoint ? {
      x: event.screenPoint.x,
      y: event.screenPoint.y,
    } : undefined
    openBuildingModal(building, origin)
  }, [openBuildingModal])

  useEffect(() => {
    if (typeof window === 'undefined') return
    configureLeafletIcons()
    setIsMounted(true)
    
    // Check if mobile on mount
    setIsMobile(window.innerWidth < 640)
    
    // Update mobile state on resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!isMounted) {
    return null
  }

  // Adjust maxBoundsViscosity for mobile - allow more flexible panning
  const maxBoundsViscosity = isMobile ? 0.5 : VSU_CAMPUS_CONFIG.maxBoundsViscosity
  
  // Expand horizontal bounds significantly on mobile for better left/right panning
  // Original bounds: [124.790, 124.796] - only 0.006 degrees wide
  // Mobile bounds: [124.775, 124.810] - 0.035 degrees wide (5.8x wider)
  // This allows accessing the full map area on smaller screens
  const mobileMaxBounds: [[number, number], [number, number]] = isMobile
    ? [
        [10.735, 124.775], // South-West (expanded left)
        [10.755, 124.810]  // North-East (expanded right)
      ]
    : VSU_CAMPUS_CONFIG.maxBounds!

  return (
    <MapContainer
      center={VSU_CAMPUS_CONFIG.center}
      zoom={VSU_CAMPUS_CONFIG.zoom}
      minZoom={VSU_CAMPUS_CONFIG.minZoom}
      maxZoom={VSU_CAMPUS_CONFIG.maxZoom}
      bounds={VSU_CAMPUS_CONFIG.bounds}
      maxBounds={mobileMaxBounds}
      maxBoundsViscosity={maxBoundsViscosity}
      className="h-full w-full"
      worldCopyJump={false}
      zoomControl={!isMobile}
      attributionControl={!isMobile}
    >
      <MapResizeHandler />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Campus Accessibility Map'
      />
      <BuildingSearchMapControl />
      <RouteLoader graphRef={graphRef} />
      <RouteDrawingControl graphRef={graphRef} />
      {isSettingLocation !== undefined && (
        <RoutingControl
          graphRef={graphRef}
          isSettingLocation={isSettingLocation}
          onLocationSet={onLocationSet}
          targetNodeId={targetNodeId ?? null}
          targetLocation={targetLocation ?? null}
          onRouteCalculated={onRouteCalculated}
          routePreference={routePreference}
        />
      )}
      <MapClickHandler enabled={isCreating || (!isCreatingBuilding && !!selectedBuilding)} onMapClick={handleMapClick} />
      <BuildingCreationClickHandler enabled={isCreatingBuilding} onMapClick={handleBuildingMapClick} />
      <AccessibilityMarkers newFeature={newFeature} />
      <BuildingsPolygons newBuilding={newBuilding} onBuildingClick={handleBuildingClick} />
    </MapContainer>
  )
}

