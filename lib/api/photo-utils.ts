import type { SupabaseClient } from '@supabase/supabase-js'
import { STORAGE_BUCKETS } from '@/lib/constants'

const STORAGE_BUCKET = STORAGE_BUCKETS.FEATURE_PHOTOS

interface FeatureWithPhotos {
  feature_photos?: Array<{
    id: string
    photo_url: string
    is_primary: boolean
    deleted_at: string | null
    [key: string]: unknown
  }>
  [key: string]: unknown
}

export function processFeaturePhotos<T extends FeatureWithPhotos>(
  feature: T,
  supabase: SupabaseClient
): Omit<T, 'feature_photos'> & { photos: Array<{ id: string; photo_url: string; full_url: string; is_primary: boolean; deleted_at: string | null; [key: string]: unknown }> } {
  const photos = (feature.feature_photos || [])
    .filter((photo) => !photo.deleted_at)
    .map((photo) => {
      const publicUrl = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(photo.photo_url)
      return {
        ...photo,
        full_url: publicUrl.data.publicUrl,
      }
    })
    .sort((a, b) => {
      if (a.is_primary) return -1
      if (b.is_primary) return 1
      return 0
    })

  const { feature_photos, ...rest } = feature
  return {
    ...rest,
    photos,
  } as Omit<T, 'feature_photos'> & { photos: typeof photos }
}

