import type { AccessibilityFeature } from '@/types/map'
import type { ApiFeatureWithPhotos, FeatureType } from '@/types/database'

export function transformApiFeatureToMapFeature(feature: ApiFeatureWithPhotos): AccessibilityFeature {
  return {
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
  }
}

