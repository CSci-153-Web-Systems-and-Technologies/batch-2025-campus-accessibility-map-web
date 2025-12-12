'use client'

import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { safeFetch } from '@/lib/fetch-utils'
import { formatFeatureType } from '@/lib/utils/feature-utils'
import { FeatureType, type UserProfile } from '@/types/database'
import type { AccessibilityFeature } from '@/types/map'
import { useFeatureModal } from '@/components/map/FeatureModalContext'
import { useRouter } from 'next/navigation'
import { EditDeleteControls } from '@/components/ui/edit-delete-controls'
import { FeatureTypeBadge } from '@/components/ui/feature-type-badge'
import type { User } from '@supabase/supabase-js'

interface UserFeature {
  id: string
  title: string
  feature_type: string
  created_at: string
}

interface UserComment {
  id: string
  content: string
  created_at: string
  feature_id: string
  feature_title: string
  feature_type: string | null
}

interface FeatureApiResponse {
  id: string
  feature_type: string
  title: string
  description: string | null
  latitude: number
  longitude: number
  building_id: string | null
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  photos: Array<{
    id: string
    photo_url: string
    full_url: string
    uploaded_by: string
    caption: string | null
    is_primary: boolean
    created_at: string
    deleted_at: string | null
  }>
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [features, setFeatures] = useState<UserFeature[]>([])
  const [comments, setComments] = useState<UserComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingFeatureId, setDeletingFeatureId] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const { openModal } = useFeatureModal()
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        redirect('/login')
        return
      }

      setUser(currentUser)

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      setProfile(profileData)

      await loadContributions()
      setIsLoading(false)
    }

    loadProfile()
  }, [])

  const loadContributions = async () => {
    const { data, error } = await safeFetch<{
      features: UserFeature[]
      comments: UserComment[]
    }>('/api/profile/contributions')

    if (!error && data) {
      setFeatures(data.features)
      setComments(data.comments || [])
    }
  }

  const handleFeatureClick = async (featureId: string) => {
    const { data, error } = await safeFetch<FeatureApiResponse>(
      `/api/features/${featureId}`
    )

    if (!error && data) {
      const feature: AccessibilityFeature = {
        ...data,
        feature_type: data.feature_type as FeatureType,
        coordinates: [data.latitude, data.longitude] as [number, number],
        photos: data.photos.map((photo) => ({
          id: photo.id,
          feature_id: data.id,
          photo_url: photo.photo_url,
          full_url: photo.full_url,
          uploaded_by: photo.uploaded_by,
          caption: photo.caption,
          is_primary: photo.is_primary,
          created_at: photo.created_at,
          deleted_at: photo.deleted_at,
        })),
      }
      router.push('/')
      setTimeout(() => {
        openModal(feature)
      }, 100)
    }
  }

  const handleDeleteFeature = async (featureId: string) => {
    setDeletingFeatureId(featureId)
    
    const { error } = await safeFetch(`/api/features/${featureId}`, {
      method: 'DELETE',
    })

    setDeletingFeatureId(null)

    if (error) {
      alert('Failed to delete marker. Please try again.')
      return
    }

    // Reload contributions
    await loadContributions()
  }

  const handleDeleteComment = async (featureId: string, commentId: string) => {
    setDeletingCommentId(commentId)
    
    const { error } = await safeFetch(`/api/features/${featureId}/comments/${commentId}`, {
      method: 'DELETE',
    })

    setDeletingCommentId(null)

    if (error) {
      alert('Failed to delete comment. Please try again.')
      return
    }

    // Reload contributions
    await loadContributions()
  }


  const displayName = profile?.display_name || (user?.email?.split('@')[0] ?? 'User')
  const avatarUrl = profile?.avatar_url || null

  if (isLoading) {
    return (
      <div className="bg-m3-surface text-m3-on-surface p-6 rounded-lg shadow">
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="m3-dot-loader-lg">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="text-m3-on-surface-variant text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-m3-surface text-m3-on-surface p-3 sm:p-4 md:p-6 rounded-lg shadow max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-m3-outline">
        <div>
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-m3-surface-variant flex items-center justify-center overflow-hidden border-2 border-m3-outline">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-m3-on-surface">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-m3-primary mb-2">{displayName}</h1>
          <p className="text-sm sm:text-base text-m3-on-surface-variant break-words">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-m3-primary">Your Markers</h2>
          {features.length === 0 ? (
            <p className="text-m3-on-surface-variant">You haven't created any markers yet.</p>
          ) : (
            <div className="space-y-3">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="p-4 border border-m3-outline rounded-lg hover:bg-m3-surface-variant/50 transition-colors bg-m3-secondary-container"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div 
                      className="flex-1 cursor-pointer min-w-0 w-full sm:w-auto"
                      onClick={() => handleFeatureClick(feature.id)}
                    >
                      <h3 className="font-semibold text-base sm:text-lg mb-1 text-m3-on-secondary-container break-words">{feature.title}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <FeatureTypeBadge 
                          featureType={feature.feature_type as FeatureType} 
                          size="sm"
                        />
                        <span className="text-xs text-m3-tertiary">
                          {new Date(feature.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <EditDeleteControls
                        onEdit={() => {}}
                        onDelete={() => handleDeleteFeature(feature.id)}
                        isDeleting={deletingFeatureId === feature.id}
                        showEdit={false}
                        size="sm"
                        deleteLabel="Delete marker"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-m3-primary">Your Comments</h2>
          {comments.length === 0 ? (
            <p className="text-m3-on-surface-variant">You haven't made any comments yet.</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 border border-m3-outline rounded-lg hover:bg-m3-surface-variant/50 transition-colors bg-m3-secondary-container"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div 
                      className="flex-1 min-w-0 overflow-hidden cursor-pointer"
                      onClick={() => handleFeatureClick(comment.feature_id)}
                    >
                      <p className="text-sm text-m3-on-secondary-container mb-2 line-clamp-2 break-words overflow-hidden">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-m3-on-surface-variant flex-shrink-0">
                          on
                        </span>
                        <span className="text-xs font-semibold text-m3-primary truncate max-w-[200px] min-w-0">
                          {comment.feature_title}
                        </span>
                        {comment.feature_type && (
                          <FeatureTypeBadge 
                            featureType={comment.feature_type as FeatureType} 
                            size="sm"
                            className="flex-shrink-0"
                          />
                        )}
                        <span className="text-xs text-m3-tertiary flex-shrink-0">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <EditDeleteControls
                        onEdit={() => {}}
                        onDelete={() => handleDeleteComment(comment.feature_id, comment.id)}
                        isDeleting={deletingCommentId === comment.id}
                        showEdit={false}
                        size="sm"
                        deleteLabel="Delete comment"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
