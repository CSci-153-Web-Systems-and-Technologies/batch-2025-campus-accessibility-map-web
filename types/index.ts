// Export database types
export { FeatureType } from './database'
export type {
  UserProfile,
  FeatureComment,
  FeatureLike,
  DatabaseInsert,
  DatabaseUpdate,
  BuildingInsert,
  AccessibilityFeatureInsert,
  FeaturePhotoInsert,
  FeatureCommentInsert,
  FeatureLikeInsert,
  UserProfileInsert,
  BuildingUpdate,
  AccessibilityFeatureUpdate,
  FeaturePhotoUpdate,
  FeatureCommentUpdate,
  UserProfileUpdate,
} from './database'

// Export map types (extended versions - these override database types)
export type {
  AccessibilityFeature,
  Building,
  FeaturePhoto,
  LatLng,
  MapBounds,
  MapBoundsArray,
  CampusMapConfig,
} from './map'

// Re-export map values
export { VSU_CAMPUS_CONFIG } from './map'

