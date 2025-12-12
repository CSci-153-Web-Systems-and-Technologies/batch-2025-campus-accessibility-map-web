import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type FeatureComment, type FeatureCommentInsert } from '@/types/database'

interface ProfileData {
  id: string
  display_name: string | null
  avatar_url: string | null
}

interface CommentWithProfile extends FeatureComment {
  user_display_name: string | null
  user_avatar_url: string | null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: featureId } = await params

    const feature = await supabase
      .from('accessibility_features')
      .select('id')
      .eq('id', featureId)
      .is('deleted_at', null)
      .single()

    if (!feature.data) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      )
    }

    const { data: commentsData, error } = await supabase
      .from('feature_comments')
      .select('*')
      .eq('feature_id', featureId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    const comments = (commentsData || []) as FeatureComment[]
    
    const userIds = [...new Set(comments.map((c) => c.user_id))]
    
    const { data: profilesData } = await supabase
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    const profilesMap = new Map<string, ProfileData>()
    if (profilesData) {
      profilesData.forEach((profile) => {
        profilesMap.set(profile.id, profile as ProfileData)
      })
    }

    const commentsWithProfiles: CommentWithProfile[] = comments.map((comment) => {
      const profile = profilesMap.get(comment.user_id)
      return {
        ...comment,
        user_display_name: profile?.display_name || null,
        user_avatar_url: profile?.avatar_url || null,
      }
    })

    const commentsMap = new Map<string, CommentWithProfile & { replies: CommentWithProfile[] }>()
    const rootComments: (CommentWithProfile & { replies?: CommentWithProfile[] })[] = []

    commentsWithProfiles.forEach((comment) => {
      commentsMap.set(comment.id, { ...comment, replies: [] })
    })

    commentsWithProfiles.forEach((comment) => {
      if (comment.parent_id) {
        const parent = commentsMap.get(comment.parent_id)
        const currentComment = commentsMap.get(comment.id)
        if (parent && currentComment) {
          parent.replies.push(currentComment)
        }
      } else {
        const currentComment = commentsMap.get(comment.id)
        if (currentComment) {
          rootComments.push(currentComment)
        }
      }
    })

    return NextResponse.json({ data: rootComments })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: featureId } = await params

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const feature = await supabase
      .from('accessibility_features')
      .select('id')
      .eq('id', featureId)
      .is('deleted_at', null)
      .single()

    if (!feature.data) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (body.content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment content too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    if (body.parent_id) {
      const parentComment = await supabase
        .from('feature_comments')
        .select('id, feature_id')
        .eq('id', body.parent_id)
        .is('deleted_at', null)
        .single()

      if (!parentComment.data) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }

      if (parentComment.data.feature_id !== featureId) {
        return NextResponse.json(
          { error: 'Parent comment does not belong to this feature' },
          { status: 400 }
        )
      }
    }

    // Build insert payload without referencing `parent_id` unless provided by client.
    // Some DB schemas may not have a `parent_id` column (flat comments only).
    const commentData: Partial<FeatureCommentInsert> = {
      feature_id: featureId,
      user_id: user.id,
      content: body.content.trim(),
    }

    if (Object.prototype.hasOwnProperty.call(body, 'parent_id') && body.parent_id) {
      ;(commentData as any).parent_id = body.parent_id
    }

    const { data, error } = await supabase
      .from('feature_comments')
      .insert(commentData)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create comment', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

