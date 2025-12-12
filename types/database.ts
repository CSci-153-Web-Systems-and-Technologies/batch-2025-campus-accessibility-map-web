export enum FeatureType {
  RAMP = 'ramp',
  ELEVATOR = 'elevator',
  ACCESSIBLE_RESTROOM = 'accessible_restroom',
  PARKING = 'parking',
  RESTROOM = 'restroom',
  BENCH = 'bench',
}

export interface Building {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
  photo_path?: string | null
  polygon_coordinates: number[][] | null
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface AccessibilityFeature {
  id: string
  feature_type: FeatureType
  title: string
  description: string | null
  latitude: number
  longitude: number
  building_id: string | null
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface FeaturePhoto {
  id: string
  feature_id: string
  photo_url: string
  uploaded_by: string
  caption: string | null
  is_primary: boolean
  created_at: string
  deleted_at: string | null
}

export interface FeatureComment {
  id: string
  feature_id: string
  user_id: string
  content: string
  parent_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface FeatureLike {
  id: string
  feature_id: string
  user_id: string
  created_at: string
}

export interface UserProfile {
  id: string
  display_name: string | null
  route_preference?: 'avoid_stairs' | 'no_preference'
  bio: string | null
  avatar_url: string | null
  notification_preferences: {
    email?: boolean
    contributions?: boolean
  }
  accessibility_preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CommentReport {
  id: string
  comment_id: string
  reported_by: string
  reason: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  resolved_by: string | null
}

export interface FeatureReport {
  id: string
  feature_id: string
  reported_by: string
  reason: string | null
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
}

export interface NodeTags {
  hasStairs?: boolean
  [key: string]: boolean | undefined
}

export interface RoutePolyline {
  id: string
  coordinates: number[][]
  node_tags: Record<string, NodeTags>
  created_by: string
  name: string | null
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type DatabaseInsert<T> = Omit<T, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
export type DatabaseUpdate<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at' | 'created_by'>>

export type BuildingInsert = DatabaseInsert<Building>
export type AccessibilityFeatureInsert = DatabaseInsert<AccessibilityFeature>
export type FeaturePhotoInsert = DatabaseInsert<FeaturePhoto>
export type FeatureCommentInsert = DatabaseInsert<FeatureComment>
export type FeatureLikeInsert = DatabaseInsert<FeatureLike>
export type UserProfileInsert = DatabaseInsert<UserProfile>
export type CommentReportInsert = DatabaseInsert<CommentReport>
export type FeatureReportInsert = DatabaseInsert<FeatureReport>
export type RoutePolylineInsert = DatabaseInsert<RoutePolyline>

export type BuildingUpdate = DatabaseUpdate<Building>
export type AccessibilityFeatureUpdate = DatabaseUpdate<AccessibilityFeature>
export type FeaturePhotoUpdate = DatabaseUpdate<FeaturePhoto>
export type FeatureCommentUpdate = DatabaseUpdate<FeatureComment>
export type UserProfileUpdate = DatabaseUpdate<UserProfile>
export type CommentReportUpdate = DatabaseUpdate<CommentReport>
export type FeatureReportUpdate = DatabaseUpdate<FeatureReport>
export type RoutePolylineUpdate = DatabaseUpdate<RoutePolyline>

export type ApiFeatureWithPhotos = Omit<AccessibilityFeature, 'feature_type'> & {
  feature_type: string
  photos?: Array<{
    id: string
    photo_url: string
    full_url?: string
    is_primary: boolean
  }>
}