'use client'

import { useEffect, useState, useCallback } from 'react'
import type { AccessibilityFeature } from '@/types/map'
import { FeaturePhoto } from './FeaturePhoto'
import { formatFeatureType } from '@/lib/utils/feature-utils'
import { safeFetch } from '@/lib/fetch-utils'
import type { FeatureComment } from '@/types/database'
import type { Building as DBBuilding } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FaHeart } from 'react-icons/fa'
import { X, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useFeatureModal } from './FeatureModalContext'
import { FeatureType } from '@/types/database'
import { EditDeleteControls } from '@/components/ui/edit-delete-controls'
import { FeatureTypeBadge } from '@/components/ui/feature-type-badge'
import { getFeatureColor, hexToRgba } from '@/lib/utils/feature-colors'
import { ReportModal } from '@/components/ui/report-modal'
import type { User } from '@supabase/supabase-js'

interface FeaturePopupContentProps {
  feature: AccessibilityFeature
}

interface CommentWithUser extends FeatureComment {
  user_display_name?: string | null
  user_avatar_url?: string | null
}

interface CommentWithReplies extends CommentWithUser {
  replies?: CommentWithReplies[]
}

interface LikeData {
  count: number
  user_liked: boolean
}

export function FeaturePopupContent({ feature }: FeaturePopupContentProps) {
  const [building, setBuilding] = useState<DBBuilding | null>(null)
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isLoadingBuilding, setIsLoadingBuilding] = useState(false)
  const [likeData, setLikeData] = useState<LikeData>({ count: 0, user_liked: false })
  const [isLiking, setIsLiking] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [selectedComment, setSelectedComment] = useState<CommentWithUser | null>(null)
  const [isEditingFeature, setIsEditingFeature] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editFeatureData, setEditFeatureData] = useState({
    title: feature.title,
    description: feature.description || '',
    feature_type: feature.feature_type,
  })
  const [editCommentContent, setEditCommentContent] = useState('')
  const [isSavingFeature, setIsSavingFeature] = useState(false)
  const [isSavingComment, setIsSavingComment] = useState(false)
  const [isDeletingFeature, setIsDeletingFeature] = useState(false)
  const [isDeletingComment, setIsDeletingComment] = useState(false)
  const [isReportingComment, setIsReportingComment] = useState(false)
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null)
  const [showReportCommentModal, setShowReportCommentModal] = useState(false)
  const [showReportFeatureModal, setShowReportFeatureModal] = useState(false)
  const [isReportingFeature, setIsReportingFeature] = useState(false)
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([])
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([])
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null)
  const { closeModal } = useFeatureModal()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  useEffect(() => {
    if (feature.building_id) {
      setIsLoadingBuilding(true)
      const abortController = new AbortController()

      async function fetchBuilding() {
        const { data, error } = await safeFetch<DBBuilding>(
          `/api/buildings/${feature.building_id}`,
          { signal: abortController.signal }
        )

        if (!error && data) {
          setBuilding(data)
        }
        setIsLoadingBuilding(false)
      }

      fetchBuilding()

      return () => {
        abortController.abort()
      }
    }
  }, [feature.building_id])

  useEffect(() => {
    setIsLoadingComments(true)
    const abortController = new AbortController()

    async function fetchCommentsAndLikes() {
      const [commentsResult, likesResult] = await Promise.all([
        safeFetch<CommentWithUser[]>(
          `/api/features/${feature.id}/comments`,
          { signal: abortController.signal }
        ),
        safeFetch<LikeData>(
          `/api/features/${feature.id}/likes`,
          { signal: abortController.signal }
        )
      ])

      if (!commentsResult.error && commentsResult.data) {
        const flatComments: CommentWithUser[] = []
        function flattenComments(comments: CommentWithReplies[]) {
          comments.forEach(comment => {
            flatComments.push({
              ...comment,
              user_display_name: comment.user_display_name || null,
              user_avatar_url: comment.user_avatar_url || null,
            })
            if (comment.replies && comment.replies.length > 0) {
              flattenComments(comment.replies)
            }
          })
        }
        flattenComments(commentsResult.data as CommentWithReplies[])
        setComments(flatComments)
      }
      setIsLoadingComments(false)

      if (!likesResult.error && likesResult.data) {
        setLikeData(likesResult.data)
      }
    }

    fetchCommentsAndLikes()

    return () => {
      abortController.abort()
    }
  }, [feature.id])

  const handleLike = useCallback(async () => {
    if (!user || isLiking || likeData.user_liked) return

    setIsLiking(true)
    try {
      const response = await fetch(`/api/features/${feature.id}/likes`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      const data = result.data

      if (data) {
        setLikeData(prev => ({
          count: data.liked ? prev.count + 1 : Math.max(0, prev.count - 1),
          user_liked: data.liked,
        }))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setIsLiking(false)
    }
  }, [user, feature.id, isLiking, likeData.user_liked])

  const isFeatureOwner = user?.id && feature.created_by && feature.created_by === user.id

  const handleEditFeature = useCallback(() => {
    setIsEditingFeature(true)
    setEditFeatureData({
      title: feature.title,
      description: feature.description || '',
      feature_type: feature.feature_type,
    })
    setNewPhotos([])
    setNewPhotoPreviews([])
    setPhotosToDelete([])
  }, [feature])

  const handleCancelEditFeature = useCallback(() => {
    setIsEditingFeature(false)
    setEditFeatureData({
      title: feature.title,
      description: feature.description || '',
      feature_type: feature.feature_type,
    })
    setNewPhotos([])
    setNewPhotoPreviews([])
    setPhotosToDelete([])
  }, [feature])

  const handlePhotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    const { validatePhotoFiles, generatePhotoPreviews } = await import('@/lib/utils/photo-handler')
    const { validFiles, errors } = validatePhotoFiles(files)
    
    if (errors.length > 0) {
      alert(errors.join('\n'))
    }

    if (validFiles.length > 0) {
      setNewPhotos((prev) => [...prev, ...validFiles])
      const previews = await generatePhotoPreviews(validFiles)
      setNewPhotoPreviews((prev) => [...prev, ...previews])
    }
  }, [])

  const removeNewPhoto = useCallback((index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index))
    setNewPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleDeletePhoto = useCallback((photoId: string) => {
    setPhotosToDelete((prev) => [...prev, photoId])
  }, [])

  const handleUndoDeletePhoto = useCallback((photoId: string) => {
    setPhotosToDelete((prev) => prev.filter((id) => id !== photoId))
  }, [])

  const handleSaveFeature = useCallback(async () => {
    if (!isFeatureOwner || isSavingFeature) return

    setIsSavingFeature(true)
    setIsUploadingPhotos(true)
    try {
      const response = await fetch(`/api/features/${feature.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFeatureData),
      })

      if (!response.ok) {
        throw new Error('Failed to update feature')
      }

      const uploadErrors: string[] = []
      const { deleteFeaturePhoto, uploadFeaturePhoto } = await import('@/lib/utils/photo-handler')

      if (photosToDelete.length > 0) {
        for (const photoId of photosToDelete) {
          const result = await deleteFeaturePhoto(feature.id, photoId)
          if (!result.success) {
            uploadErrors.push(`Failed to delete photo: ${result.error || 'Unknown error'}`)
          }
        }
      }

      if (newPhotos.length > 0) {
        const remainingPhotos = feature.photos?.filter(p => !photosToDelete.includes(p.id)) || []
        const hasPrimaryPhoto = remainingPhotos.some(p => p.is_primary)
        const shouldSetPrimary = !hasPrimaryPhoto && newPhotos.length > 0
        
        for (let i = 0; i < newPhotos.length; i++) {
          const isPrimary = i === 0 && shouldSetPrimary
          const result = await uploadFeaturePhoto(feature.id, newPhotos[i], isPrimary)
          if (!result.success) {
            uploadErrors.push(`Photo ${i + 1}: ${result.error || 'Upload failed'}`)
          }
        }
      }

      if (uploadErrors.length > 0) {
        alert(`Feature updated, but some photo operations failed:\n\n${uploadErrors.join('\n')}`)
      }

      setIsEditingFeature(false)
      window.location.reload()
    } catch (error) {
      console.error('Error updating feature:', error)
      alert('Failed to update feature. Please try again.')
    } finally {
      setIsSavingFeature(false)
      setIsUploadingPhotos(false)
    }
  }, [feature.id, editFeatureData, isFeatureOwner, isSavingFeature, isUploadingPhotos, newPhotos, photosToDelete, feature.photos])

  const handleDeleteFeature = useCallback(async () => {
    if (!isFeatureOwner || isDeletingFeature) return

    setIsDeletingFeature(true)
    try {
      const response = await fetch(`/api/features/${feature.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete feature')
      }

      closeModal()
      window.location.reload()
    } catch (error) {
      console.error('Error deleting feature:', error)
      alert('Failed to delete feature. Please try again.')
      setIsDeletingFeature(false)
    }
  }, [feature.id, isFeatureOwner, isDeletingFeature, closeModal])

  const handleEditComment = useCallback((comment: CommentWithUser) => {
    setEditingCommentId(comment.id)
    setEditCommentContent(comment.content)
  }, [])

  const handleCancelEditComment = useCallback(() => {
    setEditingCommentId(null)
    setEditCommentContent('')
  }, [])

  const handleSaveComment = useCallback(async (commentId: string) => {
    if (!editCommentContent.trim() || isSavingComment) return

    setIsSavingComment(true)
    try {
      const response = await fetch(`/api/features/${feature.id}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editCommentContent.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to update comment')
      }

      const result = await response.json()
      if (result.data) {
        setEditingCommentId(null)
        setEditCommentContent('')
        
        const abortController = new AbortController()
        const { data: commentsData, error: commentsError } = await safeFetch<CommentWithUser[]>(
          `/api/features/${feature.id}/comments`,
          { signal: abortController.signal }
        )

        if (!commentsError && commentsData) {
          const flatComments: CommentWithUser[] = []
          function flattenComments(comments: CommentWithReplies[]) {
            comments.forEach(comment => {
              flatComments.push({
                ...comment,
                user_display_name: comment.user_display_name || null,
                user_avatar_url: comment.user_avatar_url || null,
              })
              if (comment.replies && comment.replies.length > 0) {
                flattenComments(comment.replies)
              }
            })
          }
          flattenComments(commentsData as CommentWithReplies[])
          setComments(flatComments)
        }
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      alert('Failed to update comment. Please try again.')
    } finally {
      setIsSavingComment(false)
    }
  }, [feature.id, editCommentContent, isSavingComment])

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (isDeletingComment) return

    setIsDeletingComment(true)
    try {
      const response = await fetch(`/api/features/${feature.id}/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      setComments(prev => prev.filter(c => c.id !== commentId))
      if (selectedComment?.id === commentId) {
        setSelectedComment(null)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment. Please try again.')
    } finally {
      setIsDeletingComment(false)
    }
  }, [feature.id, isDeletingComment, selectedComment])

  const handleReportCommentClick = useCallback((commentId: string) => {
    setReportingCommentId(commentId)
    setShowReportCommentModal(true)
  }, [])

  const handleReportComment = useCallback(async (reason: string) => {
    if (!reportingCommentId || isReportingComment) return

    setIsReportingComment(true)
    try {
      const response = await fetch(`/api/comments/${reportingCommentId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to report comment')
      }

      setShowReportCommentModal(false)
      setReportingCommentId(null)
      alert('Comment reported successfully. Thank you for your feedback.')
    } catch (error) {
      console.error('Error reporting comment:', error)
      alert(error instanceof Error ? error.message : 'Failed to report comment. Please try again.')
    } finally {
      setIsReportingComment(false)
    }
  }, [reportingCommentId, isReportingComment])

  const handleReportFeatureClick = useCallback(() => {
    setShowReportFeatureModal(true)
  }, [])

  const handleReportFeature = useCallback(async (reason: string) => {
    if (isReportingFeature) return

    setIsReportingFeature(true)
    try {
      const response = await fetch(`/api/features/${feature.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to report feature')
      }

      setShowReportFeatureModal(false)
      alert('Feature reported successfully. Thank you for your feedback.')
    } catch (error) {
      console.error('Error reporting feature:', error)
      alert(error instanceof Error ? error.message : 'Failed to report feature. Please try again.')
    } finally {
      setIsReportingFeature(false)
    }
  }, [feature.id, isReportingFeature])

  const handleSubmitComment = useCallback(async () => {
    if (!user || !commentText.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      const response = await fetch(`/api/features/${feature.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: commentText.trim() }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      const data = result.data

      if (data) {
        setCommentText('')
        
        const abortController = new AbortController()
        const { data: commentsData, error: commentsError } = await safeFetch<CommentWithUser[]>(
          `/api/features/${feature.id}/comments`,
          { signal: abortController.signal }
        )

        if (!commentsError && commentsData) {
          const flatComments: CommentWithUser[] = []
          function flattenComments(comments: CommentWithReplies[]) {
            comments.forEach(comment => {
              flatComments.push({
                ...comment,
                user_display_name: comment.user_display_name || null,
                user_avatar_url: comment.user_avatar_url || null,
              })
              if (comment.replies && comment.replies.length > 0) {
                flattenComments(comment.replies)
              }
            })
          }
          flattenComments(commentsData as CommentWithReplies[])
          setComments(flatComments)
        }
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }, [user, feature.id, commentText, isSubmittingComment])

  const firstPhoto = feature.photos && feature.photos.length > 0
    ? feature.photos[0]
    : null

  return (
    <>
      {fullScreenImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setFullScreenImage(null)}
        >
          <button
            onClick={() => setFullScreenImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-m3-surface hover:bg-m3-surface/90 text-m3-on-surface flex items-center justify-center shadow-xl border border-m3-outline transition-all hover:scale-110 z-10"
            aria-label="Close full screen image"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={fullScreenImage}
            alt={feature.title}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className="w-full h-full flex flex-col sm:flex-col lg:flex-col bg-m3-surface rounded-lg border overflow-hidden sm:overflow-hidden overflow-y-auto relative">
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 z-50 flex-shrink-0">
        {isFeatureOwner && !isEditingFeature ? (
          <EditDeleteControls
            onEdit={handleEditFeature}
            onDelete={handleDeleteFeature}
            onClose={closeModal}
            isDeleting={isDeletingFeature}
            showClose={true}
            size="md"
            editLabel="Edit feature"
            deleteLabel="Delete feature"
            closeLabel="Close modal"
          />
        ) : !isEditingFeature && user ? (
          <EditDeleteControls
            onEdit={() => {}}
            onDelete={() => {}}
            onReport={handleReportFeatureClick}
            onClose={closeModal}
            isReporting={isReportingFeature}
            showEdit={false}
            showDelete={false}
            showReport={true}
            showClose={true}
            size="md"
            reportLabel="Report feature"
            closeLabel="Close modal"
          />
        ) : (
          <EditDeleteControls
            onEdit={() => {}}
            onDelete={() => {}}
            onClose={closeModal}
            showEdit={false}
            showDelete={false}
            showClose={true}
            size="md"
            closeLabel="Close modal"
          />
        )}
      </div>
      <header className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-m3-surface h-auto sm:h-auto lg:h-1/2 min-h-0 flex-shrink-0">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 lg:pr-4 flex items-center justify-center min-w-0 min-h-[200px] sm:min-h-[250px] lg:min-h-0 lg:h-full">
          <div 
            className="relative w-full h-full max-h-[300px] sm:max-h-[350px] lg:max-h-none flex items-center justify-center bg-m3-surface-variant rounded-xl overflow-hidden border-4 border-m3-outline cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => firstPhoto && setFullScreenImage(firstPhoto.full_url || firstPhoto.photo_url)}
          >
            {firstPhoto ? (
              <FeaturePhoto
                photoUrl={firstPhoto.full_url || firstPhoto.photo_url}
                alt={feature.title}
                className="w-full h-full"
                height="100%"
                objectFit="cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-m3-on-surface-variant text-base md:text-lg bg-m3-surface-variant/50">
                <span>No photo available</span>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleLike()
              }}
              disabled={!user || isLiking || likeData.user_liked}
              className={`absolute top-3 left-3 md:top-4 md:left-4 w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center shadow-xl transition-all z-10 ${
                likeData.user_liked
                  ? 'bg-red-500 text-white opacity-80 cursor-not-allowed'
                  : user
                  ? 'bg-m3-surface text-m3-on-surface hover:bg-m3-surface-bright hover:scale-110 active:scale-95'
                  : 'bg-m3-surface-dim text-m3-on-surface-variant cursor-not-allowed'
              } ${isLiking ? 'opacity-50 cursor-wait' : ''}`}
              title={likeData.user_liked ? 'You already liked this' : 'Like this feature'}
            >
              <FaHeart className={`w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 ${likeData.user_liked ? 'fill-current' : ''}`} />
              {likeData.count > 0 && (
                <span className="absolute -bottom-1 -right-1 min-w-[20px] md:min-w-[22px] h-5 md:h-6 px-1 md:px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  {likeData.count}
                </span>
              )}
            </button>
          </div>
        </div>
        
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 lg:pl-4 flex flex-col min-w-0 min-h-0 overflow-y-auto lg:overflow-y-auto">
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            {isEditingFeature ? (
              <div className="space-y-3">
                <Input
                  value={editFeatureData.title}
                  onChange={(e) => setEditFeatureData({ ...editFeatureData, title: e.target.value })}
                  placeholder="Title"
                  className="text-2xl font-bold"
                  maxLength={200}
                />
                <select
                  value={editFeatureData.feature_type}
                  onChange={(e) => {
                    const newType = e.target.value as FeatureType
                    setEditFeatureData({ ...editFeatureData, feature_type: newType })
                  }}
                  className="px-3 py-1.5 rounded-md border font-semibold text-xs"
                  style={{
                    backgroundColor: hexToRgba(getFeatureColor(editFeatureData.feature_type), 0.1),
                    borderColor: hexToRgba(getFeatureColor(editFeatureData.feature_type), 0.2),
                    color: getFeatureColor(editFeatureData.feature_type)
                  }}
                >
                  {Object.values(FeatureType).map(type => (
                    <option key={type} value={type}>{formatFeatureType(type)}</option>
                  ))}
                </select>
                <Textarea
                  value={editFeatureData.description}
                  onChange={(e) => setEditFeatureData({ ...editFeatureData, description: e.target.value })}
                  placeholder="Description"
                  className="min-h-[100px]"
                  maxLength={1000}
                />
                
                <div className="space-y-2">
                  <Label htmlFor="edit-photos" className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Photos
                  </Label>
                  
                  {(feature.photos && feature.photos.length > 0) && (
                    <div className="grid grid-cols-3 gap-2">
                      {feature.photos
                        .filter(photo => !photosToDelete.includes(photo.id))
                        .map((photo) => (
                          <div key={photo.id} className="relative group">
                            <img
                              src={photo.full_url || photo.photo_url}
                              alt="Feature photo"
                              className="w-full h-24 object-cover rounded border-4 border-m3-outline"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="absolute top-1 right-1 bg-m3-error text-m3-on-error rounded-full w-6 h-6 flex items-center justify-center hover:bg-m3-error-hover transition-colors opacity-0 group-hover:opacity-100"
                              aria-label="Delete photo"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                  
                  {photosToDelete.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {photosToDelete.length} photo(s) marked for deletion
                    </div>
                  )}
                  
                  <Input
                    id="edit-photos"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handlePhotoChange}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload new photos (max 5MB each)
                  </p>
                  
                  {newPhotoPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {newPhotoPreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`New photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded border-4 border-m3-outline"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewPhoto(index)}
                            className="absolute top-1 right-1 bg-m3-error text-m3-on-error rounded-full w-6 h-6 flex items-center justify-center hover:bg-m3-error-hover transition-colors"
                            aria-label={`Remove photo ${index + 1}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveFeature}
                    disabled={isSavingFeature || isUploadingPhotos || !editFeatureData.title.trim()}
                    className="flex-1"
                  >
                    {isSavingFeature || isUploadingPhotos ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEditFeature}
                    disabled={isSavingFeature || isUploadingPhotos}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="font-bold text-2xl md:text-3xl mb-2 md:mb-3 text-m3-primary leading-tight">
                  {feature.title}
                </h1>
                <FeatureTypeBadge 
                  featureType={feature.feature_type} 
                  size="md"
                />
              </div>
            )}

            {building && (
              <div className="pt-1 md:pt-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 md:mb-2">
                  Location
                </h3>
                <p className="text-lg md:text-xl font-bold text-foreground mb-1">{building.name}</p>
                {building.description && (
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {building.description}
                  </p>
                )}
              </div>
            )}

            {feature.description && (
              <div className="pt-2 md:pt-3">
                <div className="bg-m3-tertiary-container border rounded-xl p-4 md:p-5 shadow-sm">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 md:mb-3">
                    Description
                  </h3>
                  <p className="text-sm md:text-base text-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="h-auto sm:h-auto lg:h-1/2 flex flex-col min-h-0 overflow-hidden bg-m3-surface flex-shrink-0">
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 flex-shrink-0 bg-m3-surface">
          <h2 className="font-semibold text-sm md:text-base text-foreground">
            Comments <span className="text-muted-foreground font-normal">({comments.length})</span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 min-h-0 bg-m3-surface">
          {isLoadingComments ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <p className="text-base text-muted-foreground">No comments yet</p>
                <p className="text-sm text-muted-foreground/80">Be the first to share your thoughts!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 auto-rows-fr">
              {comments.map((comment) => {
                const isLongComment = comment.content.length > 100
                const previewText = isLongComment 
                  ? comment.content.substring(0, 100) + '...' 
                  : comment.content

                const isCommentOwner = user?.id && comment.user_id && comment.user_id === user.id

                return (
                  <article
                    key={comment.id}
                    className="p-4 md:p-5 border rounded-xl hover:bg-m3-surface-variant/50 transition-all bg-m3-secondary-container shadow-sm hover:shadow-md flex flex-col min-h-[112px] md:min-h-[128px] relative"
                  >
                    {!isCommentOwner && user && (
                      <div className="absolute top-2 right-2 z-10 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <EditDeleteControls
                          onEdit={() => {}}
                          onDelete={() => {}}
                          onReport={() => handleReportCommentClick(comment.id)}
                          isReporting={isReportingComment && reportingCommentId === comment.id}
                          showEdit={false}
                          showDelete={false}
                          showReport={true}
                          size="sm"
                          reportLabel="Report comment"
                        />
                      </div>
                    )}
                    <div 
                      className={`flex-1 min-w-0 mb-4 cursor-pointer ${!isCommentOwner && user ? 'pr-10 md:pr-12' : ''}`}
                      onClick={() => setSelectedComment(comment)}
                    >
                      <p className="text-sm md:text-base text-foreground leading-relaxed line-clamp-2 break-words">
                        {previewText}
                      </p>
                      {isLongComment && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Click to read more...
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 pt-3 flex-shrink-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-m3-surface-variant flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-m3-outline shadow-sm">
                        {comment.user_avatar_url ? (
                          <img
                            src={comment.user_avatar_url}
                            alt={comment.user_display_name || 'User'}
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <span className="text-xs font-bold text-foreground">
                            {(comment.user_display_name || comment.user_id.substring(0, 2)).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-normal text-sm md:text-base text-m3-primary mb-0.5">
                          {comment.user_display_name || 'Anonymous User'}
                        </h4>
                        {comment.created_at && (
                          <p className="text-xs md:text-sm text-m3-tertiary">
                            {new Date(comment.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <footer className="px-4 md:px-6 lg:px-8 py-3 md:py-4 flex-shrink-0 bg-m3-surface">
          {user ? (
            <div className="flex gap-2 md:gap-3 items-start">
              <div className="flex-1">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[60px] max-h-[100px] resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      handleSubmitComment()
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || isSubmittingComment}
                className="h-[60px] px-4 md:px-6 font-semibold whitespace-nowrap"
              >
                {isSubmittingComment ? 'Posting...' : 'Post'}
              </Button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">
                Please log in to leave a comment
              </p>
            </div>
          )}
        </footer>
      </main>

      {selectedComment && (
        <div 
          className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedComment(null)
            }
          }}
        >
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-m3-surface rounded-lg border shadow-2xl overflow-hidden flex flex-col">
            <button
              onClick={() => setSelectedComment(null)}
              className="absolute top-2 right-2 md:top-4 md:right-4 z-50 w-10 h-10 md:w-9 md:h-9 rounded-full bg-m3-surface hover:bg-m3-surface/90 text-m3-on-surface flex items-center justify-center shadow-xl border transition-all hover:scale-110 touch-manipulation"
              aria-label="Close comment"
            >
              <X className="w-5 h-5 md:w-5 md:h-5" />
            </button>
            <div className="absolute top-2 right-12 md:top-4 md:right-16 z-50 flex items-center gap-2 flex-shrink-0">
              {selectedComment && user?.id && selectedComment.user_id && selectedComment.user_id === user.id && editingCommentId !== selectedComment.id && (
                <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                  <EditDeleteControls
                    onEdit={() => handleEditComment(selectedComment)}
                    onDelete={() => handleDeleteComment(selectedComment.id)}
                    isEditing={editingCommentId === selectedComment.id}
                    isDeleting={isDeletingComment}
                    showEdit={editingCommentId !== selectedComment.id}
                    size="md"
                    editLabel="Edit comment"
                    deleteLabel="Delete comment"
                  />
                </div>
              )}
              {selectedComment && user?.id && selectedComment.user_id && selectedComment.user_id !== user.id && (
                <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                  <EditDeleteControls
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onReport={() => handleReportCommentClick(selectedComment.id)}
                    isReporting={isReportingComment && reportingCommentId === selectedComment.id}
                    showEdit={false}
                    showDelete={false}
                    showReport={true}
                    size="md"
                    reportLabel="Report comment"
                  />
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <article className="space-y-4">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-m3-surface-variant flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-m3-outline shadow-sm">
                    {selectedComment.user_avatar_url ? (
                      <img
                        src={selectedComment.user_avatar_url}
                        alt={selectedComment.user_display_name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <span className="text-sm md:text-base font-bold text-foreground">
                        {(selectedComment.user_display_name || selectedComment.user_id.substring(0, 2)).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base md:text-lg text-m3-primary mb-1">
                      {selectedComment.user_display_name || 'Anonymous User'}
                    </h4>
                    {selectedComment.created_at && (
                      <p className="text-xs md:text-sm text-m3-tertiary">
                        {new Date(selectedComment.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t">
                  {editingCommentId === selectedComment.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editCommentContent}
                        onChange={(e) => setEditCommentContent(e.target.value)}
                        placeholder="Edit comment"
                        className="min-h-[120px] text-sm"
                        maxLength={2000}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSaveComment(selectedComment.id)
                          }}
                          disabled={isSavingComment || !editCommentContent.trim()}
                        >
                          {isSavingComment ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingCommentId(null)
                            setEditCommentContent('')
                          }}
                          disabled={isSavingComment}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm md:text-base text-foreground leading-relaxed whitespace-pre-wrap break-words">
                      {selectedComment.content}
                    </p>
                  )}
                </div>
              </article>
            </div>
          </div>
        </div>
      )}

      <ReportModal
        isOpen={showReportCommentModal}
        onClose={() => {
          setShowReportCommentModal(false)
          setReportingCommentId(null)
        }}
        onSubmit={handleReportComment}
        title="Report Comment"
        isSubmitting={isReportingComment}
      />

      <ReportModal
        isOpen={showReportFeatureModal}
        onClose={() => setShowReportFeatureModal(false)}
        onSubmit={handleReportFeature}
        title="Report Feature"
        isSubmitting={isReportingFeature}
      />
    </div>
    </>
  )
}