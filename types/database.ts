export enum FeatureType {
  RAMP = 'ramp',
  ELEVATOR = 'elevator',
  ACCESSIBLE_RESTROOM = 'accessible_restroom',
  ACCESSIBLE_PARKING = 'accessible_parking',
  TACTILE_PAVING = 'tactile_paving',
  BRAILLE_SIGNAGE = 'braille_signage',
  ACCESSIBLE_ENTRANCE = 'accessible_entrance',
  ACCESSIBLE_PATHWAY = 'accessible_pathway',
}

export interface Building {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
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

export type DatabaseInsert<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>
export type DatabaseUpdate<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at' | 'created_by'>>

export type BuildingInsert = DatabaseInsert<Building>
export type AccessibilityFeatureInsert = DatabaseInsert<AccessibilityFeature>
export type FeaturePhotoInsert = DatabaseInsert<FeaturePhoto>
export type FeatureCommentInsert = DatabaseInsert<FeatureComment>
export type FeatureLikeInsert = DatabaseInsert<FeatureLike>
export type UserProfileInsert = DatabaseInsert<UserProfile>

export type BuildingUpdate = DatabaseUpdate<Building>
export type AccessibilityFeatureUpdate = DatabaseUpdate<AccessibilityFeature>
export type FeaturePhotoUpdate = DatabaseUpdate<FeaturePhoto>
export type FeatureCommentUpdate = DatabaseUpdate<FeatureComment>
export type UserProfileUpdate = DatabaseUpdate<UserProfile>

