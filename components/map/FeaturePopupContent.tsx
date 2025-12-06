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
import { FaHeart } from 'react-icons/fa'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FeaturePopupContentProps {
  feature: AccessibilityFeature
}

interface CommentWithUser extends FeatureComment {
  user_display_name?: string | null
  user_avatar_url?: string | null
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
  const [user, setUser] = useState<any>(null)
  const [selectedComment, setSelectedComment] = useState<CommentWithUser | null>(null)

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
          abortController.signal
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
          abortController.signal
        ),
        safeFetch<LikeData>(
          `/api/features/${feature.id}/likes`,
          abortController.signal
        )
      ])

      if (!commentsResult.error && commentsResult.data) {
        const flatComments: CommentWithUser[] = []
        function flattenComments(comments: any[]) {
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
        flattenComments(commentsResult.data)
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
          abortController.signal
        )

        if (!commentsError && commentsData) {
          const flatComments: CommentWithUser[] = []
          function flattenComments(comments: any[]) {
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
          flattenComments(commentsData)
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
    <div className="w-full h-full flex flex-col bg-background rounded-lg border overflow-hidden">
      <header className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-gradient-to-br from-card to-muted/20 h-1/2 min-h-0">
        <div className="p-4 md:p-6 lg:p-8 lg:pr-4 flex items-center justify-center min-w-0 min-h-0">
          <div className="relative w-full h-full flex items-center justify-center bg-muted rounded-xl overflow-hidden border-2 border-border">
            {firstPhoto ? (
              <FeaturePhoto
                photoUrl={firstPhoto.full_url || firstPhoto.photo_url}
                alt={feature.title}
                className="w-full h-full"
                height="100%"
                objectFit="cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-base md:text-lg bg-muted/50">
                <span>No photo available</span>
              </div>
            )}
            <button
              onClick={handleLike}
              disabled={!user || isLiking || likeData.user_liked}
              className={`absolute top-3 left-3 md:top-4 md:left-4 w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center shadow-xl transition-all z-10 ${
                likeData.user_liked
                  ? 'bg-red-500 text-white opacity-80 cursor-not-allowed'
                  : user
                  ? 'bg-white/95 text-gray-700 hover:bg-white hover:scale-110 active:scale-95'
                  : 'bg-white/90 text-gray-400 cursor-not-allowed'
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
        
        <div className="p-4 md:p-6 lg:p-8 lg:pl-4 flex flex-col min-w-0 min-h-0 overflow-y-auto">
          <div className="space-y-3 md:space-y-4">
            <div>
              <h1 className="font-bold text-2xl md:text-3xl mb-2 md:mb-3 text-foreground leading-tight">
                {feature.title}
              </h1>
              <div className="inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/10 text-primary font-semibold text-xs md:text-sm border border-primary/20">
                {formatFeatureType(feature.feature_type)}
              </div>
            </div>

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
                <div className="bg-card border rounded-xl p-4 md:p-5 shadow-sm">
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

      <main className="h-1/2 flex flex-col min-h-0 overflow-hidden">
        <div className="px-4 md:px-6 lg:px-8 py-3 md:py-4 flex-shrink-0">
          <h2 className="font-semibold text-sm md:text-base text-foreground">
            Comments <span className="text-muted-foreground font-normal">({comments.length})</span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-4 md:py-5 min-h-0">
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
                
                return (
                  <article
                    key={comment.id}
                    onClick={() => setSelectedComment(comment)}
                    className="p-4 md:p-5 border rounded-xl hover:bg-muted/50 transition-all bg-card shadow-sm hover:shadow-md cursor-pointer flex flex-col min-h-[112px] md:min-h-[128px]"
                  >
                    <div className="flex-1 min-w-0 mb-4">
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
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-background shadow-sm">
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
                        <h4 className="font-normal text-sm md:text-base text-foreground/80 mb-0.5">
                          {comment.user_display_name || 'Anonymous User'}
                        </h4>
                        {comment.created_at && (
                          <p className="text-xs md:text-sm text-muted-foreground">
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

        <footer className="px-4 md:px-6 lg:px-8 py-3 md:py-4 flex-shrink-0">
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
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-background rounded-lg border shadow-2xl overflow-hidden flex flex-col">
            <button
              onClick={() => setSelectedComment(null)}
              className="absolute top-2 right-2 md:top-4 md:right-4 z-50 w-8 h-8 md:w-9 md:h-9 rounded-full bg-background hover:bg-background/90 text-foreground flex items-center justify-center shadow-xl border transition-all hover:scale-110"
              aria-label="Close comment"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <article className="space-y-4">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-background shadow-sm">
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
                    <h4 className="font-semibold text-base md:text-lg text-foreground mb-1">
                      {selectedComment.user_display_name || 'Anonymous User'}
                    </h4>
                    {selectedComment.created_at && (
                      <p className="text-xs md:text-sm text-muted-foreground">
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
                  <p className="text-sm md:text-base text-foreground leading-relaxed whitespace-pre-wrap break-words">
                    {selectedComment.content}
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}