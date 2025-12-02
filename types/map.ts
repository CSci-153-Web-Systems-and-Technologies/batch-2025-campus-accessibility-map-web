import { FeatureType, AccessibilityFeature as DBAccessibilityFeature, Building as DBBuilding, FeaturePhoto as DBFeaturePhoto } from './database'

export type LatLng = [number, number]

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface MapBoundsArray {
  bounds: [LatLng, LatLng]
  maxBounds?: [LatLng, LatLng]
  maxBoundsViscosity?: number
}

export interface CampusMapConfig {
  center: LatLng
  zoom: number
  minZoom?: number
  maxZoom?: number
  bounds?: MapBoundsArray['bounds']
  maxBounds?: MapBoundsArray['bounds']
  maxBoundsViscosity?: number
}

export interface FeaturePhoto extends DBFeaturePhoto {
  full_url?: string
}

export interface Building extends Omit<DBBuilding, 'latitude' | 'longitude'> {
  coordinates: LatLng
  features?: AccessibilityFeature[]
}

export interface AccessibilityFeature extends Omit<DBAccessibilityFeature, 'latitude' | 'longitude'> {
  coordinates: LatLng
  building?: Building | null
  photos?: FeaturePhoto[]
  comment_count?: number
  like_count?: number
  user_liked?: boolean
}

export const VSU_CAMPUS_CONFIG: CampusMapConfig = {
  center: [10.744397, 124.792071],
  zoom: 17,
  minZoom: 17,
  maxZoom: 18,
  bounds: [
    [10.735, 124.785],
    [10.755, 124.800]
  ],
  maxBounds: [
    [10.730, 124.780],
    [10.760, 124.805]
  ],
  maxBoundsViscosity: 1.0,
}

export { FeatureType }

