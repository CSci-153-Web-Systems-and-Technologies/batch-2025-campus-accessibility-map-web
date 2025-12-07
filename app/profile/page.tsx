'use client'

import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { safeFetch } from '@/lib/fetch-utils'
import { formatFeatureType } from '@/lib/utils/feature-utils'
import { FeatureType } from '@/types/database'
import type { AccessibilityFeature } from '@/types/map'
import { useFeatureModal } from '@/components/map/FeatureModalContext'
import { useRouter } from 'next/navigation'
import { EditDeleteControls } from '@/components/ui/edit-delete-controls'

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

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
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
    const { data, error } = await safeFetch<any>(
      `/api/features/${featureId}`
    )

    if (!error && data) {
      const feature: AccessibilityFeature = {
        ...data,
        feature_type: data.feature_type as FeatureType,
        coordinates: [data.latitude, data.longitude] as [number, number],
        photos: (data.photos || []).map((photo: any) => ({
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


  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User'
  const avatarUrl = profile?.avatar_url || null

  if (isLoading) {
    return (
      <div className="bg-card text-card-foreground p-6 rounded-lg shadow">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg shadow max-w-4xl mx-auto">
      <div className="flex items-center gap-6 mb-8 pb-6 border-b">
        <div>
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-foreground">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground mb-2">{displayName}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Markers</h2>
          {features.length === 0 ? (
            <p className="text-muted-foreground">You haven't created any markers yet.</p>
          ) : (
            <div className="space-y-3">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleFeatureClick(feature.id)}
                    >
                      <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {formatFeatureType(feature.feature_type)}
                        </span>
                        <span className="text-xs text-muted-foreground">
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
          <h2 className="text-xl font-semibold mb-4">Your Comments</h2>
          {comments.length === 0 ? (
            <p className="text-muted-foreground">You haven't made any comments yet.</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div 
                      className="flex-1 min-w-0 overflow-hidden cursor-pointer"
                      onClick={() => handleFeatureClick(comment.feature_id)}
                    >
                      <p className="text-sm text-foreground mb-2 line-clamp-2 break-words overflow-hidden">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-muted-foreground flex-shrink-0">
                          on
                        </span>
                        <span className="text-xs font-semibold text-foreground truncate max-w-[200px] min-w-0">
                          {comment.feature_title}
                        </span>
                        {comment.feature_type && (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary flex-shrink-0">
                            {formatFeatureType(comment.feature_type)}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground flex-shrink-0">
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
