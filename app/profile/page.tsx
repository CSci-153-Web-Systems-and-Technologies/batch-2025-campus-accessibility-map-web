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
import { Camera } from 'lucide-react'

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
  const { openModal } = useFeatureModal()
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        redirect('/auth/login')
        return
      }

      setUser(currentUser)

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      setProfile(profileData)

      const { data, error } = await safeFetch<{
        features: UserFeature[]
        comments: UserComment[]
      }>('/api/profile/contributions')

      if (!error && data) {
        setFeatures(data.features)
        setComments(data.comments || [])
      }

      setIsLoading(false)
    }

    loadProfile()
  }, [])

  const handleFeatureClick = async (featureId: string) => {
    const { data, error } = await safeFetch<AccessibilityFeature>(
      `/api/features/${featureId}`
    )

    if (!error && data) {
      const feature: AccessibilityFeature = {
        ...data,
        feature_type: data.feature_type as FeatureType,
        coordinates: [data.latitude, data.longitude] as [number, number],
        photos: (data.photos || []).map(photo => ({
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

  const handleAvatarClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/jpg,image/png,image/webp'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/profile/avatar', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          alert(error.error || 'Failed to upload avatar')
          return
        }

        const result = await response.json()
        if (result.data?.avatar_url) {
          setProfile((prev: any) => ({
            ...prev,
            avatar_url: result.data.avatar_url,
          }))
        }
      } catch (error) {
        console.error('Error uploading avatar:', error)
        alert('Failed to upload avatar')
      }
    }
    input.click()
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
        <div className="relative">
          <div 
            className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-border"
            onClick={handleAvatarClick}
          >
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
          <button
            onClick={handleAvatarClick}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors border-2 border-background"
            aria-label="Edit profile picture"
          >
            <Camera className="w-4 h-4" />
          </button>
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
                  onClick={() => handleFeatureClick(feature.id)}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
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
                  onClick={() => handleFeatureClick(comment.feature_id)}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 overflow-hidden">
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
