import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type FeatureCommentInsert } from '@/types/database'

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
      console.error('Error fetching comments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    const comments = commentsData || []
    
    const userIds = [...new Set(comments.map((c: any) => c.user_id))]
    
    const { data: profilesData } = await supabase
      .from('user_profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    const profilesMap = new Map()
    if (profilesData) {
      profilesData.forEach((profile: any) => {
        profilesMap.set(profile.id, profile)
      })
    }

    const commentsWithProfiles = comments.map((comment: any) => {
      const profile = profilesMap.get(comment.user_id)
      return {
        ...comment,
        user_display_name: profile?.display_name || null,
        user_avatar_url: profile?.avatar_url || null,
      }
    })

    const commentsMap = new Map()
    const rootComments: (typeof commentsWithProfiles[0] & { replies?: typeof commentsWithProfiles })[] = []

    commentsWithProfiles.forEach((comment) => {
      commentsMap.set(comment.id, { ...comment, replies: [] })
    })

    commentsWithProfiles.forEach((comment) => {
      if (comment.parent_id) {
        const parent = commentsMap.get(comment.parent_id)
        if (parent) {
          parent.replies.push(commentsMap.get(comment.id))
        }
      } else {
        rootComments.push(commentsMap.get(comment.id))
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

    const commentData: FeatureCommentInsert = {
      feature_id: featureId,
      user_id: user.id,
      content: body.content.trim(),
      parent_id: body.parent_id || null,
    }

    const { data, error } = await supabase
      .from('feature_comments')
      .insert(commentData)
      .select()
      .single()

    if (error) {
      console.error('Error creating comment:', error)
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

